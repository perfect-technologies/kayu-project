import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { ActivityLogService } from "../activity/activity-log.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PlaceTreeService } from "../places/place-tree.service";
import { ProvidersAvailabilityService } from "../providers/providers-availability.service";
import { addDays, localParts, localSlotToInstant } from "../providers/schedule";
import { SafetyService } from "../safety/safety.service";
import { SiteSettingsService } from "../settings/site-settings.service";
import { BookingViewService } from "./booking-view.service";
import { BookingsService } from "./bookings.service";

const databaseUrl = process.env.BOOKINGS_TEST_DATABASE_URL;
const requireDatabase = process.env.BOOKINGS_REQUIRE_DATABASE === "true";
const backendDir = resolve(__dirname, "../../..");

function disposableDatabaseName(url: string): string {
  const name = new URL(url).pathname.replace(/^\//, "");
  if (!/^kayu_(ci|test)_bookings$/.test(name)) {
    throw new Error("BOOKINGS_TEST_DATABASE_URL must name a dedicated kayu_ci/test_bookings database");
  }
  return name;
}

// CREATE/DROP DATABASE cannot run inside the transaction `prisma db execute` opens, so the
// admin statements go through psql against the allowlisted disposable database only.
function runPostgresAdminCommand(url: string, command: string): void {
  const admin = new URL(url);
  admin.pathname = "/postgres";
  admin.search = "";
  execFileSync("psql", ["--dbname", admin.toString(), "--command", command], { stdio: "pipe" });
}

function slotTaken(error: unknown): boolean {
  return (
    error instanceof HttpException &&
    error.getStatus() === 409 &&
    (error.getResponse() as { code?: string }).code === "SLOT_TAKEN"
  );
}

test(
  "two clients racing for one slot get exactly one PENDING booking and one SLOT_TAKEN",
  { skip: !databaseUrl && !requireDatabase },
  async () => {
    assert.ok(databaseUrl, "BOOKINGS_TEST_DATABASE_URL is required for the booking race test");
    const databaseName = disposableDatabaseName(databaseUrl);
    runPostgresAdminCommand(databaseUrl, `DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE);`);
    runPostgresAdminCommand(databaseUrl, `CREATE DATABASE "${databaseName}";`);

    let prisma: PrismaService | undefined;
    try {
      execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
        cwd: backendDir,
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: "pipe",
      });

      process.env.DATABASE_URL = databaseUrl;
      prisma = new PrismaService();
      await prisma.onModuleInit();

      const category = await prisma.category.create({
        data: { name: "Plomberie", slug: "race-plomberie" },
      });
      const subcategory = await prisma.subcategory.create({
        data: { categoryId: category.id, name: "Fuites", slug: "race-fuites" },
      });
      const [providerUser, clientA, clientB] = await Promise.all(
        ["race_provider", "race_client_a", "race_client_b"].map((key) =>
          prisma!.user.create({
            data: {
              authUserId: `auth_${key}`,
              firstName: key,
              role: key === "race_provider" ? "PROVIDER" : "CLIENT",
            },
          }),
        ),
      );
      const provider = await prisma.provider.create({
        data: {
          userId: providerUser!.id,
          displayName: "Plomberie Race",
          subcategoryId: subcategory.id,
          timezone: "Africa/Kinshasa",
          slotDurationMin: 60,
          slotBufferMin: 0,
          availabilityRules: {
            create: Array.from({ length: 7 }, (_, dayOfWeek) => ({
              dayOfWeek,
              startTime: "08:00",
              endTime: "18:00",
            })),
          },
        },
      });

      const places = new PlaceTreeService(prisma);
      const service = new BookingsService(
        prisma,
        new ProvidersAvailabilityService(prisma),
        places,
        new SafetyService(prisma),
        new SiteSettingsService(prisma),
        new NotificationsService(prisma),
        new ActivityLogService(prisma),
        new BookingViewService(prisma, places),
      );

      const date = addDays(localParts("Africa/Kinshasa", new Date()).date, 7);
      const input = (clientPhone: string) => ({
        providerId: provider.id,
        date,
        time: "10:00",
        clientPhone,
      });

      const results = await Promise.allSettled([
        service.create(clientA!, input("+243810000001")),
        service.create(clientB!, input("+243810000002")),
      ]);

      const fulfilled = results.filter((result) => result.status === "fulfilled");
      const rejected = results.filter((result) => result.status === "rejected");
      assert.equal(fulfilled.length, 1, JSON.stringify(results.map((r) => r.status)));
      assert.equal(rejected.length, 1);
      assert.ok(slotTaken((rejected[0] as PromiseRejectedResult).reason));
      const winner = (fulfilled[0] as PromiseFulfilledResult<Awaited<ReturnType<BookingsService["create"]>>>).value;
      assert.equal(winner.status, "PENDING");

      const scheduledAt = localSlotToInstant(date, "10:00", "Africa/Kinshasa");
      assert.equal(
        await prisma.booking.count({
          where: { providerId: provider.id, scheduledAt, status: { in: ["PENDING", "CONFIRMED"] } },
        }),
        1,
      );
      assert.equal(
        await prisma.notification.count({ where: { userId: providerUser!.id, type: "BOOKING_NEW" } }),
        1,
      );

      await assert.rejects(
        () =>
          prisma!.booking.create({
            data: {
              clientId: clientA!.id,
              providerId: provider.id,
              scheduledAt,
              durationMin: 60,
              bufferMin: 0,
              timezone: "Africa/Kinshasa",
              clientPhone: "+243810000009",
            },
          }),
        (error: Error & { code?: string }) => error.code === "P2002",
      );

      const loserClient = winner.clientId === clientA!.id ? clientB! : clientA!;
      const winnerClient = winner.clientId === clientA!.id ? clientA! : clientB!;
      await assert.rejects(() => service.create(loserClient, input("+243810000003")), slotTaken);

      await service.cancel(winnerClient, winner.id, {});
      const rebooked = await service.create(loserClient, input("+243810000004"));
      assert.equal(rebooked.status, "PENDING");
      assert.equal(
        await prisma.booking.count({ where: { providerId: provider.id, scheduledAt } }),
        2,
      );
    } finally {
      await prisma?.$disconnect();
      runPostgresAdminCommand(databaseUrl, `DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE);`);
    }
  },
);

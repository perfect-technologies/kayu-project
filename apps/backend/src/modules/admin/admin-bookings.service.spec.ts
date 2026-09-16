import assert from "node:assert/strict";
import test from "node:test";
import { AdminBookingsService } from "./admin-bookings.service";

test("list searches client, provider and phone fields and exposes the local slot", async () => {
  let args: Record<string, any> = {};
  const prisma = {
    booking: {
      count: async () => 1,
      findMany: async (input: Record<string, any>) => {
        args = input;
        return [
          {
            id: "booking_1",
            status: "CONFIRMED",
            scheduledAt: new Date("2030-01-07T13:15:00.000Z"),
            timezone: "Africa/Kinshasa",
            clientPhone: "+243810000001",
            agreedPrice: null,
            createdAt: new Date("2030-01-01T09:00:00.000Z"),
            cancelReason: null,
            client: { id: "client_1", firstName: "Awa", lastName: "Mbuyi", phone: "+243810000001" },
            provider: { id: "provider_1", displayName: "Plomberie Paul", phone: "+243810000002" },
          },
        ];
      },
    },
  };
  const service = new AdminBookingsService(prisma as never);

  const page = await service.list({ page: 1, limit: 50, status: "CONFIRMED", q: "0000" });

  assert.equal(args.where.status, "CONFIRMED");
  assert.deepEqual(
    args.where.OR.map((clause: Record<string, unknown>) => Object.keys(clause)[0]),
    ["clientPhone", "client", "client", "client", "provider", "provider"],
  );
  assert.deepEqual(page.items[0]!.scheduledLocal, { date: "2030-01-07", time: "14:15" });
  assert.deepEqual(page.items[0]!.client, { id: "client_1", name: "Awa Mbuyi", phone: "+243810000001" });
  assert.equal(page.total, 1);
});

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { after, before, describe, test } from "node:test";
import { Global, Module, type INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { PrismaClient } from "@prisma/client";
import { featureModules } from "../../app.modules";
import { SupabaseJwtService } from "../../common/auth/supabase-jwt.service";
import type { SupabaseJwtClaims } from "../../common/auth/types";
import { AllExceptionsFilter } from "../../common/filters/all-exceptions.filter";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { RateLimiterService } from "../../common/rate-limit/rate-limiter.service";
import { DatabaseModule } from "../../database/database.module";
import { addDays, localParts } from "../../modules/providers/schedule";
import { SUPABASE_CLIENT } from "../../modules/storage/storage.service";

// The launch harness drives the real modules over HTTP against a disposable Postgres database;
// only Supabase (JWT verification, storage, auth admin) is faked.
const databaseUrl = process.env.LAUNCH_HARNESS_DATABASE_URL;
const requireDatabase = process.env.LAUNCH_HARNESS_REQUIRE_DATABASE === "true";
const backendDir = resolve(__dirname, "../../..");
const TIMEZONE = "Africa/Kinshasa";

type Identity = { authUserId: string; phone?: string; email?: string };
type JsonResponse = { status: number; body: any };

const tokenFor = (identity: Identity) =>
  `harness.${Buffer.from(JSON.stringify(identity)).toString("base64url")}`;

class FakeJwtService {
  async verify(token: string): Promise<SupabaseJwtClaims> {
    if (!token.startsWith("harness.")) throw new Error("invalid token");
    const identity = JSON.parse(
      Buffer.from(token.slice("harness.".length), "base64url").toString("utf8"),
    ) as Identity;
    return { sub: identity.authUserId, phone: identity.phone, email: identity.email };
  }
}

function assertDisposableDatabase(url: string): string {
  const name = new URL(url).pathname.replace(/^\//, "");
  if (!/^kayu_(ci|test)_launch_harness$/.test(name)) {
    throw new Error("LAUNCH_HARNESS_DATABASE_URL must name a kayu_ci/test_launch_harness database");
  }
  return name;
}

// CREATE/DROP DATABASE cannot run inside Prisma's transaction wrapper, so psql talks to the
// maintenance database directly.
function psqlAdmin(url: string, command: string) {
  const admin = new URL(url);
  admin.pathname = "/postgres";
  admin.search = "";
  execFileSync("psql", ["--dbname", admin.toString(), "--command", command], { stdio: "pipe" });
}

function createFakeSupabase() {
  const calls = {
    removed: [] as Array<{ bucket: string; paths: string[] }>,
    deletedAuthUsers: [] as string[],
  };
  const client = {
    storage: {
      from(bucket: string) {
        return {
          async createSignedUploadUrl(path: string) {
            return {
              data: { signedUrl: `https://storage.test/upload/${bucket}/${path}`, token: "upload-token", path },
              error: null,
            };
          },
          async createSignedUrl(path: string, expiresIn: number) {
            return {
              data: { signedUrl: `https://storage.test/sign/${bucket}/${path}?expires=${expiresIn}` },
              error: null,
            };
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `https://storage.test/storage/v1/object/public/${bucket}/${path}` } };
          },
          async remove(paths: string[]) {
            calls.removed.push({ bucket, paths });
            return { data: paths.map((name) => ({ name })), error: null };
          },
        };
      },
      async listBuckets() {
        return { data: [], error: null };
      },
    },
    auth: {
      admin: {
        async deleteUser(id: string) {
          calls.deletedAuthUsers.push(id);
          return { data: {}, error: null };
        },
      },
    },
  };
  return { client, calls };
}

async function bootApp(url: string) {
  process.env.DATABASE_URL = url;
  delete process.env.STORAGE_ENV_PREFIX;
  const supabase = createFakeSupabase();

  @Global()
  @Module({
    providers: [
      { provide: SupabaseJwtService, useClass: FakeJwtService },
      SupabaseGuard,
      RolesGuard,
      RateLimiterService,
    ],
    exports: [SupabaseJwtService, SupabaseGuard, RolesGuard, RateLimiterService],
  })
  class HarnessCommonModule {}

  @Global()
  @Module({
    providers: [{ provide: SUPABASE_CLIENT, useValue: supabase.client }],
    exports: [SUPABASE_CLIENT],
  })
  class HarnessSupabaseModule {}

  @Module({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      DatabaseModule,
      HarnessSupabaseModule,
      HarnessCommonModule,
      ...featureModules,
    ],
  })
  class HarnessModule {}

  const app: INestApplication = await NestFactory.create(HarnessModule, { logger: false });
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new AllExceptionsFilter("test"));
  await app.listen(0, "127.0.0.1");
  const address = app.getHttpServer().address();
  const port = address && typeof address === "object" ? address.port : null;
  if (!port) throw new Error("Failed to resolve harness port");
  return { app, supabase, baseUrl: `http://127.0.0.1:${port}/api` };
}

async function seedFixtures(prisma: PrismaClient) {
  await prisma.category.create({
    data: {
      id: "cat_batiment",
      name: "Bâtiment",
      slug: "batiment",
      icon: "Hammer",
      subcategories: {
        create: [{ id: "sub_plomberie", name: "Plomberie", slug: "plomberie" }],
      },
    },
  });
  await prisma.place.create({ data: { id: "place_cd", kind: "COUNTRY", label: "RDC", slug: "cd" } });
  await prisma.place.create({
    data: { id: "place_kin_prov", kind: "PROVINCE", label: "Kinshasa", slug: "cd-province-kinshasa", parentId: "place_cd" },
  });
  await prisma.place.create({
    data: {
      id: "place_kin",
      kind: "CITY",
      label: "Kinshasa",
      slug: "cd-province-kinshasa-city-kinshasa",
      parentId: "place_kin_prov",
      latitude: -4.325,
      longitude: 15.322,
    },
  });
  await prisma.place.create({
    data: {
      id: "place_gombe",
      kind: "COMMUNE",
      label: "Gombe",
      slug: "cd-province-kinshasa-city-kinshasa-commune-gombe",
      parentId: "place_kin",
    },
  });
  await prisma.referenceItem.createMany({
    data: [
      { id: "ref_fr", type: "LANGUAGE", label: "Français", slug: "language-francais" },
      { id: "ref_home", type: "INTERVENTION_MODE", label: "À domicile", slug: "mode-a-domicile" },
      { id: "ref_cdf", type: "CURRENCY", label: "CDF", slug: "currency-cdf" },
      { id: "ref_job", type: "PRICE_UNIT", label: "Par prestation", slug: "price-unit-par-prestation" },
      { id: "ref_skill_leak", type: "SKILL", label: "Fuites", slug: "skill-fuites", categoryId: "cat_batiment" },
    ],
  });
  await prisma.user.create({
    data: {
      id: "user_admin",
      authUserId: "auth-admin",
      phone: "+243899000000",
      firstName: "Ada",
      lastName: "Admin",
      role: "ADMIN",
      roleSelectedAt: new Date(),
    },
  });
}

describe("launch-critical harness (real Postgres)", { skip: !databaseUrl && !requireDatabase }, () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let calls: ReturnType<typeof createFakeSupabase>["calls"];
  const captured = new Map<string, unknown>();
  let call: (label: string, path: string, options?: { token?: string; body?: unknown }) => Promise<JsonResponse>;

  const pro = tokenFor({ authUserId: "auth-pro", phone: "+243810000001" });
  const client = tokenFor({ authUserId: "auth-client", phone: "+243820000002" });
  const other = tokenFor({ authUserId: "auth-other", phone: "+243830000003" });
  const admin = tokenFor({ authUserId: "auth-admin", phone: "+243899000000" });

  const state: {
    providerId?: string;
    proUserId?: string;
    clientUserId?: string;
    conversationId?: string;
    bookingId?: string;
    reportId?: string;
    date?: string;
    time?: string;
  } = {};

  before(async () => {
    assert.ok(databaseUrl, "LAUNCH_HARNESS_DATABASE_URL is required when LAUNCH_HARNESS_REQUIRE_DATABASE=true");
    const name = assertDisposableDatabase(databaseUrl);
    psqlAdmin(databaseUrl, `DROP DATABASE IF EXISTS "${name}" WITH (FORCE);`);
    psqlAdmin(databaseUrl, `CREATE DATABASE "${name}";`);
    execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
      cwd: backendDir,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: "pipe",
    });

    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    await seedFixtures(prisma);

    const booted = await bootApp(databaseUrl);
    app = booted.app;
    calls = booted.supabase.calls;

    call = async (label, path, options = {}) => {
      const method = label.split(" ")[0]!;
      const response = await fetch(`${booted.baseUrl}${path}`, {
        method,
        headers: {
          ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
          ...(options.body !== undefined ? { "content-type": "application/json" } : {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });
      const text = await response.text();
      const body = text ? JSON.parse(text) : null;
      const key = `${label} → ${response.status}`;
      if (!captured.has(key)) captured.set(key, body);
      return { status: response.status, body };
    };
  });

  after(async () => {
    const target = process.env.LAUNCH_HARNESS_CAPTURE;
    if (target) writeFileSync(target, `${JSON.stringify(Object.fromEntries(captured), null, 2)}\n`);
    await app?.close();
    await prisma?.$disconnect();
    if (databaseUrl && process.env.LAUNCH_HARNESS_KEEP_DATABASE !== "true") {
      psqlAdmin(databaseUrl, `DROP DATABASE IF EXISTS "${assertDisposableDatabase(databaseUrl)}" WITH (FORCE);`);
    }
  });

  test("an OTP user accepts the terms and publishes a provider profile", async () => {
    const me = await call("GET /me", "/me", { token: pro });
    assert.equal(me.status, 200, JSON.stringify(me.body));
    assert.equal(me.body.user.role, "CLIENT");
    assert.equal(me.body.user.provider, null);
    state.proUserId = me.body.user.id;

    const terms = await call("POST /me/accept-terms", "/me/accept-terms", { token: pro });
    assert.equal(terms.status, 200, JSON.stringify(terms.body));
    assert.ok(terms.body.user.termsAcceptedAt);

    const signed = await call("POST /me/uploads/sign", "/me/uploads/sign", {
      token: pro,
      body: { purpose: "media", fileName: "atelier.jpg", mimeType: "image/jpeg", bytes: 120_000 },
    });
    assert.equal(signed.status, 200, JSON.stringify(signed.body));
    assert.match(signed.body.path, new RegExp(`^media/${state.proUserId}/`));

    const rejected = await call("POST /me/provider", "/me/provider", {
      token: pro,
      body: { displayName: "X" },
    });
    assert.equal(rejected.status, 400);

    const published = await call("POST /me/provider", "/me/provider", {
      token: pro,
      body: {
        displayName: "Plomberie Mukendi",
        phone: "+243 810 000 001",
        whatsapp: "+243810000001",
        subcategoryId: "sub_plomberie",
        yearsExperience: 8,
        skillIds: ["ref_skill_leak"],
        freeSkills: ["Chauffe-eau"],
        description: "Dépannage rapide à Gombe et alentours.",
        placeId: "place_gombe",
        addressLine: "12 avenue de la Justice",
        latitude: -4.3101,
        longitude: 15.2872,
        languageIds: ["ref_fr"],
        modeIds: ["ref_home"],
        pricing: { amount: 25000, currencyId: "ref_cdf", unitId: "ref_job" },
        schedule: {
          timezone: TIMEZONE,
          slotDurationMin: 60,
          slotBufferMin: 0,
          rules: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({ dayOfWeek, startTime: "08:00", endTime: "18:00" })),
          exceptions: [],
        },
        media: [
          { kind: "IMAGE", path: signed.body.path, title: "Atelier" },
          { kind: "VIDEO_YOUTUBE", url: "https://youtu.be/M7lc1UVf-VE" },
        ],
        social: { facebookUrl: "https://www.facebook.com/plomberie.mukendi" },
        acceptTerms: true,
      },
    });
    assert.equal(published.status, 201, JSON.stringify(published.body));
    state.providerId = published.body.id;
    assert.equal(published.body.media.length, 2);
    assert.equal(published.body.media[1].youtubeId, "M7lc1UVf-VE");

    const again = await call("POST /me/provider", "/me/provider", { token: pro, body: published.body });
    assert.ok([400, 403, 409].includes(again.status));

    const after = await call("GET /me", "/me", { token: pro });
    assert.equal(after.body.user.role, "PROVIDER");
    assert.equal(after.body.user.provider.id, state.providerId);
    assert.equal(after.body.user.provider.verificationStatus, "PENDING");
  });

  test("a second user finds the provider and sees contacts only once signed in", async () => {
    const me = await call("GET /me", "/me", { token: client });
    assert.equal(me.status, 200);
    state.clientUserId = me.body.user.id;

    const profile = await call("PATCH /me/profile", "/me/profile", {
      token: client,
      body: { firstName: "Paul", lastName: "Kabasele", placeId: "place_gombe" },
    });
    assert.equal(profile.status, 200, JSON.stringify(profile.body));
    assert.equal(profile.body.user.profileComplete, true);

    const publicSettings = await call("GET /settings/public", "/settings/public");
    assert.equal(publicSettings.status, 200);
    assert.equal(publicSettings.body.feat_booking, true);

    const tree = await call("GET /categories/tree", "/categories/tree");
    assert.equal(tree.status, 200, JSON.stringify(tree.body));
    assert.equal(tree.body.items[0].providerCount, 1);

    const places = await call("GET /places", "/places?parentId=place_kin");
    assert.equal(places.status, 200);
    assert.deepEqual(places.body.items.map((place: { id: string }) => place.id), ["place_gombe"]);

    const references = await call("GET /references", "/references?type=LANGUAGE");
    assert.equal(references.status, 200);
    assert.equal(references.body.items[0].label, "Français");

    const stats = await call("GET /stats", "/stats");
    assert.equal(stats.status, 200);
    assert.deepEqual(stats.body, { categories: 1, countries: 2, providers: 1, verifiedProviders: 0 });

    const search = await call(
      "GET /providers",
      "/providers?categorySlug=batiment&placeId=place_kin&lat=-4.32&lng=15.3&sort=distance",
      { token: client },
    );
    assert.equal(search.status, 200, JSON.stringify(search.body));
    assert.equal(search.body.total, 1);
    const card = search.body.items[0];
    assert.equal(card.id, state.providerId);
    assert.deepEqual(card.categoryChain.map((node: { slug: string }) => node.slug), ["batiment", "plomberie"]);
    assert.deepEqual(card.placeChain.map((node: { id: string }) => node.id), [
      "place_cd",
      "place_kin_prov",
      "place_kin",
      "place_gombe",
    ]);
    assert.equal(typeof card.distanceKm, "number");

    const anonymous = await call("GET /providers/:id (anonymous)", `/providers/${state.providerId}`);
    assert.equal(anonymous.status, 200);
    assert.equal(anonymous.body.contactsLocked, true);
    assert.equal(anonymous.body.contacts, null);

    const signedIn = await call("GET /providers/:id", `/providers/${state.providerId}`, { token: client });
    assert.equal(signedIn.status, 200);
    assert.equal(signedIn.body.contactsLocked, false);
    assert.equal(signedIn.body.contacts.phone, "+243810000001");
    assert.equal(signedIn.body.scheduleSummary.length, 7);
  });

  test("the client messages the provider, and unread counters follow the thread", async () => {
    const started = await call("POST /conversations", "/conversations", {
      token: client,
      body: { providerId: state.providerId, subject: "Fuite cuisine", body: "Bonjour, êtes-vous disponible demain ?" },
    });
    assert.equal(started.status, 201, JSON.stringify(started.body));
    state.conversationId = started.body.conversation.id;

    const inbox = await call("GET /conversations", "/conversations", { token: pro });
    assert.equal(inbox.status, 200);
    assert.equal(inbox.body.unreadTotal, 1);
    assert.equal(inbox.body.items[0].unread, 1);

    const thread = await call("GET /conversations/:id/messages", `/conversations/${state.conversationId}/messages`, {
      token: pro,
    });
    assert.equal(thread.status, 200);
    assert.equal(thread.body.items.length, 1);

    const upload = await call("POST /me/uploads/sign (attachment)", "/me/uploads/sign", {
      token: pro,
      body: { purpose: "attachments", fileName: "devis.jpg", mimeType: "image/jpeg", bytes: 80_000 },
    });
    assert.equal(upload.status, 200, JSON.stringify(upload.body));
    assert.equal(upload.body.bucket, "message-attachments");

    const reply = await call("POST /conversations/:id/messages", `/conversations/${state.conversationId}/messages`, {
      token: pro,
      body: {
        body: "Oui, réservez un créneau.",
        attachments: [{ kind: "image", path: upload.body.path, mime: "image/jpeg", bytes: 80_000 }],
      },
    });
    assert.equal(reply.status, 201, JSON.stringify(reply.body));
    assert.equal(reply.body.attachments[0].path, upload.body.path);

    const participantRead = await call(
      "GET /me/media/sign-read",
      `/me/media/sign-read?path=${encodeURIComponent(upload.body.path)}`,
      { token: client },
    );
    assert.equal(participantRead.status, 200, JSON.stringify(participantRead.body));
    assert.ok(participantRead.body.url);
    assert.ok(participantRead.body.expiresAt);

    const strangerRead = await call(
      "GET /me/media/sign-read (stranger)",
      `/me/media/sign-read?path=${encodeURIComponent(upload.body.path)}`,
      { token: other },
    );
    assert.equal(strangerRead.status, 403);

    const cleared = await call("GET /conversations", "/conversations", { token: pro });
    assert.equal(cleared.body.unreadTotal, 0);

    const clientInbox = await call("GET /conversations (client)", "/conversations", { token: client });
    assert.equal(clientInbox.body.unreadTotal, 1);
    assert.equal(clientInbox.body.items[0].lastPreview, "Oui, réservez un créneau.");

    const stranger = await call("GET /conversations/:id/messages (stranger)", `/conversations/${state.conversationId}/messages`, {
      token: other,
    });
    assert.equal(stranger.status, 404);
  });

  test("the client books a real slot; the same slot cannot be taken twice", async () => {
    const tomorrow = addDays(localParts(TIMEZONE, new Date()).date, 1);
    const availability = await call(
      "GET /providers/:id/availability",
      `/providers/${state.providerId}/availability?date=${tomorrow}`,
    );
    assert.equal(availability.status, 200, JSON.stringify(availability.body));
    assert.equal(availability.body.timezone, TIMEZONE);
    assert.ok(availability.body.slots.length > 0);
    state.date = tomorrow;
    state.time = availability.body.slots[0];

    const anonymous = await call("POST /bookings (anonymous)", "/bookings", {
      body: { providerId: state.providerId, date: state.date, time: state.time, clientPhone: "+243820000002" },
    });
    assert.equal(anonymous.status, 401);

    const asProvider = await call("POST /bookings (provider)", "/bookings", {
      token: pro,
      body: { providerId: state.providerId, date: state.date, time: state.time, clientPhone: "+243810000001" },
    });
    assert.equal(asProvider.status, 403);

    const booked = await call("POST /bookings", "/bookings", {
      token: client,
      body: {
        providerId: state.providerId,
        date: state.date,
        time: state.time,
        clientPhone: "+243820000002",
        clientNotes: "Fuite sous l'évier",
        placeId: "place_gombe",
        addressLine: "4 avenue Kasa-Vubu",
      },
    });
    assert.equal(booked.status, 201, JSON.stringify(booked.body));
    assert.equal(booked.body.status, "PENDING");
    assert.deepEqual(booked.body.scheduledLocal, { date: state.date, time: state.time });
    state.bookingId = booked.body.id;

    await call("GET /me", "/me", { token: other });
    const taken = await call("POST /bookings (slot taken)", "/bookings", {
      token: other,
      body: { providerId: state.providerId, date: state.date, time: state.time, clientPhone: "+243830000003" },
    });
    assert.equal(taken.status, 409);
    assert.equal(taken.body.code, "SLOT_TAKEN");

    const invalid = await call("POST /bookings (invalid)", "/bookings", {
      token: client,
      body: { providerId: state.providerId, date: "2026-02-30", time: "9h", clientPhone: "123" },
    });
    assert.equal(invalid.status, 400);

    const refreshed = await call(
      "GET /providers/:id/availability (after booking)",
      `/providers/${state.providerId}/availability?date=${state.date}`,
    );
    assert.equal(refreshed.body.slots.includes(state.time), false);
  });

  test("the provider confirms, then completes with an agreed price that reaches the ledger", async () => {
    const pending = await call("GET /bookings (provider)", "/bookings?status=PENDING", { token: pro });
    assert.equal(pending.status, 200);
    assert.equal(pending.body.items[0].id, state.bookingId);
    assert.equal(pending.body.items[0].side, "provider");

    const clientConfirm = await call("POST /bookings/:id/confirm (client)", `/bookings/${state.bookingId}/confirm`, {
      token: client,
    });
    assert.equal(clientConfirm.status, 403);

    const earlyComplete = await call("POST /bookings/:id/complete (pending)", `/bookings/${state.bookingId}/complete`, {
      token: pro,
      body: {},
    });
    assert.equal(earlyComplete.status, 409);

    const confirmed = await call("POST /bookings/:id/confirm", `/bookings/${state.bookingId}/confirm`, { token: pro });
    assert.equal(confirmed.status, 200, JSON.stringify(confirmed.body));
    assert.equal(confirmed.body.status, "CONFIRMED");

    const completed = await call("POST /bookings/:id/complete", `/bookings/${state.bookingId}/complete`, {
      token: pro,
      body: { agreedPrice: 50000, isPaid: true },
    });
    assert.equal(completed.status, 200, JSON.stringify(completed.body));
    assert.equal(completed.body.status, "COMPLETED");
    assert.equal(completed.body.commissionAmt, 5000);
    assert.equal(completed.body.providerNetAmt, 45000);

    const summary = await call("GET /pro/earnings/summary", "/pro/earnings/summary", { token: pro });
    assert.equal(summary.status, 200, JSON.stringify(summary.body));
    assert.equal(summary.body.total, 45000);
    assert.equal(summary.body.byDay.length, 7);

    const transactions = await call("GET /pro/earnings/transactions", "/pro/earnings/transactions", { token: pro });
    assert.equal(transactions.status, 200);
    assert.equal(transactions.body.total, 1);
    assert.equal(transactions.body.items[0].type, "EARNING");
    assert.equal(transactions.body.items[0].status, "COMPLETED");

    const dashboard = await call("GET /dashboard/provider", "/dashboard/provider", { token: pro });
    assert.equal(dashboard.status, 200, JSON.stringify(dashboard.body));
    assert.equal(dashboard.body.metrics.completed, 1);

    const detail = await call("GET /bookings/:id (client)", `/bookings/${state.bookingId}`, { token: client });
    assert.equal(detail.status, 200);
    assert.equal(detail.body.providerNetAmt, null);
  });

  test("the client reviews the provider and the provider rates the client", async () => {
    const mine = await call("GET /reviews/mine", "/reviews/mine", { token: client });
    assert.equal(mine.status, 200, JSON.stringify(mine.body));
    assert.equal(mine.body.toReview[0].id, state.bookingId);

    const review = await call("POST /reviews", "/reviews", {
      token: client,
      body: { bookingId: state.bookingId, rating: 5, comment: "Travail propre et rapide." },
    });
    assert.equal(review.status, 201, JSON.stringify(review.body));

    const duplicate = await call("POST /reviews (duplicate)", "/reviews", {
      token: client,
      body: { bookingId: state.bookingId, rating: 4 },
    });
    assert.equal(duplicate.status, 409);

    const reply = await call("POST /reviews/:id/reply", `/reviews/${review.body.id}/reply`, {
      token: pro,
      body: { reply: "Merci pour votre confiance !" },
    });
    assert.equal(reply.status, 200, JSON.stringify(reply.body));

    const profile = await call("GET /providers/:id (rated)", `/providers/${state.providerId}`);
    assert.equal(profile.body.ratingAvg, 5);
    assert.equal(profile.body.ratingCount, 1);
    assert.equal(profile.body.reviewsPreview[0].reply, "Merci pour votre confiance !");

    const reviews = await call("GET /providers/:id/reviews", `/providers/${state.providerId}/reviews`);
    assert.equal(reviews.status, 200);
    assert.equal(reviews.body.total, 1);

    const clientReview = await call("POST /reviews/clients", "/reviews/clients", {
      token: pro,
      body: { bookingId: state.bookingId, rating: 4, comment: "Client ponctuel." },
    });
    assert.equal(clientReview.status, 201, JSON.stringify(clientReview.body));

    const summary = await call(
      "GET /reviews/clients/:clientId/summary",
      `/reviews/clients/${state.clientUserId}/summary`,
      { token: pro },
    );
    assert.equal(summary.status, 200);
    assert.equal(summary.body.avg, 4);
    assert.equal(summary.body.count, 1);

    const clientDashboard = await call("GET /dashboard/client", "/dashboard/client", { token: client });
    assert.equal(clientDashboard.status, 200, JSON.stringify(clientDashboard.body));
    assert.equal(clientDashboard.body.bookingsByStatus.COMPLETED, 1);
    assert.deepEqual(clientDashboard.body.clientRating, { avg: 4, count: 1 });

    const notifications = await call("GET /notifications", "/notifications", { token: client });
    assert.equal(notifications.status, 200);
    const types = notifications.body.items.map((item: { type: string }) => item.type);
    for (const type of ["BOOKING_CONFIRMED", "BOOKING_COMPLETED", "NEW_MESSAGE", "NEW_CLIENT_REVIEW"]) {
      assert.ok(types.includes(type), `missing ${type}`);
    }
    const readAll = await call("PATCH /notifications/read-all", "/notifications/read-all", { token: client });
    assert.equal(readAll.status, 200);
  });

  test("blocks stop messaging and booking both ways", async () => {
    const block = await call("POST /blocks", "/blocks", { token: pro, body: { userId: state.clientUserId } });
    assert.equal(block.status, 201, JSON.stringify(block.body));

    const message = await call("POST /conversations/:id/messages (blocked)", `/conversations/${state.conversationId}/messages`, {
      token: client,
      body: { body: "Toujours là ?" },
    });
    assert.equal(message.status, 403);
    assert.equal(message.body.code, "BLOCKED");

    const tomorrow = await call("GET /providers/:id/availability (blocked)", `/providers/${state.providerId}/availability?date=${state.date}`);
    const booking = await call("POST /bookings (blocked)", "/bookings", {
      token: client,
      body: { providerId: state.providerId, date: state.date, time: tomorrow.body.slots[0], clientPhone: "+243820000002" },
    });
    assert.equal(booking.status, 403);
    assert.equal(booking.body.code, "BLOCKED");

    const hidden = await call("GET /providers (blocked viewer)", "/providers", { token: client });
    assert.equal(hidden.body.total, 0);

    const blocks = await call("GET /blocks", "/blocks", { token: pro });
    assert.equal(blocks.body.total, 1);

    const unblock = await call("DELETE /blocks/:userId", `/blocks/${state.clientUserId}`, { token: pro });
    assert.equal(unblock.status, 200);
  });

  test("a report, the contact form and the admin console close the loop", async () => {
    const report = await call("POST /reports", "/reports", {
      token: client,
      body: { targetKind: "PROVIDER", targetId: state.providerId, reason: "Numéro de téléphone erroné" },
    });
    assert.equal(report.status, 201, JSON.stringify(report.body));
    state.reportId = report.body.id;

    const contact = await call("POST /contact", "/contact", {
      body: {
        name: "Visiteur",
        email: "visiteur@example.cd",
        subject: "Partenariat",
        message: "Bonjour, nous aimerions vous présenter notre offre.",
      },
    });
    assert.equal(contact.status, 201, JSON.stringify(contact.body));

    const forbidden = await call("GET /admin/overview (client)", "/admin/overview", { token: client });
    assert.equal(forbidden.status, 403);

    const overview = await call("GET /admin/overview", "/admin/overview", { token: admin });
    assert.equal(overview.status, 200, JSON.stringify(overview.body));
    assert.equal(overview.body.openReports, 1);

    const bookings = await call("GET /admin/bookings", "/admin/bookings?q=Mukendi", { token: admin });
    assert.equal(bookings.status, 200, JSON.stringify(bookings.body));
    assert.equal(bookings.body.items[0].id, state.bookingId);

    const reports = await call("GET /admin/reports", "/admin/reports?status=OPEN", { token: admin });
    assert.equal(reports.status, 200);
    assert.equal(reports.body.items[0].target.label, "Plomberie Mukendi");

    const resolved = await call("PATCH /admin/reports/:id", `/admin/reports/${state.reportId}`, {
      token: admin,
      body: { resolution: "Numéro vérifié avec le prestataire." },
    });
    assert.equal(resolved.status, 200, JSON.stringify(resolved.body));
    assert.equal(resolved.body.status, "RESOLVED");

    const settings = await call("PUT /admin/settings", "/admin/settings", {
      token: admin,
      body: { hero_title: "Des pros vérifiés près de chez vous" },
    });
    assert.equal(settings.status, 200, JSON.stringify(settings.body));
    const publicSettings = await call("GET /settings/public (after edit)", "/settings/public");
    assert.equal(publicSettings.body.hero_title, "Des pros vérifiés près de chez vous");

    const contacts = await call("GET /admin/contacts", "/admin/contacts", { token: admin });
    assert.equal(contacts.status, 200);
    assert.equal(contacts.body.total, 1);

    const audit = await call("GET /admin/audit", "/admin/audit", { token: admin });
    assert.equal(audit.status, 200);
    const actions = audit.body.items.map((item: { action: string }) => item.action);
    assert.ok(actions.includes("report.resolve"), actions.join(","));
    assert.ok(actions.includes("settings.update"), actions.join(","));
    assert.ok(audit.body.items.every((item: { ipAddress: string | null }) => item.ipAddress !== undefined));

    const health = await call("GET /admin/health", "/admin/health", { token: admin });
    assert.equal(health.status, 200);
    assert.equal(health.body.database, "ok");
  });

  test("KYC documents go through the admin queue and the provider becomes verified", async () => {
    const clientState = await call("GET /pro/verification/state (client)", "/pro/verification/state", { token: client });
    assert.equal(clientState.status, 403);

    const docs: Array<{ kind: string; path: string }> = [];
    for (const kind of ["ID_FRONT", "ID_BACK", "SELFIE", "ADDRESS"]) {
      const signed = await call("POST /me/uploads/sign (verification)", "/me/uploads/sign", {
        token: pro,
        body: { purpose: "verification", fileName: `${kind.toLowerCase()}.jpg`, mimeType: "image/jpeg", bytes: 200_000 },
      });
      assert.equal(signed.status, 200, JSON.stringify(signed.body));
      const uploaded = await call("POST /pro/verification/documents", "/pro/verification/documents", {
        token: pro,
        body: { kind, path: signed.body.path, fileName: `${kind}.jpg`, mime: "image/jpeg", bytes: 200_000 },
      });
      assert.equal(uploaded.status, 200, JSON.stringify(uploaded.body));
      docs.push({ kind, path: signed.body.path });
    }

    const optionalUpload = await call("POST /me/uploads/sign (optional certificate)", "/me/uploads/sign", {
      token: pro,
      body: { purpose: "verification", fileName: "diplome.pdf", mimeType: "application/pdf", bytes: 300_000 },
    });
    const optional = await call("POST /pro/verification/documents (optional)", "/pro/verification/documents", {
      token: pro,
      body: { kind: "CERT_OPTIONAL", path: optionalUpload.body.path, fileName: "diplome.pdf", mime: "application/pdf", bytes: 300_000 },
    });
    assert.equal(optional.status, 200, JSON.stringify(optional.body));
    const removedDoc = await call("DELETE /pro/verification/documents/:id", `/pro/verification/documents/${optional.body.doc.id}`, {
      token: pro,
    });
    assert.equal(removedDoc.status, 200, JSON.stringify(removedDoc.body));
    assert.ok(calls.removed.some((entry) => entry.paths.includes(optionalUpload.body.path)));

    const submitted = await call("POST /pro/verification/submit", "/pro/verification/submit", { token: pro });
    assert.equal(submitted.status, 200, JSON.stringify(submitted.body));
    assert.equal(submitted.body.state, "IN_REVIEW");

    const strangerRead = await call(
      "GET /me/media/sign-read (verification, stranger)",
      `/me/media/sign-read?path=${encodeURIComponent(docs[0]!.path)}`,
      { token: client },
    );
    assert.equal(strangerRead.status, 403);
    const adminRead = await call(
      "GET /me/media/sign-read (verification, admin)",
      `/me/media/sign-read?path=${encodeURIComponent(docs[0]!.path)}`,
      { token: admin },
    );
    assert.equal(adminRead.status, 200);

    const queue = await call("GET /admin/verification/submissions", "/admin/verification/submissions", { token: admin });
    assert.equal(queue.status, 200, JSON.stringify(queue.body));
    const submission = queue.body.submissions.find((item: { providerId: string }) => item.providerId === state.providerId);
    assert.ok(submission);

    let last: JsonResponse | undefined;
    for (const doc of submission.docs as Array<{ id: string }>) {
      last = await call("PUT /admin/verification/documents", "/admin/verification/documents", {
        token: admin,
        body: { providerId: state.providerId, docId: doc.id, decision: "APPROVED" },
      });
      assert.equal(last.status, 200, JSON.stringify(last.body));
    }
    assert.equal(last!.body.verificationStatus, "VERIFIED");

    const proState = await call("GET /pro/verification/state", "/pro/verification/state", { token: pro });
    assert.equal(proState.body.state, "VERIFIED");

    const cv = await call("GET /admin/users/:id/cv", `/admin/users/${state.proUserId}/cv`, { token: admin });
    assert.equal(cv.status, 200, JSON.stringify(cv.body));
    assert.equal(cv.body.provider.verificationStatus, "VERIFIED");

    const providers = await call("GET /admin/providers", "/admin/providers?verificationStatus=VERIFIED", { token: admin });
    assert.equal(providers.body.total, 1);
    const verifiedSearch = await call("GET /providers (verifiedOnly)", "/providers?verifiedOnly=true");
    assert.equal(verifiedSearch.body.items[0].verified, true);
  });

  test("place suggestions, the address book, message deletion and catalog reads", async () => {
    const suggestion = await call("POST /places/suggestions", "/places/suggestions", {
      token: client,
      body: { kind: "QUARTIER", label: "Cité Verte", parentId: "place_gombe" },
    });
    assert.equal(suggestion.status, 201, JSON.stringify(suggestion.body));

    const pending = await call("GET /admin/places/suggestions", "/admin/places/suggestions", { token: admin });
    assert.equal(pending.status, 200);
    assert.equal(pending.body.total, 1);

    const approved = await call(
      "POST /admin/places/suggestions/:id/approve",
      `/admin/places/suggestions/${suggestion.body.id}/approve`,
      { token: admin },
    );
    assert.equal(approved.status, 200, JSON.stringify(approved.body));
    const placeId = approved.body.resolvedPlaceId;
    assert.ok(placeId);

    const place = await call("GET /admin/places/:id", `/admin/places/${placeId}`, { token: admin });
    assert.equal(place.status, 200);
    assert.equal(place.body.chain.length, 5);
    const ancestors = await call("GET /places/:id/ancestors", `/places/${placeId}/ancestors`);
    assert.deepEqual(ancestors.body.items.map((item: { label: string }) => item.label), [
      "RDC",
      "Kinshasa",
      "Kinshasa",
      "Gombe",
      "Cité Verte",
    ]);

    const notifications = await call("GET /notifications (suggestion)", "/notifications?unreadOnly=true", { token: client });
    assert.ok(notifications.body.items.some((item: { type: string }) => item.type === "PLACE_SUGGESTION_RESOLVED"));

    const home = await call("POST /addresses", "/addresses", {
      token: client,
      body: { label: "HOME", addressLine: "4 avenue Kasa-Vubu", placeId },
    });
    assert.equal(home.status, 201, JSON.stringify(home.body));
    assert.equal(home.body.isDefault, true);
    const work = await call("POST /addresses (second)", "/addresses", {
      token: client,
      body: { label: "WORK", addressLine: "Boulevard du 30 Juin", placeId: "place_gombe", isDefault: true },
    });
    assert.equal(work.body.isDefault, true);
    const addresses = await call("GET /addresses", "/addresses", { token: client });
    assert.equal(addresses.body.items.filter((item: { isDefault: boolean }) => item.isDefault).length, 1);
    const removed = await call("DELETE /addresses/:id", `/addresses/${work.body.id}`, { token: client });
    assert.equal(removed.status, 200);
    const asProvider = await call("GET /addresses (provider)", "/addresses", { token: pro });
    assert.equal(asProvider.status, 403);

    const sent = await call("POST /conversations/:id/messages (to delete)", `/conversations/${state.conversationId}/messages`, {
      token: client,
      body: { body: "Message envoyé par erreur" },
    });
    assert.equal(sent.status, 201, JSON.stringify(sent.body));
    const notMine = await call(
      "DELETE /conversations/:id/messages/:messageId (not sender)",
      `/conversations/${state.conversationId}/messages/${sent.body.id}`,
      { token: pro },
    );
    assert.ok([403, 404].includes(notMine.status));
    const deleted = await call(
      "DELETE /conversations/:id/messages/:messageId",
      `/conversations/${state.conversationId}/messages/${sent.body.id}`,
      { token: client },
    );
    assert.equal(deleted.status, 200);
    const thread = await call("GET /conversations/:id/messages (tombstone)", `/conversations/${state.conversationId}/messages`, {
      token: pro,
    });
    const tombstone = thread.body.items.find((item: { id: string }) => item.id === sent.body.id);
    assert.equal(tombstone.body, null);
    assert.ok(tombstone.deletedAt);

    const reference = await call("GET /admin/references/:id", "/admin/references/ref_fr", { token: admin });
    assert.equal(reference.status, 200);
    assert.equal(reference.body.usageCount, 1);
    const subcategories = await call("GET /admin/subcategories", "/admin/subcategories?categoryId=cat_batiment", { token: admin });
    assert.equal(subcategories.status, 200);
    assert.equal(subcategories.body.items[0].counts.providers, 1);
    const subcategory = await call("GET /admin/subcategories/:id", "/admin/subcategories/sub_plomberie", { token: admin });
    assert.equal(subcategory.status, 200);
    const referenced = await call("DELETE /admin/subcategories/:id (referenced)", "/admin/subcategories/sub_plomberie", {
      token: admin,
    });
    assert.equal(referenced.status, 409);
    assert.equal(referenced.body.code, "REFERENCED");
  });

  test("every remaining route answers through its guards and validation pipe", async () => {
    const edited = await call("PATCH /providers/me", "/providers/me", {
      token: pro,
      body: { description: "Dépannage et installation sanitaire.", yearsExperience: 9 },
    });
    assert.equal(edited.status, 200, JSON.stringify(edited.body));
    assert.equal(edited.body.yearsExperience, 9);

    const schedule = await call("PUT /providers/me/schedule", "/providers/me/schedule", {
      token: pro,
      body: {
        timezone: TIMEZONE,
        slotDurationMin: 60,
        slotBufferMin: 15,
        rules: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({ dayOfWeek, startTime: "08:00", endTime: "18:00" })),
        exceptions: [{ date: addDays(state.date!, 30), isOpen: false }],
      },
    });
    assert.equal(schedule.status, 200, JSON.stringify(schedule.body));

    const media = await call("PUT /providers/me/media", "/providers/me/media", {
      token: pro,
      body: { items: edited.body.media.slice(1).map((item: { id: string; kind: string }) => ({ id: item.id, kind: item.kind })) },
    });
    assert.equal(media.status, 200, JSON.stringify(media.body));
    assert.equal(media.body.items.length, 1);
    assert.ok(calls.removed.some((entry) => entry.bucket === "provider-media"));

    const paused = await call("PATCH /providers/me/availability", "/providers/me/availability", {
      token: pro,
      body: { isAvailable: false },
    });
    assert.deepEqual(paused.body, { isAvailable: false });
    await call("PATCH /providers/me/availability (resume)", "/providers/me/availability", {
      token: pro,
      body: { isAvailable: true },
    });

    const avatarUpload = await call("POST /me/uploads/sign (avatar)", "/me/uploads/sign", {
      token: client,
      body: { purpose: "avatar", fileName: "moi.png", mimeType: "image/png", bytes: 50_000 },
    });
    const avatar = await call("POST /me/avatar", "/me/avatar", { token: client, body: { path: avatarUpload.body.path } });
    assert.equal(avatar.status, 200, JSON.stringify(avatar.body));
    const foreignAvatar = await call("POST /me/avatar (foreign path)", "/me/avatar", {
      token: other,
      body: { path: avatarUpload.body.path },
    });
    assert.equal(foreignAvatar.status, 403);

    const geocode = await call("GET /geocode", "/geocode?placeId=place_gombe");
    assert.equal(geocode.status, 200, JSON.stringify(geocode.body));
    assert.equal(geocode.body.source, "place");
    const distance = await call("GET /distance", "/distance?lat=-4.32&lng=15.3&providerLat=-4.31&providerLng=15.29");
    assert.equal(distance.status, 200);

    const unread = await call("GET /notifications (provider)", "/notifications", { token: pro });
    const read = await call("PATCH /notifications/:id/read", `/notifications/${unread.body.items[0].id}/read`, { token: pro });
    assert.equal(read.status, 200);
    assert.equal(read.body.isRead, true);

    const addresses = await call("GET /addresses (for update)", "/addresses", { token: client });
    const updatedAddress = await call("PATCH /addresses/:id", `/addresses/${addresses.body.items[0].id}`, {
      token: client,
      body: { recipient: "Paul K." },
    });
    assert.equal(updatedAddress.status, 200, JSON.stringify(updatedAddress.body));

    const slots = await call("GET /providers/:id/availability (second booking)", `/providers/${state.providerId}/availability?date=${state.date}`);
    const second = await call("POST /bookings (with saved address)", "/bookings", {
      token: client,
      body: {
        providerId: state.providerId,
        date: state.date,
        time: slots.body.slots[0],
        clientPhone: "+243820000002",
        addressId: addresses.body.items[0].id,
      },
    });
    assert.equal(second.status, 201, JSON.stringify(second.body));
    const notes = await call("PATCH /bookings/:id/notes", `/bookings/${second.body.id}/notes`, {
      token: pro,
      body: { providerNotes: "Apporter un joint de 20 mm" },
    });
    assert.equal(notes.status, 200);
    assert.equal(notes.body.providerNotes, "Apporter un joint de 20 mm");
    const providerCancel = await call("POST /bookings/:id/cancel (provider, no reason)", `/bookings/${second.body.id}/cancel`, {
      token: pro,
    });
    assert.equal(providerCancel.status, 400);
    assert.equal(providerCancel.body.code, "REASON_REQUIRED");
    const clientCancel = await call("POST /bookings/:id/cancel", `/bookings/${second.body.id}/cancel`, { token: client });
    assert.equal(clientCancel.status, 200, JSON.stringify(clientCancel.body));
    assert.equal(clientCancel.body.status, "CANCELLED");

    const third = await call("POST /bookings (for admin cancel)", "/bookings", {
      token: client,
      body: { providerId: state.providerId, date: state.date, time: slots.body.slots[0], clientPhone: "+243820000002" },
    });
    assert.equal(third.status, 201, JSON.stringify(third.body));
    const adminCancel = await call("POST /admin/bookings/:id/cancel", `/admin/bookings/${third.body.id}/cancel`, {
      token: admin,
      body: { reason: "Doublon signalé par le client" },
    });
    assert.equal(adminCancel.status, 200, JSON.stringify(adminCancel.body));

    const users = await call("GET /admin/users", "/admin/users?q=Kabasele", { token: admin });
    assert.equal(users.body.total, 1);
    const settings = await call("GET /admin/settings", "/admin/settings", { token: admin });
    assert.equal(settings.body.hero_title, "Des pros vérifiés près de chez vous");

    const reviews = await call("GET /admin/reviews", "/admin/reviews?rating=5", { token: admin });
    assert.equal(reviews.body.total, 1);
    const reviewId = reviews.body.items[0].id;
    const hiddenReview = await call("PATCH /admin/reviews/:id", `/admin/reviews/${reviewId}`, {
      token: admin,
      body: { isPublic: false },
    });
    assert.equal(hiddenReview.status, 200, JSON.stringify(hiddenReview.body));
    const unrated = await call("GET /providers/:id (review hidden)", `/providers/${state.providerId}`);
    assert.equal(unrated.body.ratingCount, 0);
    const deletedReview = await call("DELETE /admin/reviews/:id", `/admin/reviews/${reviewId}`, { token: admin });
    assert.equal(deletedReview.status, 200);

    const conversations = await call("GET /admin/conversations", "/admin/conversations", { token: admin });
    assert.equal(conversations.body.total, 1);
    const adminThread = await call(
      "GET /admin/conversations/:id/messages",
      `/admin/conversations/${state.conversationId}/messages`,
      { token: admin },
    );
    assert.equal(adminThread.status, 200);
    const firstMessage = adminThread.body.items[0];
    const adminMessageDelete = await call("DELETE /admin/messages/:id", `/admin/messages/${firstMessage.id}`, { token: admin });
    assert.equal(adminMessageDelete.status, 200);
    const adminConversationDelete = await call(
      "DELETE /admin/conversations/:id",
      `/admin/conversations/${state.conversationId}`,
      { token: admin },
    );
    assert.equal(adminConversationDelete.status, 200);
    assert.ok(calls.removed.some((entry) => entry.bucket === "message-attachments"));

    const contacts = await call("GET /admin/contacts (for update)", "/admin/contacts", { token: admin });
    const contactRead = await call("PATCH /admin/contacts/:id", `/admin/contacts/${contacts.body.items[0].id}`, {
      token: admin,
      body: { status: "READ" },
    });
    assert.equal(contactRead.status, 200);
    const contactDelete = await call("DELETE /admin/contacts/:id", `/admin/contacts/${contacts.body.items[0].id}`, { token: admin });
    assert.equal(contactDelete.status, 200);

    const category = await call("POST /admin/categories", "/admin/categories", {
      token: admin,
      body: { name: "Beauté", slug: "beaute", icon: "Sparkles", color: "bg-pink-500" },
    });
    assert.equal(category.status, 201, JSON.stringify(category.body));
    const renamed = await call("PATCH /admin/categories/:id", `/admin/categories/${category.body.id}`, {
      token: admin,
      body: { name: "Beauté & bien-être" },
    });
    assert.equal(renamed.status, 200);
    const level2 = await call("POST /admin/subcategories", "/admin/subcategories", {
      token: admin,
      body: { categoryId: category.body.id, name: "Coiffure", slug: "coiffure" },
    });
    assert.equal(level2.status, 201, JSON.stringify(level2.body));
    const level3 = await call("POST /admin/subcategories (level 3)", "/admin/subcategories", {
      token: admin,
      body: { categoryId: category.body.id, parentId: level2.body.id, name: "Tresses", slug: "tresses" },
    });
    assert.equal(level3.status, 201, JSON.stringify(level3.body));
    const renamedSub = await call("PATCH /admin/subcategories/:id", `/admin/subcategories/${level3.body.id}`, {
      token: admin,
      body: { name: "Tresses africaines" },
    });
    assert.equal(renamedSub.status, 200);
    const categoryDetail = await call("GET /admin/categories/:id", `/admin/categories/${category.body.id}`, { token: admin });
    assert.equal(categoryDetail.body.children[0].children.length, 1);
    const adminTree = await call("GET /admin/categories", "/admin/categories", { token: admin });
    assert.equal(adminTree.body.items.length, 2);
    assert.equal(
      (await call("DELETE /admin/subcategories/:id", `/admin/subcategories/${level3.body.id}`, { token: admin })).status,
      200,
    );
    assert.equal(
      (await call("DELETE /admin/categories/:id", `/admin/categories/${category.body.id}`, { token: admin })).status,
      200,
    );

    const limete = await call("POST /admin/places", "/admin/places", {
      token: admin,
      body: { kind: "COMMUNE", label: "Limete", parentId: "place_kin", aliases: ["Limeté"] },
    });
    assert.equal(limete.status, 201, JSON.stringify(limete.body));
    const duplicate = await call("POST /admin/places (duplicate label)", "/admin/places", {
      token: admin,
      body: { kind: "COMMUNE", label: "Limete", parentId: "place_kin" },
    });
    assert.equal(duplicate.status, 409);
    const typo = await call("POST /admin/places (typo)", "/admin/places", {
      token: admin,
      body: { kind: "COMMUNE", label: "Limette", parentId: "place_kin" },
    });
    const patchedPlace = await call("PATCH /admin/places/:id", `/admin/places/${limete.body.id}`, {
      token: admin,
      body: { latitude: -4.37, longitude: 15.35 },
    });
    assert.equal(patchedPlace.status, 200);
    const mergedPlace = await call("POST /admin/places/merge", "/admin/places/merge", {
      token: admin,
      body: { fromId: typo.body.id, intoId: limete.body.id },
    });
    assert.equal(mergedPlace.status, 200, JSON.stringify(mergedPlace.body));
    const adminPlaces = await call("GET /admin/places", "/admin/places?parentId=place_kin", { token: admin });
    assert.equal(adminPlaces.body.total, 3);

    const toReject = await call("POST /places/suggestions (to reject)", "/places/suggestions", {
      token: client,
      body: { kind: "QUARTIER", label: "Quartier fantôme", parentId: "place_gombe" },
    });
    const rejected = await call(
      "POST /admin/places/suggestions/:id/reject",
      `/admin/places/suggestions/${toReject.body.id}/reject`,
      { token: admin },
    );
    assert.equal(rejected.status, 200, JSON.stringify(rejected.body));
    assert.equal(rejected.body.status, "REJECTED");

    const lingala = await call("POST /admin/references", "/admin/references", {
      token: admin,
      body: { type: "LANGUAGE", label: "Lingala" },
    });
    assert.equal(lingala.status, 201, JSON.stringify(lingala.body));
    const lingalaTypo = await call("POST /admin/references (typo)", "/admin/references", {
      token: admin,
      body: { type: "LANGUAGE", label: "Lingalla" },
    });
    const patchedReference = await call("PATCH /admin/references/:id", `/admin/references/${lingala.body.id}`, {
      token: admin,
      body: { aliases: ["Ngala"], order: 2 },
    });
    assert.equal(patchedReference.status, 200);
    const mergedReference = await call("POST /admin/references/merge", "/admin/references/merge", {
      token: admin,
      body: { fromId: lingalaTypo.body.id, intoId: lingala.body.id },
    });
    assert.equal(mergedReference.status, 200, JSON.stringify(mergedReference.body));
    const adminReferences = await call("GET /admin/references", "/admin/references?type=LANGUAGE", { token: admin });
    assert.equal(adminReferences.body.total, 3);
    const publicLanguages = await call("GET /references (after merge)", "/references?type=LANGUAGE");
    assert.equal(publicLanguages.body.total, 2);

    const audit = await call("GET /admin/audit (after curation)", "/admin/audit", { token: admin });
    const actions = new Set(audit.body.items.map((item: { action: string }) => item.action));
    for (const action of ["booking.cancel", "review.update", "review.delete", "place.merge", "reference.merge"]) {
      assert.ok(actions.has(action), `missing ${action} in ${[...actions].join(",")}`);
    }
  });

  test("suspension returns 403 everywhere and hides the provider; last-admin protection holds", async () => {
    const self = await call("PATCH /admin/users/:id (self)", "/admin/users/user_admin", {
      token: admin,
      body: { suspended: true, suspendedReason: "test" },
    });
    assert.equal(self.status, 400);

    const suspended = await call("PATCH /admin/users/:id", `/admin/users/${state.proUserId}`, {
      token: admin,
      body: { suspended: true, suspendedReason: "Signalements répétés" },
    });
    assert.equal(suspended.status, 200, JSON.stringify(suspended.body));

    const me = await call("GET /me (suspended)", "/me", { token: pro });
    assert.equal(me.status, 403);
    assert.equal(me.body.code, "ACCOUNT_SUSPENDED");
    assert.equal(me.body.suspendedReason, "Signalements répétés");

    const search = await call("GET /providers (after suspension)", "/providers");
    assert.equal(search.body.total, 0);

    const profile = await call("GET /providers/:id (suspended owner)", `/providers/${state.providerId}`);
    assert.equal(profile.status, 404);

    const restored = await call("PATCH /admin/users/:id (restore)", `/admin/users/${state.proUserId}`, {
      token: admin,
      body: { suspended: false },
    });
    assert.equal(restored.status, 200);
    const unhidden = await call("PATCH /admin/providers/:id", `/admin/providers/${state.providerId}`, {
      token: admin,
      body: { hidden: false, premiumTier: "BOOSTED" },
    });
    assert.equal(unhidden.status, 200, JSON.stringify(unhidden.body));
  });

  test("account deletion removes the provider, its data and storage, then the auth user", async () => {
    const deleted = await call("DELETE /me", "/me", { token: pro });
    assert.equal(deleted.status, 200, JSON.stringify(deleted.body));

    const profile = await call("GET /providers/:id (deleted)", `/providers/${state.providerId}`);
    assert.equal(profile.status, 404);
    assert.equal(await prisma.booking.count({ where: { id: state.bookingId } }), 0);
    assert.equal(await prisma.conversation.count({ where: { id: state.conversationId } }), 0);
    assert.ok(calls.removed.some((entry) => entry.bucket === "provider-media"));
    assert.ok(calls.deletedAuthUsers.includes("auth-pro"));

    const fresh = await call("GET /me (after deletion)", "/me", { token: pro });
    assert.equal(fresh.status, 200);
    assert.equal(fresh.body.user.role, "CLIENT");
    assert.notEqual(fresh.body.user.id, state.proUserId);

    const adminDelete = await call("DELETE /me (admin)", "/me", { token: admin });
    assert.equal(adminDelete.status, 409);
  });
});

import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { ProviderSearchParams } from "../../common/contract";
import { PlaceTreeService } from "../places/place-tree.service";
import { SafetyService } from "../safety/safety.service";
import { SiteSettingsService } from "../settings/site-settings.service";
import { ProvidersService } from "./providers.service";

type Row = Record<string, any>;

const OPERATORS = new Set(["equals", "in", "notIn", "not", "gt", "gte", "lt", "lte", "contains", "mode", "has", "some", "is"]);

const comparable = (value: unknown) => (value instanceof Date ? value.getTime() : value);

function matchesWhere(row: Row | null | undefined, where: Row | undefined): boolean {
  if (!where) return true;
  if (!row) return false;
  return Object.entries(where).every(([key, condition]) => {
    if (condition === undefined) return true;
    if (key === "AND") return (condition as Row[]).every((item) => matchesWhere(row, item));
    if (key === "OR") return (condition as Row[]).some((item) => matchesWhere(row, item));
    return matchesField(row[key], condition);
  });
}

function matchesField(value: any, condition: any): boolean {
  if (condition === null || typeof condition !== "object" || condition instanceof Date) {
    return comparable(value) === comparable(condition);
  }
  if (!Object.keys(condition).every((key) => OPERATORS.has(key))) {
    return value !== null && value !== undefined && matchesWhere(value, condition);
  }
  return Object.entries(condition).every(([operator, argument]: [string, any]) => {
    switch (operator) {
      case "equals":
        return comparable(value) === comparable(argument);
      case "in":
        return argument.some((item: unknown) => comparable(item) === comparable(value));
      case "notIn":
        return !argument.some((item: unknown) => comparable(item) === comparable(value));
      case "not":
        return argument !== null && typeof argument === "object" && !(argument instanceof Date)
          ? !matchesField(value, argument)
          : comparable(value) !== comparable(argument);
      case "gt":
        return value !== null && Number(comparable(value)) > Number(comparable(argument));
      case "gte":
        return value !== null && Number(comparable(value)) >= Number(comparable(argument));
      case "lt":
        return value !== null && Number(comparable(value)) < Number(comparable(argument));
      case "lte":
        return value !== null && Number(comparable(value)) <= Number(comparable(argument));
      case "contains":
        return (
          typeof value === "string" &&
          (condition.mode === "insensitive"
            ? value.toLowerCase().includes(String(argument).toLowerCase())
            : value.includes(argument))
        );
      case "has":
        return Array.isArray(value) && value.includes(argument);
      case "some":
        return Array.isArray(value) && value.some((item) => matchesWhere(item, argument));
      case "is":
        return value !== null && value !== undefined && matchesWhere(value, argument);
      default:
        return true;
    }
  });
}

const TIER_RANK: Record<string, number> = { FREE: 0, VERIFIED: 1, BOOSTED: 2, ELITE: 3 };

function sortRows(rows: Row[], orderBy: Array<Record<string, "asc" | "desc">> = []) {
  return [...rows].sort((a, b) => {
    for (const clause of orderBy) {
      const [field, direction] = Object.entries(clause)[0]!;
      const left = field === "premiumTier" ? TIER_RANK[a[field]] : comparable(a[field]);
      const right = field === "premiumTier" ? TIER_RANK[b[field]] : comparable(b[field]);
      if (left === right) continue;
      const result = (left as number | string) < (right as number | string) ? -1 : 1;
      return direction === "asc" ? result : -result;
    }
    return 0;
  });
}

const categories = {
  maison: { id: "cat_maison", slug: "maison", name: "Maison" },
  beaute: { id: "cat_beaute", slug: "beaute", name: "Beauté" },
};
const plomberie = { id: "sub_plomberie", slug: "plomberie", name: "Plomberie", categoryId: "cat_maison", parentId: null, parent: null, category: categories.maison };
const fuites = { id: "sub_fuites", slug: "fuites", name: "Fuites", categoryId: "cat_maison", parentId: "sub_plomberie", parent: { id: "sub_plomberie", slug: "plomberie", name: "Plomberie" }, category: categories.maison };
const coiffure = { id: "sub_coiffure", slug: "coiffure", name: "Coiffure", categoryId: "cat_beaute", parentId: null, parent: null, category: categories.beaute };

const places = [
  { id: "cd", kind: "COUNTRY", label: "RDC", parentId: null, active: true, mergedIntoId: null },
  { id: "kin", kind: "CITY", label: "Kinshasa", parentId: "cd", active: true, mergedIntoId: null },
  { id: "gombe", kind: "COMMUNE", label: "Gombe", parentId: "kin", active: true, mergedIntoId: null },
  { id: "lubum", kind: "CITY", label: "Lubumbashi", parentId: "cd", active: true, mergedIntoId: null },
];

let sequence = 0;
function provider(overrides: Row = {}): Row {
  sequence += 1;
  const id = overrides.id ?? `provider_${sequence}`;
  return {
    id,
    userId: `user_${id}`,
    displayName: `Pro ${sequence}`,
    profilePhoto: null,
    ratingAvg: 4,
    ratingCount: 3,
    completedJobs: 5,
    premiumTier: "FREE",
    premiumUntil: null,
    verificationStatus: "VERIFIED",
    isAvailable: true,
    latitude: -4.32,
    longitude: 15.31,
    placeId: "gombe",
    pricingAmount: null,
    pricingCurrencyId: null,
    pricingUnitId: null,
    publishedAt: new Date(`2026-01-${String(10 + sequence).padStart(2, "0")}T00:00:00Z`),
    hidden: false,
    subcategoryId: "sub_fuites",
    subcategory: fuites,
    user: { id: `user_${id}`, isActive: true },
    references: [],
    skills: [],
    freeSkills: [],
    description: null,
    yearsExperience: 4,
    phone: "+243810000000",
    whatsapp: "+243810000001",
    email: "pro@example.cd",
    addressLine: "12 avenue du Commerce",
    youtubeUrl: null,
    instagramUrl: null,
    tiktokUrl: null,
    facebookUrl: null,
    timezone: "Africa/Kinshasa",
    slotDurationMin: 60,
    slotBufferMin: 15,
    availabilityRules: [{ dayOfWeek: 1, startTime: "08:00", endTime: "12:00" }],
    availabilityExceptions: [],
    media: [],
    reviews: [],
    ...overrides,
  };
}

function makeService(options: {
  providers: Row[];
  blocks?: Array<{ blockerId: string; blockedId: string }>;
  settings?: Record<string, unknown>;
  references?: Row[];
  reviews?: Row[];
  availability?: unknown;
}) {
  const prisma = {
    provider: {
      findMany: async (args: { where?: Row; orderBy?: Array<Record<string, "asc" | "desc">>; skip?: number; take?: number }) => {
        const filtered = sortRows(options.providers.filter((row) => matchesWhere(row, args.where)), args.orderBy);
        const start = args.skip ?? 0;
        return filtered.slice(start, args.take === undefined ? undefined : start + args.take);
      },
      count: async (args: { where?: Row }) =>
        options.providers.filter((row) => matchesWhere(row, args.where)).length,
      findUnique: async (args: { where: Row }) =>
        options.providers.find((row) => matchesWhere(row, args.where)) ?? null,
    },
    review: {
      count: async (args: { where: Row }) => (options.reviews ?? []).filter((row) => matchesWhere(row, args.where)).length,
      findMany: async (args: { where: Row; skip: number; take: number }) =>
        (options.reviews ?? []).filter((row) => matchesWhere(row, args.where)).slice(args.skip, args.skip + args.take),
    },
    referenceItem: {
      findMany: async (args: { where: Row }) =>
        (options.references ?? []).filter((row) => matchesWhere(row, args.where)),
    },
    place: {
      findMany: async (args: { where: Row }) =>
        places
          .filter((row) => matchesWhere(row, args.where))
          .map((row) => ({ ...row, _count: { children: places.filter((child) => child.parentId === row.id).length } })),
    },
    block: {
      findMany: async (args: { where: Row }) => (options.blocks ?? []).filter((row) => matchesWhere(row, args.where)),
      findFirst: async (args: { where: Row }) =>
        (options.blocks ?? []).find((row) => matchesWhere(row, args.where)) ?? null,
    },
    systemSetting: {
      findMany: async () => Object.entries(options.settings ?? {}).map(([key, value]) => ({ key, value })),
      findUnique: async (args: { where: { key: string } }) =>
        options.settings && args.where.key in options.settings ? { value: options.settings[args.where.key] } : null,
    },
  };
  const availability = {
    computeForDate: async (providerId: string, date: string) =>
      options.availability ?? { date, timezone: "Africa/Kinshasa", slotDurationMin: 60, slotBufferMin: 15, slots: [providerId] },
  };
  return new ProvidersService(
    prisma as never,
    new PlaceTreeService(prisma as never),
    new SafetyService(prisma as never),
    new SiteSettingsService(prisma as never),
    availability as never,
  );
}

const query = (input: Record<string, unknown> = {}) => ProviderSearchParams.parse(input);
const viewer = (overrides: Partial<Actor> = {}) => ({ id: "viewer_1", role: "CLIENT", isActive: true, ...overrides }) as Actor;
const ids = (result: { items: Array<{ id: string }> }) => result.items.map((item) => item.id);

test("search excludes hidden providers, suspended owners and blocks in either direction", async () => {
  const service = makeService({
    providers: [
      provider({ id: "visible" }),
      provider({ id: "hidden", hidden: true }),
      provider({ id: "suspended", user: { id: "user_suspended", isActive: false } }),
      provider({ id: "blocked_by_viewer" }),
      provider({ id: "blocking_viewer" }),
    ],
    blocks: [
      { blockerId: "viewer_1", blockedId: "user_blocked_by_viewer" },
      { blockerId: "user_blocking_viewer", blockedId: "viewer_1" },
    ],
  });

  const anonymous = await service.search(query());
  assert.deepEqual(new Set(ids(anonymous)), new Set(["visible", "blocked_by_viewer", "blocking_viewer"]));

  const signedIn = await service.search(query(), viewer());
  assert.deepEqual(ids(signedIn), ["visible"]);
  assert.equal(signedIn.total, 1);
  assert.equal(signedIn.page, 1);
  assert.equal(signedIn.limit, 20);
});

test("premiumOnly keeps active premium tiers and drops expired or free ones; cards expose the effective tier", async () => {
  const service = makeService({
    providers: [
      provider({ id: "elite", premiumTier: "ELITE", premiumUntil: null }),
      provider({ id: "boosted_future", premiumTier: "BOOSTED", premiumUntil: new Date(Date.now() + 86_400_000) }),
      provider({ id: "boosted_expired", premiumTier: "BOOSTED", premiumUntil: new Date(Date.now() - 86_400_000) }),
      provider({ id: "free", premiumTier: "FREE" }),
    ],
  });

  const premium = await service.search(query({ premiumOnly: "true" }));
  assert.deepEqual(new Set(ids(premium)), new Set(["elite", "boosted_future"]));

  const all = await service.search(query());
  const expired = all.items.find((item) => item.id === "boosted_expired");
  assert.equal(expired?.premiumTier, "FREE");
});

test("placeId matches the place and every descendant", async () => {
  const service = makeService({
    providers: [
      provider({ id: "in_gombe", placeId: "gombe" }),
      provider({ id: "in_kin", placeId: "kin" }),
      provider({ id: "in_lubum", placeId: "lubum" }),
      provider({ id: "no_place", placeId: null }),
    ],
  });

  const result = await service.search(query({ placeId: "kin" }));
  assert.deepEqual(new Set(ids(result)), new Set(["in_gombe", "in_kin"]));

  const card = result.items.find((item) => item.id === "in_gombe")!;
  assert.deepEqual(card.placeChain.map((place) => place.id), ["cd", "kin", "gombe"]);
  assert.equal(card.placeChain[1]!.hasChildren, true);
});

test("subcategoryId includes level-3 children; category filters match by id or slug", async () => {
  const service = makeService({
    providers: [
      provider({ id: "on_level3", subcategoryId: "sub_fuites", subcategory: fuites }),
      provider({ id: "on_level2", subcategoryId: "sub_plomberie", subcategory: plomberie }),
      provider({ id: "hair", subcategoryId: "sub_coiffure", subcategory: coiffure }),
    ],
  });

  assert.deepEqual(new Set(ids(await service.search(query({ subcategoryId: "sub_plomberie" })))), new Set(["on_level3", "on_level2"]));
  assert.deepEqual(ids(await service.search(query({ subcategoryId: "sub_fuites" }))), ["on_level3"]);
  assert.deepEqual(ids(await service.search(query({ categorySlug: "beaute" }))), ["hair"]);
  assert.deepEqual(new Set(ids(await service.search(query({ categoryId: "cat_maison" })))), new Set(["on_level3", "on_level2"]));

  const level3 = (await service.search(query({ subcategoryId: "sub_fuites" }))).items[0]!;
  assert.deepEqual(level3.categoryChain.map((node) => node.slug), ["maison", "plomberie", "fuites"]);
});

test("language, rating, verified and text filters", async () => {
  const lingala = { id: "lang_lingala", type: "LANGUAGE", label: "Lingala", categoryId: null };
  const service = makeService({
    providers: [
      provider({
        id: "speaks_lingala",
        ratingAvg: 4.6,
        references: [{ itemId: "lang_lingala", kind: "LANGUAGE", item: lingala }],
        skills: [{ itemId: "skill_joint", item: { id: "skill_joint", type: "SKILL", label: "Remplacement de joint", categoryId: "cat_maison" } }],
      }),
      provider({ id: "low_rating", ratingAvg: 3.1, verificationStatus: "PENDING", freeSkills: ["Dépannage nuit"] }),
      provider({ id: "hair", subcategoryId: "sub_coiffure", subcategory: coiffure }),
    ],
  });

  assert.deepEqual(ids(await service.search(query({ languageId: "lang_lingala" }))), ["speaks_lingala"]);
  assert.deepEqual(new Set(ids(await service.search(query({ minRating: "4" })))), new Set(["speaks_lingala", "hair"]));
  assert.deepEqual(new Set(ids(await service.search(query({ verifiedOnly: "true" })))), new Set(["speaks_lingala", "hair"]));
  assert.deepEqual(ids(await service.search(query({ q: "JOINT" }))), ["speaks_lingala"]);
  assert.deepEqual(ids(await service.search(query({ q: "beauté" }))), ["hair"]);
  assert.deepEqual(ids(await service.search(query({ q: "Dépannage nuit" }))), ["low_rating"]);
});

test("recommended sort ranks premium tier first, then rating", async () => {
  const service = makeService({
    providers: [
      provider({ id: "free_top", premiumTier: "FREE", ratingAvg: 5 }),
      provider({ id: "elite_low", premiumTier: "ELITE", ratingAvg: 3.5 }),
      provider({ id: "boosted_mid", premiumTier: "BOOSTED", ratingAvg: 4 }),
    ],
  });
  assert.deepEqual(ids(await service.search(query())), ["elite_low", "boosted_mid", "free_top"]);
  assert.deepEqual(ids(await service.search(query({ sort: "rating" }))), ["free_top", "boosted_mid", "elite_low"]);
});

test("distance sort orders by rounded coordinates, puts providers without coordinates last and paginates", async () => {
  const service = makeService({
    providers: [
      provider({ id: "far", latitude: -11.66, longitude: 27.48 }),
      provider({ id: "no_coords", latitude: null, longitude: null }),
      provider({ id: "near", latitude: -4.3251, longitude: 15.3118 }),
      provider({ id: "mid", latitude: -4.44, longitude: 15.27 }),
    ],
  });
  const origin = { lat: "-4.325", lng: "15.312", sort: "distance" };

  const first = await service.search(query({ ...origin, limit: "3" }));
  assert.deepEqual(ids(first), ["near", "mid", "far"]);
  assert.equal(first.total, 4);
  assert.equal(first.items[0]!.latitude, -4.33);
  assert.equal(typeof first.items[0]!.distanceKm, "number");
  assert.ok(first.items[1]!.distanceKm! > first.items[0]!.distanceKm!);

  const second = await service.search(query({ ...origin, limit: "3", page: "2" }));
  assert.deepEqual(ids(second), ["no_coords"]);
  assert.equal(second.items[0]!.distanceKm, null);
});

test("cards resolve pricing references and return ratingAvg as a number", async () => {
  const service = makeService({
    providers: [
      provider({ id: "priced", ratingAvg: { toString: () => "4.5", valueOf: () => 4.5 }, pricingAmount: 15000, pricingCurrencyId: "cur_cdf", pricingUnitId: "unit_hour" }),
    ],
    references: [
      { id: "cur_cdf", type: "CURRENCY", label: "CDF", categoryId: null },
      { id: "unit_hour", type: "PRICE_UNIT", label: "Par heure", categoryId: null },
    ],
  });
  const [card] = (await service.search(query())).items;
  assert.equal(card!.ratingAvg, 4.5);
  assert.deepEqual(card!.pricing, {
    amount: 15000,
    currency: { id: "cur_cdf", type: "CURRENCY", label: "CDF", categoryId: null },
    unit: { id: "unit_hour", type: "PRICE_UNIT", label: "Par heure", categoryId: null },
  });
});

function profileRow(overrides: Row = {}) {
  return provider({
    id: "pro",
    userId: "owner_1",
    user: { id: "owner_1", isActive: true },
    references: [
      { kind: "LANGUAGE", item: { id: "lang_fr", type: "LANGUAGE", label: "Français", categoryId: null } },
      { kind: "INTERVENTION_MODE", item: { id: "mode_home", type: "INTERVENTION_MODE", label: "À domicile", categoryId: null } },
    ],
    availabilityExceptions: [
      { date: new Date("2020-01-01T00:00:00Z"), isOpen: false, startTime: null, endTime: null, reason: "passé" },
      { date: new Date("2999-01-01T00:00:00Z"), isOpen: false, startTime: null, endTime: null, reason: "futur" },
    ],
    reviews: [
      {
        id: "review_1",
        rating: 5,
        comment: "Parfait",
        reply: null,
        repliedAt: null,
        createdAt: new Date("2026-02-01T00:00:00Z"),
        client: { id: "client_1", firstName: "Paul", lastName: "Kabasele", avatar: null },
      },
    ],
    ...overrides,
  });
}

test("anonymous viewers get a locked profile with public data", async () => {
  const service = makeService({ providers: [profileRow()] });
  const profile = await service.getPublicProfile("pro");

  assert.equal(profile.contacts, null);
  assert.equal(profile.contactsLocked, true);
  assert.equal(profile.isOwner, false);
  assert.equal(profile.blocked, false);
  assert.equal(profile.ratingAvg, 4);
  assert.deepEqual(profile.languages.map((item) => item.label), ["Français"]);
  assert.deepEqual(profile.interventionModes.map((item) => item.label), ["À domicile"]);
  assert.equal(profile.scheduleSummary.length, 7);
  assert.deepEqual(profile.scheduleSummary[1]!.ranges, [{ startTime: "08:00", endTime: "12:00" }]);
  assert.deepEqual(profile.schedule.exceptions.map((exception) => exception.date), ["2999-01-01"]);
  assert.deepEqual(profile.reviewsPreview[0]!.author, { id: "client_1", name: "Paul K.", avatar: null });
});

test("contacts_require_premium locks FREE providers for signed-in viewers but not premium ones", async () => {
  const settings = { contacts_require_premium: true };
  const free = makeService({ providers: [profileRow({ premiumTier: "FREE" })], settings });
  const locked = await free.getPublicProfile("pro", viewer());
  assert.equal(locked.contactsLocked, true);
  assert.equal(locked.contacts, null);

  const boosted = makeService({ providers: [profileRow({ premiumTier: "BOOSTED" })], settings });
  const visible = await boosted.getPublicProfile("pro", viewer());
  assert.equal(visible.contactsLocked, false);
  assert.equal(visible.contacts?.phone, "+243810000000");
  assert.equal(visible.contacts?.latitude, -4.32);

  const setting = makeService({ providers: [profileRow({ premiumTier: "FREE" })] });
  assert.equal((await setting.getPublicProfile("pro", viewer())).contactsLocked, false);
});

test("owners and admins always see contacts; feat_whatsapp off hides WhatsApp", async () => {
  const service = makeService({
    providers: [profileRow({ premiumTier: "FREE" })],
    settings: { contacts_require_premium: true, feat_whatsapp: false },
  });

  const owner = await service.getPublicProfile("pro", viewer({ id: "owner_1", role: "PROVIDER" }));
  assert.equal(owner.isOwner, true);
  assert.equal(owner.contacts?.phone, "+243810000000");
  assert.equal(owner.contacts?.whatsapp, null);

  const admin = await service.getPublicProfile("pro", viewer({ id: "admin_1", role: "ADMIN" }));
  assert.equal(admin.contactsLocked, false);
});

test("hidden or suspended providers are 404 except for their owner and admins", async () => {
  const isNotFound = (error: unknown) => error instanceof HttpException && error.getStatus() === 404;

  const hidden = makeService({ providers: [profileRow({ hidden: true })] });
  await assert.rejects(() => hidden.getPublicProfile("pro"), isNotFound);
  await assert.rejects(() => hidden.getPublicProfile("pro", viewer()), isNotFound);
  assert.equal((await hidden.getPublicProfile("pro", viewer({ id: "owner_1", role: "PROVIDER" }))).hidden, true);
  assert.equal((await hidden.getPublicProfile("pro", viewer({ id: "admin_1", role: "ADMIN" }))).id, "pro");

  const suspended = makeService({ providers: [profileRow({ user: { id: "owner_1", isActive: false } })] });
  await assert.rejects(() => suspended.getPublicProfile("pro", viewer()), isNotFound);
  await assert.rejects(() => suspended.getPublicProfile("missing"), isNotFound);
});

test("profile reports a block in either direction without hiding the profile", async () => {
  const service = makeService({
    providers: [profileRow()],
    blocks: [{ blockerId: "owner_1", blockedId: "viewer_1" }],
  });
  assert.equal((await service.getPublicProfile("pro", viewer())).blocked, true);
});

test("availability is 404 for hidden providers and delegates to the availability service otherwise", async () => {
  const isNotFound = (error: unknown) => error instanceof HttpException && error.getStatus() === 404;
  const hidden = makeService({ providers: [profileRow({ hidden: true })] });
  await assert.rejects(() => hidden.getAvailability("pro", "2030-01-07"), isNotFound);

  const visible = makeService({ providers: [profileRow()] });
  const result = await visible.getAvailability("pro", "2030-01-07");
  assert.deepEqual(result.slots, ["pro"]);
  assert.equal(result.date, "2030-01-07");
});

test("public reviews list is paginated and limited to public reviews", async () => {
  const reviews = [1, 2, 3].map((index) => ({
    id: `review_${index}`,
    providerId: "pro",
    isPublic: index !== 2,
    rating: 4,
    comment: null,
    reply: null,
    repliedAt: null,
    createdAt: new Date(`2026-02-0${index}T00:00:00Z`),
    client: { id: `client_${index}`, firstName: "Awa", lastName: null, avatar: null },
  }));
  const service = makeService({ providers: [profileRow()], reviews });

  const page = await service.listReviews("pro", { page: 1, limit: 1 });
  assert.equal(page.total, 2);
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0]!.author.name, "Awa");
});

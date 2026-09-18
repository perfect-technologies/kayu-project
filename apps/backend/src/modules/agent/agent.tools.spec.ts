import assert from "node:assert/strict";
import test from "node:test";
import { HttpStatus } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { apiError } from "../../common/http/errors";
import {
  AGENT_TOOL_NAMES,
  AgentToolError,
  approvalConfig,
  buildTools,
  compactProviderCard,
  compactProviderProfile,
  excerpt,
  withoutContactFields,
  type AgentToolCallTrace,
  type AgentToolDeps,
} from "./agent.tools";

const execOptions = { toolCallId: "call_1", messages: [] } as never;
const actor = { id: "user_1", role: "CLIENT", country: "RDC", isActive: true, phone: "+243819000001" } as Actor;
const phoneless = { ...actor, phone: null } as Actor;

async function run<T>(result: T | PromiseLike<T> | AsyncIterable<T>): Promise<Awaited<T>> {
  return (await (result as PromiseLike<T>)) as Awaited<T>;
}

const places = {
  cd: { id: "cd", kind: "COUNTRY", label: "RDC", parentId: null, hasChildren: true },
  kin: { id: "kin", kind: "CITY", label: "Kinshasa", parentId: "cd", hasChildren: true },
  gombe: { id: "gombe", kind: "COMMUNE", label: "Gombe", parentId: "kin", hasChildren: true },
} as const;

const categoryChain = [
  { id: "cat_maison", slug: "maison_entretien", name: "Maison & entretien" },
  { id: "sub_plomberie", slug: "plomberie", name: "Plomberie" },
  { id: "sub_fuite", slug: "fuite", name: "Fuite d'eau" },
];

function card(id: string) {
  return {
    id,
    displayName: `Prestataire ${id}`,
    profilePhoto: "https://cdn/photo.jpg",
    categoryChain,
    placeChain: [places.cd, places.kin, places.gombe],
    ratingAvg: 4.66,
    ratingCount: 12,
    completedJobs: 30,
    premiumTier: "VERIFIED" as const,
    verified: true,
    isAvailable: true,
    latitude: -4.32,
    longitude: 15.31,
    distanceKm: null,
    pricing: {
      amount: 25000,
      currency: { id: "cur_cdf", type: "CURRENCY" as const, label: "CDF", categoryId: null },
      unit: { id: "unit_h", type: "PRICE_UNIT" as const, label: "heure", categoryId: null },
    },
  };
}

function profile(id: string, contactsLocked = false) {
  return {
    ...card(id),
    ownerId: `u_${id}`,
    description: "Plombier depuis dix ans. ".repeat(20),
    yearsExperience: 10,
    freeSkills: ["Chauffe-eau"],
    skills: [{ id: "sk_1", type: "SKILL" as const, label: "Fuites", categoryId: "cat_maison" }],
    languages: [{ id: "lang_fr", type: "LANGUAGE" as const, label: "Français", categoryId: null }],
    interventionModes: [{ id: "mode_dom", type: "INTERVENTION_MODE" as const, label: "À domicile", categoryId: null }],
    media: [{ id: "m1", kind: "IMAGE" as const, url: "https://cdn/1.jpg", storagePath: null, youtubeId: null, title: null, order: 0 }],
    schedule: { timezone: "Africa/Kinshasa", slotDurationMin: 60, slotBufferMin: 0, rules: [], exceptions: [] },
    scheduleSummary: [
      { dayOfWeek: 0, ranges: [] },
      { dayOfWeek: 1, ranges: [{ startTime: "08:00", endTime: "12:00" }, { startTime: "14:00", endTime: "18:00" }] },
      { dayOfWeek: 2, ranges: [{ startTime: "08:00", endTime: "18:00" }] },
      { dayOfWeek: 3, ranges: [] },
      { dayOfWeek: 4, ranges: [] },
      { dayOfWeek: 5, ranges: [] },
      { dayOfWeek: 6, ranges: [] },
    ],
    social: { youtubeUrl: null, instagramUrl: null, tiktokUrl: null, facebookUrl: null },
    contacts: contactsLocked
      ? null
      : {
          phone: "+243900000001",
          whatsapp: "+243900000002",
          email: "jean@example.cd",
          addressLine: "12 avenue de la Justice",
          latitude: -4.3216789,
          longitude: 15.3123456,
        },
    contactsLocked,
    blocked: false,
    reviewsPreview: [],
    publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    subcategoryId: "sub_fuite",
    placeId: "gombe",
    isOwner: false,
    hidden: false,
    verificationStatus: "VERIFIED" as const,
  };
}

function bookingCard(id: string, status: string, date: string, time: string) {
  return {
    id,
    status,
    scheduledAt: new Date(`${date}T${time}:00+01:00`),
    scheduledLocal: { date, time },
    durationMin: 60,
    timezone: "Africa/Kinshasa",
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    agreedPrice: null,
    isPaid: false,
    cancelReason: null,
    cancelledAt: null,
    side: "client" as const,
    counterpart: { userId: "u_p_1", providerId: "p_1", name: "Prestataire p_1", photo: null, categoryLabel: "Plomberie" },
    clientRating: null,
    hasReview: false,
    hasClientReview: false,
  };
}

function bookingDetail(id: string, date: string, time: string) {
  return {
    ...bookingCard(id, "PENDING", date, time),
    providerId: "p_1",
    clientId: "user_1",
    clientPhone: "+243819000001",
    clientNotes: null,
    providerNotes: null,
    placeId: "gombe",
    placeChain: [places.cd, places.kin, places.gombe],
    addressLine: "12 avenue de la Justice",
    latitude: -4.32,
    longitude: 15.31,
    commissionPct: null,
    commissionAmt: null,
    providerNetAmt: null,
    paidAt: null,
    confirmedAt: null,
    completedAt: null,
    cancelledById: null,
    review: null,
    clientReview: null,
  };
}

const conversationItem = {
  id: "conv_9",
  subject: null,
  lastMessageAt: new Date("2026-09-10T15:00:00.000Z"),
  lastPreview: "Bonjour",
  unread: 1,
  side: "client" as const,
  counterpart: { userId: "u_p_1", providerId: "p_1", name: "Prestataire p_1", photo: null },
  blocked: false,
  createdAt: new Date("2026-09-01T00:00:00.000Z"),
};

const addressItem = {
  id: "addr_1",
  label: "HOME" as const,
  recipient: null,
  addressLine: "12 avenue de la Justice",
  placeId: "gombe",
  placeChain: [places.cd, places.kin, places.gombe],
  country: "RDC",
  latitude: -4.32,
  longitude: 15.31,
  isDefault: true,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

function makeDeps(overrides: Partial<AgentToolDeps> = {}) {
  const calls: Record<string, unknown[]> = {
    list: [],
    chains: [],
    search: [],
    getPublicProfile: [],
    getAvailability: [],
    bookingsList: [],
    bookingsCreate: [],
    messagingList: [],
    messagingStart: [],
    addressesList: [],
  };
  const trace: AgentToolCallTrace[] = [];
  const deps: AgentToolDeps = {
    bookings: {
      list: async (viewer, query) => {
        calls.bookingsList.push([viewer, query]);
        const items = query.status === "PENDING" ? [bookingCard("b_2", "PENDING", "2026-09-30", "10:00")] : query.status === "CONFIRMED" ? [bookingCard("b_1", "CONFIRMED", "2026-09-25", "08:00")] : [];
        return { items, total: items.length, page: 1, limit: query.limit } as never;
      },
      create: async (viewer, input) => {
        calls.bookingsCreate.push([viewer, input]);
        if (input.time === "11:00") throw apiError(HttpStatus.CONFLICT, "SLOT_TAKEN", "Ce créneau n'est plus disponible.");
        return bookingDetail("b_new", input.date, input.time) as never;
      },
    },
    messaging: {
      list: async (viewer, query) => {
        calls.messagingList.push([viewer, query]);
        return { items: [conversationItem], total: 1, page: 1, limit: query.limit, unreadTotal: 1 } as never;
      },
      start: async (viewer, input) => {
        calls.messagingStart.push([viewer, input]);
        if (input.providerId === "p_blocked") throw apiError(HttpStatus.FORBIDDEN, "BLOCKED", "Cette interaction est bloquée.");
        return { conversation: conversationItem, message: { id: "msg_1", conversationId: "conv_9", senderId: "user_1", mine: true, body: input.body ?? null, attachments: [], createdAt: new Date("2026-09-17T10:00:00.000Z"), deletedAt: null } } as never;
      },
    },
    addresses: {
      list: async (viewer, query) => {
        calls.addressesList.push([viewer, query]);
        return { items: [addressItem], total: 1, page: 1, limit: query.limit } as never;
      },
    },
    places: {
      list: async (query) => {
        calls.list.push(query);
        const found = query.q && ["gombe", "gom"].includes(query.q.toLowerCase()) ? [places.gombe] : [];
        return { items: found, total: found.length, page: 1, limit: query.limit } as never;
      },
    },
    placeTree: {
      chains: async (ids) => {
        calls.chains.push(ids);
        return new Map([["gombe", [places.cd, places.kin, places.gombe]]]) as never;
      },
    },
    providers: {
      search: async (query, viewer) => {
        calls.search.push([query, viewer]);
        return { items: [card("p_1"), card("p_2")], total: 7, page: 1, limit: query.limit } as never;
      },
      getPublicProfile: async (id, viewer) => {
        calls.getPublicProfile.push([id, viewer]);
        return profile(id, id === "p_locked") as never;
      },
      getAvailability: async (id, date, viewer) => {
        calls.getAvailability.push([id, date, viewer]);
        return {
          date,
          timezone: "Africa/Kinshasa",
          slotDurationMin: 60,
          slotBufferMin: 0,
          slots: date === "2026-09-18" ? ["09:00", "10:00"] : [],
        };
      },
    },
    onToolCall: (entry) => trace.push(entry),
    ...overrides,
  };
  return { deps, calls, trace };
}

test("the seven tools exist with French descriptions and the shared input schemas", async () => {
  const { deps } = makeDeps();
  const tools = await buildTools(actor, deps);
  const schemas = await import("@kayu/schemas");

  assert.deepEqual(Object.keys(tools).sort(), [...AGENT_TOOL_NAMES].sort());
  for (const t of Object.values(tools)) assert.match(String(t.description), /prestataire|lieu|client/i);
  assert.equal(tools.find_place.inputSchema, schemas.AssistantFindPlaceInput);
  assert.equal(tools.search_providers.inputSchema, schemas.AssistantSearchProvidersInput);
  assert.equal(tools.get_provider.inputSchema, schemas.AssistantGetProviderInput);
  assert.equal(tools.get_provider_availability.inputSchema, schemas.AssistantProviderAvailabilityInput);
  assert.equal(tools.get_my_activity.inputSchema, schemas.AssistantGetMyActivityInput);
  assert.equal((tools as { create_booking: { inputSchema: unknown } }).create_booking.inputSchema, schemas.AssistantCreateBookingInput);
  assert.equal(tools.send_message.inputSchema, schemas.AssistantSendMessageInput);

  assert.equal(schemas.AssistantSearchProvidersInput.safeParse({}).success, false);
  assert.equal(schemas.AssistantSearchProvidersInput.safeParse({ placeId: "gombe", limit: 7 }).success, false);
  assert.equal(schemas.AssistantSearchProvidersInput.parse({ placeId: "gombe" }).limit, 3);
  assert.equal(schemas.AssistantProviderAvailabilityInput.safeParse({ providerId: "p", dates: [] }).success, false);
  assert.equal(schemas.AssistantProviderAvailabilityInput.safeParse({ providerId: "p", dates: ["2026-02-30"] }).success, false);
  assert.equal(
    schemas.AssistantProviderAvailabilityInput.safeParse({ providerId: "p", dates: Array.from({ length: 8 }, (_, i) => `2026-09-1${i}`) }).success,
    false,
  );
  assert.equal(schemas.AssistantFindPlaceInput.safeParse({ q: "" }).success, false);
});

test("find_place goes through PlacesService.list with the contract query and returns place chains", async () => {
  const { deps, calls, trace } = makeDeps();
  const tools = await buildTools(actor, deps);

  const output = await run(tools.find_place.execute({ q: "Gombe" }, execOptions));

  assert.deepEqual(calls.list[0], { q: "Gombe", kind: undefined, page: 1, limit: 5 });
  assert.deepEqual(calls.chains[0], ["gombe"]);
  assert.equal(output.items[0]!.id, "gombe");
  assert.deepEqual(output.items[0]!.chain.map((place) => place.label), ["RDC", "Kinshasa", "Gombe"]);

  const modelOutput = await tools.find_place.toModelOutput!({ toolCallId: "call_1", input: { q: "Gombe" }, output });
  assert.deepEqual(modelOutput, {
    type: "json",
    value: { total: 1, places: [{ id: "gombe", label: "Gombe", kind: "COMMUNE", chain: "RDC › Kinshasa › Gombe" }] },
  });
  assert.deepEqual(trace, [{ name: "find_place", durationMs: trace[0]!.durationMs, ok: true }]);
});

test("find_place retries without accents when the exact spelling matches nothing", async () => {
  const { deps, calls } = makeDeps();
  const tools = await buildTools(actor, deps);
  const output = await run(tools.find_place.execute({ q: "Gombé" }, execOptions));
  assert.equal(calls.list.length, 2);
  assert.equal((calls.list[1] as { q: string }).q, "Gombe");
  assert.equal(output.items.length, 1);
});

test("search_providers validates through ProviderSearchParams and passes the actor as viewer", async () => {
  const { deps, calls } = makeDeps();
  const tools = await buildTools(actor, deps);

  const output = await run(
    tools.search_providers.execute(
      { placeId: "gombe", subcategoryId: "sub_fuite", verifiedOnly: true, minRating: 4, sort: "rating", limit: 2 },
      execOptions,
    ),
  );

  const [query, viewer] = calls.search[0] as [Record<string, unknown>, Actor];
  assert.equal(viewer, actor);
  assert.equal(query.placeId, "gombe");
  assert.equal(query.subcategoryId, "sub_fuite");
  assert.equal(query.verifiedOnly, true);
  assert.equal(query.minRating, 4);
  assert.equal(query.sort, "rating");
  assert.equal(query.page, 1);
  assert.equal(query.limit, 2);
  assert.equal(output.total, 7);
  assert.equal(output.items[0]!.latitude, -4.32);

  const modelOutput = await tools.search_providers.toModelOutput!({ toolCallId: "call_1", input: { placeId: "gombe", sort: "recommended", limit: 2 }, output });
  const serialized = JSON.stringify(modelOutput);
  assert.deepEqual((modelOutput as unknown as { value: { providers: unknown[] } }).value.providers[0], {
    id: "p_1",
    name: "Prestataire p_1",
    category: "Maison & entretien › Plomberie › Fuite d'eau",
    place: "RDC › Kinshasa › Gombe",
    rating: 4.7,
    reviewCount: 12,
    completedJobs: 30,
    tier: "VERIFIED",
    verified: true,
    available: true,
    price: "25000 CDF / heure",
  });
  assert.doesNotMatch(serialized, /latitude|longitude|profilePhoto|cdn\/photo/);
});

test("search_providers rejects an input the REST contract would reject", async () => {
  const { deps } = makeDeps();
  const tools = await buildTools(actor, deps);
  await assert.rejects(run(tools.search_providers.execute({ placeId: "gombe", minRating: 9, sort: "recommended", limit: 3 }, execOptions)));
});

test("get_provider passes the actor as viewer, keeps contacts for the UI and strips them for the model", async () => {
  const { deps, calls } = makeDeps();
  const tools = await buildTools(actor, deps);

  const output = await run(tools.get_provider.execute({ providerId: "p_1" }, execOptions));
  assert.deepEqual(calls.getPublicProfile[0], ["p_1", actor]);
  assert.equal(output.contacts?.phone, "+243900000001");

  const modelOutput = await tools.get_provider.toModelOutput!({ toolCallId: "call_1", input: { providerId: "p_1" }, output });
  const serialized = JSON.stringify(modelOutput);
  assert.doesNotMatch(serialized, /\+243900000001|\+243900000002|jean@example\.cd|avenue de la Justice/);
  assert.doesNotMatch(serialized, /"phone"|"whatsapp"|"email"|"addressLine"|"latitude"|"longitude"|"contacts"|"media"|"social"|"ownerId"/);
  const value = (modelOutput as unknown as { value: Record<string, unknown> }).value;
  assert.equal(value.contactsLocked, false);
  assert.equal(value.timezone, "Africa/Kinshasa");
  assert.deepEqual(value.schedule, ["Lun 08:00–12:00, 14:00–18:00", "Mar 08:00–18:00"]);
  assert.deepEqual(value.skills, ["Fuites", "Chauffe-eau"]);
  assert.ok((value.description as string).length <= 280);
  assert.ok((value.description as string).endsWith("…"));
});

test("get_provider reports locked contacts to the model without any contact field", async () => {
  const { deps } = makeDeps();
  const tools = await buildTools(actor, deps);
  const output = await run(tools.get_provider.execute({ providerId: "p_locked" }, execOptions));
  assert.equal(output.contacts, null);
  const value = (await tools.get_provider.toModelOutput!({ toolCallId: "c", input: { providerId: "p_locked" }, output }) as unknown as { value: Record<string, unknown> }).value;
  assert.equal(value.contactsLocked, true);
  assert.equal("contacts" in value, false);
});

test("get_provider_availability validates, de-duplicates and sorts dates and passes the actor per date", async () => {
  const { deps, calls } = makeDeps();
  const tools = await buildTools(actor, deps);

  const output = await run(
    tools.get_provider_availability.execute({ providerId: "p_1", dates: ["2026-09-19", "2026-09-18", "2026-09-18"] }, execOptions),
  );

  assert.deepEqual(calls.getAvailability, [
    ["p_1", "2026-09-18", actor],
    ["p_1", "2026-09-19", actor],
  ]);
  assert.deepEqual(output, {
    providerId: "p_1",
    timezone: "Africa/Kinshasa",
    slotDurationMin: 60,
    days: [
      { date: "2026-09-18", slots: ["09:00", "10:00"] },
      { date: "2026-09-19", slots: [] },
    ],
  });
  assert.deepEqual(
    tools.get_provider_availability.toModelOutput!({ toolCallId: "c", input: { providerId: "p_1", dates: ["2026-09-18"] }, output }),
    { type: "json", value: output },
  );
  await assert.rejects(run(tools.get_provider_availability.execute({ providerId: "p_1", dates: ["18/09/2026"] }, execOptions)));
});

test("tool failures are traced as not ok and rethrown to the loop", async () => {
  const { deps, trace } = makeDeps({
    providers: {
      search: async () => {
        throw new Error("db down");
      },
      getPublicProfile: async () => {
        throw new Error("not called");
      },
      getAvailability: async () => {
        throw new Error("not called");
      },
    },
  });
  const tools = await buildTools(actor, deps);
  await assert.rejects(run(tools.search_providers.execute({ placeId: "gombe", sort: "recommended", limit: 3 }, execOptions)), /db down/);
  assert.deepEqual(trace.map((entry) => [entry.name, entry.ok]), [["search_providers", false]]);
});

test("compact helpers and the deep contact filter never leak contact fields or coordinates", () => {
  const compact = compactProviderProfile(profile("p_1") as never);
  assert.equal("contacts" in compact, false);
  assert.equal("latitude" in compactProviderCard(card("p_1") as never), false);
  assert.deepEqual(withoutContactFields({ a: { phone: "x", email: "y", keep: 1 }, list: [{ latitude: 1, longitude: 2, id: "z" }] }), {
    a: { keep: 1 },
    list: [{ id: "z" }],
  });
  assert.equal(excerpt("  a   b  "), "a b");
  assert.equal(excerpt(null), null);
});

test("feat_booking off removes create_booking from the tool set and the approval map for the turn", async () => {
  const { deps } = makeDeps();
  const tools = await buildTools(actor, { ...deps, bookingEnabled: false });
  assert.equal("create_booking" in tools, false);
  assert.deepEqual(Object.keys(tools).sort(), ["find_place", "get_my_activity", "get_provider", "get_provider_availability", "search_providers", "send_message"]);
  assert.deepEqual(Object.keys(approvalConfig(tools)), ["send_message"]);

  const full = await buildTools(actor, deps);
  const approvals = approvalConfig(full) as Record<string, () => string>;
  assert.deepEqual(Object.keys(approvals).sort(), ["create_booking", "send_message"]);
  assert.equal(approvals.create_booking!(), "user-approval");
  assert.equal(approvals.send_message!(), "user-approval");
});

test("create_booking validates through CreateBookingDto, defaults the phone from the actor and passes the actor to the service", async () => {
  const { deps, calls, trace } = makeDeps();
  const tools = await buildTools(actor, deps);
  const create = (tools as { create_booking: { execute: (input: unknown, options: unknown) => unknown } }).create_booking;

  const output = (await run(
    create.execute({ providerId: "p_1", date: "2026-09-25", time: "09:00", addressId: "addr_1", clientNotes: "2e étage", clientId: "victim", userId: "victim" }, execOptions),
  )) as ReturnType<typeof bookingDetail>;

  const [viewer, dto] = calls.bookingsCreate[0] as [Actor, Record<string, unknown>];
  assert.equal(viewer, actor);
  assert.deepEqual(dto, { providerId: "p_1", date: "2026-09-25", time: "09:00", clientPhone: "+243819000001", clientNotes: "2e étage", addressId: "addr_1" });
  assert.equal("clientId" in dto || "userId" in dto, false);
  assert.equal(output.id, "b_new");
  assert.equal(output.clientPhone, "+243819000001");
  assert.deepEqual(trace, [{ name: "create_booking", durationMs: trace[0]!.durationMs, ok: true }]);

  const modelOutput = await (tools as { create_booking: { toModelOutput: (a: unknown) => unknown } }).create_booking.toModelOutput({ toolCallId: "c", input: {}, output });
  assert.deepEqual(modelOutput, {
    type: "json",
    value: { bookingId: "b_new", status: "PENDING", provider: "Prestataire p_1", when: "vendredi 25 septembre 2026 à 09:00", timezone: "Africa/Kinshasa" },
  });
  assert.doesNotMatch(JSON.stringify(modelOutput), /avenue de la Justice|\+243|latitude/);
});

test("create_booking keeps an explicit phone, refuses a missing one and the DTO's address rule", async () => {
  const { deps, calls } = makeDeps();
  const tools = await buildTools(actor, deps);
  const create = (tools as { create_booking: { execute: (input: unknown, options: unknown) => unknown } }).create_booking;

  await run(create.execute({ providerId: "p_1", date: "2026-09-25", time: "09:00", clientPhone: "+243899999999" }, execOptions));
  assert.equal((calls.bookingsCreate[0] as [Actor, { clientPhone: string }])[1].clientPhone, "+243899999999");

  const noPhone = (await buildTools(phoneless, deps)) as { create_booking: { execute: (input: unknown, options: unknown) => unknown } };
  await assert.rejects(run(noPhone.create_booking.execute({ providerId: "p_1", date: "2026-09-25", time: "09:00" }, execOptions)));
  await assert.rejects(run(create.execute({ providerId: "p_1", date: "2026-09-25", time: "09:00", addressId: "addr_1", placeId: "gombe" }, execOptions)), /adresse enregistrée ou en saisir une/);
  assert.equal(calls.bookingsCreate.length, 1);
});

test("409 SLOT_TAKEN and 403 BLOCKED come back as tool errors with their code and French message", async () => {
  const { deps, trace } = makeDeps();
  const tools = await buildTools(actor, deps);
  const create = (tools as { create_booking: { execute: (input: unknown, options: unknown) => unknown } }).create_booking;

  await assert.rejects(run(create.execute({ providerId: "p_1", date: "2026-09-25", time: "11:00" }, execOptions)), (error: unknown) => {
    assert.ok(error instanceof AgentToolError);
    assert.equal(error.code, "SLOT_TAKEN");
    assert.equal(error.message, "SLOT_TAKEN : Ce créneau n'est plus disponible.");
    return true;
  });
  await assert.rejects(run(tools.send_message.execute({ providerId: "p_blocked", body: "Bonjour" }, execOptions)), (error: unknown) => {
    assert.ok(error instanceof AgentToolError);
    assert.equal(error.code, "BLOCKED");
    assert.equal(error.message, "BLOCKED : Cette interaction est bloquée.");
    return true;
  });
  assert.deepEqual(trace.map((entry) => [entry.name, entry.ok]), [["create_booking", false], ["send_message", false]]);
});

test("send_message validates through StartConversationDto and starts the conversation as the actor", async () => {
  const { deps, calls } = makeDeps();
  const tools = await buildTools(actor, deps);

  const output = await run(tools.send_message.execute({ providerId: "p_1", body: "  Bonjour, fuite sous l'évier à Gombe, demain matin ?  ", subject: "Fuite", clientId: "victim" } as never, execOptions));

  const [viewer, dto] = calls.messagingStart[0] as [Actor, Record<string, unknown>];
  assert.equal(viewer, actor);
  assert.deepEqual(dto, { providerId: "p_1", subject: "Fuite", body: "Bonjour, fuite sous l'évier à Gombe, demain matin ?", attachments: [] });
  assert.equal(output.conversation.id, "conv_9");
  assert.deepEqual(await tools.send_message.toModelOutput!({ toolCallId: "c", input: { providerId: "p_1", body: "x" }, output }), {
    type: "json",
    value: { conversationId: "conv_9", provider: "Prestataire p_1", sentAt: "2026-09-17T10:00:00.000Z" },
  });
  await assert.rejects(run(tools.send_message.execute({ providerId: "p_1", body: "" }, execOptions)));
});

test("get_my_activity reads open bookings, conversations and addresses as the actor and hides address lines from the model", async () => {
  const { deps, calls } = makeDeps();
  const tools = await buildTools(actor, deps);

  const output = await run(tools.get_my_activity.execute({}, execOptions));

  assert.deepEqual(
    (calls.bookingsList as Array<[Actor, { status: string; limit: number; page: number }]>).map(([viewer, query]) => [viewer === actor, query.status, query.page, query.limit]),
    [[true, "PENDING", 1, 5], [true, "CONFIRMED", 1, 5]],
  );
  assert.equal((calls.messagingList[0] as [Actor])[0], actor);
  assert.equal((calls.addressesList[0] as [Actor])[0], actor);
  assert.deepEqual(output.openBookings.map((b) => b.id), ["b_1", "b_2"]);
  assert.equal(output.addresses[0]!.addressLine, "12 avenue de la Justice");

  const modelOutput = await tools.get_my_activity.toModelOutput!({ toolCallId: "c", input: {}, output });
  assert.deepEqual(modelOutput, {
    type: "json",
    value: {
      openBookings: [
        { id: "b_1", status: "CONFIRMED", provider: "Prestataire p_1", providerId: "p_1", category: "Plomberie", when: "vendredi 25 septembre 2026 à 08:00" },
        { id: "b_2", status: "PENDING", provider: "Prestataire p_1", providerId: "p_1", category: "Plomberie", when: "mercredi 30 septembre 2026 à 10:00" },
      ],
      conversations: [{ id: "conv_9", provider: "Prestataire p_1", providerId: "p_1", lastMessageAt: "2026-09-10T15:00:00.000Z", unread: 1 }],
      addresses: [{ addressId: "addr_1", label: "Domicile", place: "RDC › Kinshasa › Gombe", isDefault: true }],
    },
  });
  assert.doesNotMatch(JSON.stringify(modelOutput), /avenue de la Justice|latitude|longitude/);
});

test("compact outputs survive a JSON round trip, as stored parts do on later turns", async () => {
  const { deps } = makeDeps();
  const tools = await buildTools(actor, deps);
  const sent = JSON.parse(JSON.stringify(await run(tools.send_message.execute({ providerId: "p_1", body: "Bonjour" }, execOptions))));
  assert.deepEqual(await tools.send_message.toModelOutput!({ toolCallId: "c", input: { providerId: "p_1", body: "Bonjour" }, output: sent }), {
    type: "json",
    value: { conversationId: "conv_9", provider: "Prestataire p_1", sentAt: "2026-09-17T10:00:00.000Z" },
  });
  const activity = JSON.parse(JSON.stringify(await run(tools.get_my_activity.execute({}, execOptions))));
  const value = (await tools.get_my_activity.toModelOutput!({ toolCallId: "c", input: {}, output: activity })) as unknown as { value: { conversations: Array<{ lastMessageAt: string }> } };
  assert.equal(value.value.conversations[0]!.lastMessageAt, "2026-09-10T15:00:00.000Z");
  const booking = JSON.parse(JSON.stringify(await run((tools as { create_booking: { execute: (i: unknown, o: unknown) => unknown } }).create_booking.execute({ providerId: "p_1", date: "2026-09-25", time: "09:00" }, execOptions))));
  const model = (await (tools as { create_booking: { toModelOutput: (a: unknown) => unknown } }).create_booking.toModelOutput({ toolCallId: "c", input: {}, output: booking })) as { value: { when: string } };
  assert.equal(model.value.when, "vendredi 25 septembre 2026 à 09:00");
});

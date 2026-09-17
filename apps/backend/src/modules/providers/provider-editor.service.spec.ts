import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { PublishProviderDto, type PublishProviderInput } from "../../common/contract";
import { PlaceTreeService } from "../places/place-tree.service";
import { StorageService, type StoredObject } from "../storage/storage.service";
import { ProviderEditorService } from "./provider-editor.service";

delete process.env.STORAGE_ENV_PREFIX;

type Row = Record<string, any>;

const places = [
  { id: "cd", kind: "COUNTRY", label: "RDC", parentId: null, active: true, mergedIntoId: null },
  { id: "kin", kind: "CITY", label: "Kinshasa", parentId: "cd", active: true, mergedIntoId: null },
  { id: "gombe", kind: "COMMUNE", label: "Gombe", parentId: "kin", active: true, mergedIntoId: null },
  { id: "closed", kind: "COMMUNE", label: "Fermée", parentId: "kin", active: false, mergedIntoId: null },
];

const subcategories: Record<string, Row> = {
  sub_fuites: { id: "sub_fuites", isActive: true, categoryId: "cat_maison", category: { isActive: true }, parent: { isActive: true }, children: [] },
  sub_plomberie: { id: "sub_plomberie", isActive: true, categoryId: "cat_maison", category: { isActive: true }, parent: null, children: [{ id: "sub_fuites" }] },
  sub_coiffure: { id: "sub_coiffure", isActive: true, categoryId: "cat_beaute", category: { isActive: true }, parent: null, children: [] },
  sub_orphan: { id: "sub_orphan", isActive: true, categoryId: "cat_maison", category: { isActive: true }, parent: { isActive: false }, children: [] },
};

const references = [
  { id: "skill_joint", type: "SKILL", categoryId: "cat_maison", active: true, mergedIntoId: null },
  { id: "skill_generic", type: "SKILL", categoryId: null, active: true, mergedIntoId: null },
  { id: "skill_tresse", type: "SKILL", categoryId: "cat_beaute", active: true, mergedIntoId: null },
  { id: "lang_fr", type: "LANGUAGE", categoryId: null, active: true, mergedIntoId: null },
  { id: "lang_old", type: "LANGUAGE", categoryId: null, active: false, mergedIntoId: "lang_fr" },
  { id: "mode_home", type: "INTERVENTION_MODE", categoryId: null, active: true, mergedIntoId: null },
  { id: "cur_cdf", type: "CURRENCY", categoryId: null, active: true, mergedIntoId: null },
  { id: "unit_hour", type: "PRICE_UNIT", categoryId: null, active: true, mergedIntoId: null },
];

function makeEditor(options: {
  provider?: Row | null;
  media?: Row[];
  createError?: unknown;
} = {}) {
  const events: string[] = [];
  const writes: Array<{ op: string; args: any }> = [];
  const removed: StoredObject[][] = [];
  const log = (op: string, result: unknown = { count: 1 }) => async (args: any) => {
    writes.push({ op, args });
    return result;
  };

  const tx = {
    $queryRaw: async () => {
      events.push("lock");
      return [];
    },
    provider: {
      create: async (args: any) => {
        writes.push({ op: "provider.create", args });
        if (options.createError) throw options.createError;
        return { id: "provider_new" };
      },
      update: async (args: any) => {
        writes.push({ op: "provider.update", args });
        return { isAvailable: args.data.isAvailable };
      },
      findUniqueOrThrow: async () => ({
        timezone: "Africa/Lubumbashi",
        slotDurationMin: 30,
        slotBufferMin: 0,
        availabilityRules: [{ dayOfWeek: 2, startTime: "08:00", endTime: "10:00" }],
        availabilityExceptions: [
          { date: new Date("2030-01-01T00:00:00Z"), isOpen: false, startTime: null, endTime: null, reason: null },
        ],
      }),
    },
    user: { update: log("user.update") },
    providerSkill: { deleteMany: log("providerSkill.deleteMany"), createMany: log("providerSkill.createMany") },
    providerReference: { deleteMany: log("providerReference.deleteMany"), createMany: log("providerReference.createMany") },
    providerMedia: {
      findMany: async () => options.media ?? [],
      deleteMany: log("providerMedia.deleteMany"),
      update: log("providerMedia.update"),
      create: log("providerMedia.create"),
    },
    availabilityRule: { deleteMany: log("availabilityRule.deleteMany"), createMany: log("availabilityRule.createMany") },
    availabilityException: { deleteMany: log("availabilityException.deleteMany"), createMany: log("availabilityException.createMany") },
  };

  const prisma = {
    ...tx,
    provider: {
      ...tx.provider,
      findUnique: async () => options.provider ?? null,
    },
    subcategory: { findUnique: async ({ where }: { where: { id: string } }) => subcategories[where.id] ?? null },
    referenceItem: {
      findMany: async ({ where }: { where: Row }) =>
        references.filter(
          (item) =>
            item.active === where.active &&
            item.mergedIntoId === where.mergedIntoId &&
            (where.OR
              ? where.OR.some((clause: Row) => clause.id === item.id && clause.type === item.type)
              : where.id.in.includes(item.id) && where.type === item.type),
        ),
    },
    place: {
      findMany: async ({ where }: { where: Row }) =>
        places.filter((place) =>
          where.id ? where.id.in.includes(place.id) : where.parentId.in.includes(place.parentId),
        ),
    },
    $transaction: async (callback: (client: typeof tx) => Promise<unknown>) => {
      events.push("begin");
      const result = await callback(tx);
      events.push("commit");
      return result;
    },
  };

  const supabase = {
    storage: {
      from: (bucket: string) => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/storage/v1/object/public/${bucket}/${path}` } }),
      }),
    },
  };
  const storage = new StorageService(supabase as never);
  storage.removeObjects = async (objects: StoredObject[]) => {
    events.push("remove");
    removed.push(objects);
  };
  const providers = {
    getPublicProfile: async (id: string, viewer: Actor) => ({ id, viewerRole: viewer.role }),
  };

  const editor = new ProviderEditorService(
    prisma as never,
    new PlaceTreeService(prisma as never),
    storage,
    providers as never,
  );
  return { editor, events, writes, removed };
}

const actor = (overrides: Partial<Actor> = {}) =>
  ({ id: "user_1", role: "CLIENT", isActive: true, avatar: null, termsAcceptedAt: null, ...overrides }) as Actor;

function payload(overrides: Record<string, unknown> = {}): PublishProviderInput {
  return PublishProviderDto.parse({
    displayName: "Jean Plomberie",
    phone: "+243 810 000 111",
    subcategoryId: "sub_fuites",
    placeId: "gombe",
    skillIds: ["skill_joint", "skill_generic"],
    freeSkills: [" Urgences ", "urgences", "Chauffe-eau"],
    languageIds: ["lang_fr"],
    modeIds: ["mode_home"],
    pricing: { amount: 15000, currencyId: "cur_cdf", unitId: "unit_hour" },
    schedule: {
      timezone: "Africa/Kinshasa",
      slotDurationMin: 60,
      slotBufferMin: 15,
      rules: [
        { dayOfWeek: 1, startTime: "14:00", endTime: "17:00" },
        { dayOfWeek: 1, startTime: "08:00", endTime: "12:00" },
      ],
      exceptions: [{ date: "2030-01-01", isOpen: false }],
    },
    media: [
      { kind: "IMAGE", path: "media/user_1/abc-photo.jpg", title: "Chantier" },
      { kind: "VIDEO_YOUTUBE", url: "https://youtu.be/M7lc1UVf-VE" },
    ],
    social: { facebookUrl: "https://www.facebook.com/jean" },
    acceptTerms: true,
    ...overrides,
  });
}

const hasCode = (status: number, code: string) => (error: unknown) => {
  assert.ok(error instanceof HttpException, String(error));
  assert.equal(error.getStatus(), status);
  assert.equal((error.getResponse() as { code: string }).code, code);
  return true;
};

test("publish writes the provider, relations and normalized schedule, then promotes the user", async () => {
  const { editor, writes } = makeEditor();
  const result = await editor.publish(actor(), payload());

  assert.deepEqual(result, { id: "provider_new", viewerRole: "PROVIDER" });
  const data = writes.find((write) => write.op === "provider.create")!.args.data;
  assert.equal(data.userId, "user_1");
  assert.equal(data.phone, "+243810000111");
  assert.deepEqual(data.freeSkills, ["Urgences", "Chauffe-eau"]);
  assert.equal(data.pricingAmount, 15000);
  assert.equal(data.facebookUrl, "https://www.facebook.com/jean");
  assert.deepEqual(data.skills.create, [{ itemId: "skill_joint" }, { itemId: "skill_generic" }]);
  assert.deepEqual(data.references.create, [
    { itemId: "lang_fr", kind: "LANGUAGE" },
    { itemId: "mode_home", kind: "INTERVENTION_MODE" },
  ]);
  assert.deepEqual(data.availabilityRules.create, [
    { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", order: 0 },
    { dayOfWeek: 1, startTime: "14:00", endTime: "17:00", order: 1 },
  ]);
  assert.equal(data.availabilityExceptions.create[0].date.toISOString(), "2030-01-01T00:00:00.000Z");
  assert.deepEqual(data.media.create, [
    {
      kind: "IMAGE",
      url: "https://cdn.test/storage/v1/object/public/provider-media/media/user_1/abc-photo.jpg",
      storagePath: "media/user_1/abc-photo.jpg",
      youtubeId: null,
      title: "Chantier",
      order: 0,
    },
    {
      kind: "VIDEO_YOUTUBE",
      url: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
      storagePath: null,
      youtubeId: "M7lc1UVf-VE",
      title: null,
      order: 1,
    },
  ]);

  const userUpdate = writes.find((write) => write.op === "user.update")!.args;
  assert.equal(userUpdate.data.role, "PROVIDER");
  assert.ok(userUpdate.data.roleSelectedAt instanceof Date);
  assert.ok(userUpdate.data.termsAcceptedAt instanceof Date);
});

test("publish keeps an existing terms acceptance date", async () => {
  const { editor, writes } = makeEditor();
  await editor.publish(actor({ termsAcceptedAt: new Date("2026-01-01T00:00:00Z") }), payload());
  const userUpdate = writes.find((write) => write.op === "user.update")!.args;
  assert.equal("termsAcceptedAt" in userUpdate.data, false);
});

test("publish refuses a second provider profile, including a concurrent unique violation", async () => {
  const existing = makeEditor({ provider: { id: "provider_old" } });
  await assert.rejects(() => existing.editor.publish(actor(), payload()), hasCode(409, "ALREADY_EXISTS"));

  const race = makeEditor({ createError: Object.assign(new Error("unique"), { code: "P2002" }) });
  await assert.rejects(() => race.editor.publish(actor(), payload()), hasCode(409, "ALREADY_EXISTS"));
});

test("publish requires the deepest active taxonomy node and a selectable place", async () => {
  const { editor } = makeEditor();
  await assert.rejects(() => editor.publish(actor(), payload({ subcategoryId: "sub_plomberie" })), hasCode(400, "INVALID_REFERENCE"));
  await assert.rejects(() => editor.publish(actor(), payload({ subcategoryId: "sub_orphan" })), hasCode(400, "INVALID_REFERENCE"));
  await assert.rejects(() => editor.publish(actor(), payload({ subcategoryId: "missing" })), hasCode(400, "INVALID_REFERENCE"));
  await assert.rejects(() => editor.publish(actor(), payload({ placeId: "closed" })), hasCode(400, "INVALID_REFERENCE"));
});

test("publish rejects skills from another category, merged references and wrong pricing types", async () => {
  const { editor } = makeEditor();
  await assert.rejects(() => editor.publish(actor(), payload({ skillIds: ["skill_tresse"] })), hasCode(400, "INVALID_REFERENCE"));
  await assert.rejects(() => editor.publish(actor(), payload({ languageIds: ["lang_old"] })), hasCode(400, "INVALID_REFERENCE"));
  await assert.rejects(() => editor.publish(actor(), payload({ modeIds: ["lang_fr"] })), hasCode(400, "INVALID_REFERENCE"));
  await assert.rejects(
    () => editor.publish(actor(), payload({ pricing: { amount: 1, currencyId: "unit_hour", unitId: "cur_cdf" } })),
    hasCode(400, "INVALID_REFERENCE"),
  );
});

test("publish rejects deceptive YouTube hosts, foreign upload paths and bad social hosts", async () => {
  const { editor } = makeEditor();
  await assert.rejects(
    () => editor.publish(actor(), payload({ media: [{ kind: "VIDEO_YOUTUBE", url: "https://youtube.com.evil.test/watch?v=M7lc1UVf-VE" }] })),
    hasCode(400, "INVALID_MEDIA"),
  );
  await assert.rejects(
    () => editor.publish(actor(), payload({ media: [{ kind: "IMAGE", path: "media/user_2/abc-photo.jpg" }] })),
    hasCode(400, "INVALID_MEDIA"),
  );
  await assert.rejects(
    () => editor.publish(actor(), payload({ media: [{ kind: "VIDEO_UPLOAD", path: "avatar/user_1/abc-clip.mp4" }] })),
    hasCode(400, "INVALID_MEDIA"),
  );
  await assert.rejects(
    () =>
      editor.publish(
        actor(),
        payload({
          media: [
            { kind: "VIDEO_YOUTUBE", url: "https://youtu.be/M7lc1UVf-VE" },
            { kind: "VIDEO_YOUTUBE", url: "https://www.youtube.com/watch?v=M7lc1UVf-VE" },
          ],
        }),
      ),
    hasCode(400, "INVALID_MEDIA"),
  );
  await assert.rejects(
    () => editor.publish(actor(), payload({ social: { instagramUrl: "https://instagram.com.evil.test/jean" } })),
    hasCode(400, "INVALID_MEDIA"),
  );
});

test("more than 12 images is refused by the schema and by the service", async () => {
  const images = Array.from({ length: 13 }, (_, index) => ({ kind: "IMAGE", path: `media/user_1/abc-${index}.jpg` }));
  assert.equal(PublishProviderDto.safeParse({ ...payload(), media: images }).success, false);

  const { editor } = makeEditor();
  const input = { ...payload(), media: images } as PublishProviderInput;
  await assert.rejects(() => editor.publish(actor(), input), hasCode(400, "INVALID_MEDIA"));
});

test("profile photo accepts an owned avatar path or the actor's own avatar URL only", async () => {
  const owned = makeEditor();
  await owned.editor.publish(actor(), payload({ profilePhoto: "avatar/user_1/abc-me.png" }));
  assert.equal(
    owned.writes.find((write) => write.op === "provider.create")!.args.data.profilePhoto,
    "https://cdn.test/storage/v1/object/public/avatars/avatar/user_1/abc-me.png",
  );

  const reuse = makeEditor();
  await reuse.editor.publish(actor({ avatar: "https://cdn.test/me.png" }), payload({ profilePhoto: "https://cdn.test/me.png" }));
  assert.equal(reuse.writes.find((write) => write.op === "provider.create")!.args.data.profilePhoto, "https://cdn.test/me.png");

  const { editor } = makeEditor();
  await assert.rejects(
    () => editor.publish(actor(), payload({ profilePhoto: "https://tracker.example/pixel.png" })),
    hasCode(400, "INVALID_MEDIA"),
  );
  await assert.rejects(
    () => editor.publish(actor(), payload({ profilePhoto: "avatar/user_9/abc-me.png" })),
    hasCode(400, "INVALID_MEDIA"),
  );
});

const ownProvider = {
  id: "provider_1",
  subcategoryId: "sub_fuites",
  placeId: "gombe",
  profilePhoto: "https://cdn.test/storage/v1/object/public/provider-media/media/user_1/abc-old.jpg",
  subcategory: { categoryId: "cat_maison" },
};

test("media replacement keeps referenced items, drops the rest and removes orphaned uploads after commit", async () => {
  const existing = [
    { id: "m_keep", kind: "IMAGE", url: "https://cdn.test/keep.jpg", storagePath: "media/user_1/abc-keep.jpg", youtubeId: null, title: "Avant" },
    { id: "m_drop", kind: "IMAGE", url: "https://cdn.test/drop.jpg", storagePath: "media/user_1/abc-drop.jpg", youtubeId: null, title: null },
    { id: "m_reupload", kind: "VIDEO_UPLOAD", url: "https://cdn.test/storage/v1/object/public/provider-media/media/user_1/abc-clip.mp4", storagePath: "media/user_1/abc-clip.mp4", youtubeId: null, title: null },
    { id: "m_youtube", kind: "VIDEO_YOUTUBE", url: "https://www.youtube.com/watch?v=M7lc1UVf-VE", storagePath: null, youtubeId: "M7lc1UVf-VE", title: null },
  ];
  const { editor, events, writes, removed } = makeEditor({ provider: ownProvider, media: existing });

  await editor.replaceMedia(actor({ role: "PROVIDER" }), [
    { kind: "VIDEO_UPLOAD", path: "media/user_1/abc-clip.mp4" },
    { kind: "IMAGE", id: "m_keep", title: "Après" },
    { kind: "IMAGE", path: "media/user_1/abc-new.jpg" },
  ]);

  assert.deepEqual(events, ["begin", "lock", "commit", "remove"]);
  assert.deepEqual(removed, [[{ purpose: "media", path: "media/user_1/abc-drop.jpg" }]]);
  assert.deepEqual(writes.find((write) => write.op === "providerMedia.deleteMany")!.args, {
    where: { providerId: "provider_1", id: { notIn: ["m_keep"] } },
  });
  assert.deepEqual(writes.find((write) => write.op === "providerMedia.update")!.args, {
    where: { id: "m_keep" },
    data: { order: 1, title: "Après" },
  });
  assert.equal(writes.filter((write) => write.op === "providerMedia.create").length, 2);
});

test("media replacement rejects ids that belong to another provider", async () => {
  const { editor, removed } = makeEditor({ provider: ownProvider, media: [] });
  await assert.rejects(
    () => editor.replaceMedia(actor({ role: "PROVIDER" }), [{ kind: "IMAGE", id: "someone_else" }]),
    hasCode(400, "INVALID_MEDIA"),
  );
  assert.equal(removed.length, 0);
});

test("update switching category drops foreign skills and removes the replaced owned photo after commit", async () => {
  const { editor, events, writes, removed } = makeEditor({ provider: ownProvider });

  await editor.update(actor({ role: "PROVIDER" }), {
    subcategoryId: "sub_coiffure",
    profilePhoto: "media/user_1/abc-new.jpg",
    whatsapp: null,
    pricing: null,
  });

  const providerUpdate = writes.find((write) => write.op === "provider.update")!.args;
  assert.equal(providerUpdate.data.subcategoryId, "sub_coiffure");
  assert.equal(providerUpdate.data.whatsapp, null);
  assert.equal(providerUpdate.data.pricingAmount, null);
  assert.equal(
    providerUpdate.data.profilePhoto,
    "https://cdn.test/storage/v1/object/public/provider-media/media/user_1/abc-new.jpg",
  );
  assert.deepEqual(writes.find((write) => write.op === "providerSkill.deleteMany")!.args, {
    where: {
      providerId: "provider_1",
      item: { AND: [{ categoryId: { not: null } }, { categoryId: { not: "cat_beaute" } }] },
    },
  });
  assert.deepEqual(events, ["begin", "lock", "commit", "remove"]);
  assert.deepEqual(removed, [[{ purpose: "media", path: "media/user_1/abc-old.jpg" }]]);
});

test("replaceSchedule rewrites rules and exceptions atomically and returns the saved schedule", async () => {
  const { editor, writes } = makeEditor({ provider: ownProvider });
  const schedule = await editor.replaceSchedule(actor({ role: "PROVIDER" }), {
    timezone: "Africa/Lubumbashi",
    slotDurationMin: 30,
    slotBufferMin: 0,
    rules: [{ dayOfWeek: 2, startTime: "08:00", endTime: "10:00" }],
    exceptions: [{ date: "2030-01-01", isOpen: false }],
  });

  assert.deepEqual(
    writes.map((write) => write.op),
    [
      "provider.update",
      "availabilityRule.deleteMany",
      "availabilityRule.createMany",
      "availabilityException.deleteMany",
      "availabilityException.createMany",
    ],
  );
  assert.deepEqual(writes[2]!.args.data, [
    { dayOfWeek: 2, startTime: "08:00", endTime: "10:00", order: 0, providerId: "provider_1" },
  ]);
  assert.equal(schedule.timezone, "Africa/Lubumbashi");
  assert.deepEqual(schedule.exceptions[0], { date: "2030-01-01", isOpen: false, startTime: null, endTime: null, reason: null });
});

test("provider self-service endpoints are 404 without a provider profile; availability toggles", async () => {
  const missing = makeEditor();
  await assert.rejects(() => missing.editor.setAvailability(actor({ role: "PROVIDER" }), false), hasCode(404, "NOT_FOUND"));

  const { editor } = makeEditor({ provider: ownProvider });
  assert.deepEqual(await editor.setAvailability(actor({ role: "PROVIDER" }), false), { isAvailable: false });
});

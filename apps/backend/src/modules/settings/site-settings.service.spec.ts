import assert from "node:assert/strict";
import test from "node:test";
import { SiteSettingsService } from "./site-settings.service";

function fakePrisma(initial: Record<string, unknown>) {
  const rows = new Map(Object.entries(initial));
  return {
    rows,
    systemSetting: {
      findMany: async () => [...rows.entries()].map(([key, value]) => ({ key, value })),
      findUnique: async ({ where }: { where: { key: string } }) =>
        rows.has(where.key) ? { value: rows.get(where.key) } : null,
      upsert: async ({ where, update }: { where: { key: string }; update: { value: unknown } }) => {
        rows.set(where.key, update.value);
        return { key: where.key, value: update.value };
      },
    },
  };
}

test("getAll fills defaults, coerces stored booleans and ignores wrong types", async () => {
  const prisma = fakePrisma({
    hero_title: "Trouvez un pro",
    feat_booking: "false",
    contacts_require_premium: true,
    tagline: 42,
  });
  const service = new SiteSettingsService(prisma as never);

  const settings = await service.getAll();

  assert.equal(settings.hero_title, "Trouvez un pro");
  assert.equal(settings.feat_booking, false);
  assert.equal(settings.feat_reviews, true);
  assert.equal(settings.contacts_require_premium, true);
  assert.equal(settings.tagline, "");
  assert.equal(settings.maintenance_mode, false);
});

test("getBoolean falls back to the default when the row is missing", async () => {
  const service = new SiteSettingsService(fakePrisma({}) as never);
  assert.equal(await service.getBoolean("feat_booking"), true);
  assert.equal(await service.getBoolean("contacts_require_premium"), false);
});

test("update upserts only known keys and returns the merged settings", async () => {
  const prisma = fakePrisma({});
  const service = new SiteSettingsService(prisma as never);

  const settings = await service.update({ hero_title: "Bonjour", feat_reviews: false, nope: "x" } as never);

  assert.equal(settings.hero_title, "Bonjour");
  assert.equal(settings.feat_reviews, false);
  assert.equal(prisma.rows.has("nope"), false);
});

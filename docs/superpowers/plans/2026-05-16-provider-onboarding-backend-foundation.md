# Provider Onboarding — Plan 1: Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trim dead onboarding data, shrink the step model to 3 steps, add a Profile Strength computation + endpoint, add Supabase Storage infrastructure with a signed-upload endpoint, add provider avatar + portfolio endpoints, and replace the verification stub-URL with real Supabase Storage — all backend, fully `node:test`-covered.

**Architecture:** `@kayu/schemas` (ESM, zod v4) is the DTO source of truth, consumed by the CJS NestJS backend via dynamic `await import("@kayu/schemas")` inside `LazyZodValidationPipe`. Onboarding persistence has three tiers: real `User` columns, real `Provider` columns/relations, and a `User.onboardingDraft` JSON overflow blob governed by `OVERFLOW_KEYS`. Uploads use Supabase Storage signed upload URLs (client uploads directly; backend only issues URLs and confirms object paths) — no multipart middleware is added. Profile Strength is a pure function behind a dedicated read endpoint.

**Tech Stack:** NestJS (CJS), Prisma/Postgres, zod v4 (`@kayu/schemas`), `@supabase/supabase-js` (new backend dep), `node:test` + hand-rolled Prisma fakes.

**Prerequisites / commands (run from repo root unless noted):**
- Build schemas after any `packages/schemas` edit: `pnpm --filter @kayu/schemas build`
- Build api client after any `packages/api` edit: `pnpm --filter @kayu/api build`
- Backend type-check: `pnpm --filter @kayu/backend type-check`
- Run ONE backend spec (from `apps/backend/`): `node --test -r ts-node/register apps/backend/src/modules/<module>/<file>.spec.ts`
- Run all onboarding/providers/storage/verification specs (from `apps/backend/`): `node --test -r ts-node/register "src/modules/onboarding/*.spec.ts" "src/modules/providers/*.spec.ts" "src/modules/storage/*.spec.ts" "src/modules/verification/*.spec.ts"`

**Memory note:** Per project convention there are NO per-task commits during a feature; the user reviews the full diff before anything ships. The "Commit" steps below are written for tooling consistency but **batch them**: implement all tasks, run the full verification suite, then make a single commit at the end (Task 9). If executing via subagent-driven-development, skip the inline commit steps and commit once at the end.

---

### Task 1: Trim `ProviderDraftDto` and shrink the step model (schemas)

**Files:**
- Modify: `packages/schemas/src/dto.ts` (`ProviderDraftDto`, `DraftResponseSchema`, `OnboardingStatusSchema`)

- [ ] **Step 1: Edit `ProviderDraftDto`** — remove the five dead fields and shrink `onboardingStep`.

In `packages/schemas/src/dto.ts`, replace the `ProviderDraftDto` block (currently lines ~1137–1168) with exactly:

```ts
export const ProviderDraftDto = z.object({
  onboardingStep: z.number().int().min(0).max(2).optional(),

  // Step 1 — Toi & ton métier
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),

  primaryCategoryId: IdSchema.optional(),
  categoryIds: z.array(IdSchema).max(3).optional(),
  subcategoryIds: z.array(IdSchema).optional(),
  profession: z.string().min(2).optional(),
  skills: z.array(ProviderDraftSkillSchema).optional(),
  yearsOfExperience: z.number().int().min(0).max(60).optional(),
  description: z.string().max(1000).optional(),

  // Step 2 — Où tu interviens
  serviceZones: z.array(ServiceZoneInputSchema).optional(),

  // Step 3 — Ton prix de départ
  hourlyRate: z.number().int().positive().optional(),

  // Profile media (set post-publish via dedicated endpoints, kept here so the
  // draft response can echo the current avatar)
  avatar: z.string().optional(),
  languages: z.array(z.string()).optional(),
});
```

(Removed: `idFrontUploaded`, `idBackUploaded`, `zoneRadiusKm`, `visitFee`, `bio`. `onboardingStep` max 5 → 2.)

- [ ] **Step 2: Edit `DraftResponseSchema`** — shrink `step` bound.

Replace the `DraftResponseSchema` block (currently lines ~1170–1175) with exactly:

```ts
export const DraftResponseSchema = z.object({
  draft: ProviderDraftDto,
  step: z.number().int().min(0).max(2).nullable(),
  isComplete: z.boolean(),
  missingForPublish: z.array(z.string()).default([]),
});
```

- [ ] **Step 3: Edit `OnboardingStatusSchema`** — 3 steps, not 6.

Replace the `OnboardingStatusSchema` block (currently lines ~631–636) with exactly:

```ts
export const OnboardingStatusSchema = z.object({
  isComplete: z.boolean(),
  currentStep: z.number().int().min(0).max(2).nullable(),
  totalSteps: z.number().int().min(1).default(3),
  missingForPublish: z.array(z.string()).default([]),
});
```

- [ ] **Step 4: Build schemas and verify the fields are gone**

Run: `pnpm --filter @kayu/schemas build`
Expected: build succeeds, no TypeScript errors.

Run: `grep -nE "idFrontUploaded|idBackUploaded|zoneRadiusKm|visitFee|^\s*bio:" packages/schemas/src/dto.ts`
Expected: no matches inside the `ProviderDraftDto` block (other unrelated `bio` matches elsewhere in the file, if any, are fine — verify the four removed keys produce zero matches).

- [ ] **Step 5: Commit** (batch — see Memory note)

```bash
git add packages/schemas/src/dto.ts
git commit -m "feat(schemas): trim dead onboarding draft fields, shrink step model to 3"
```

---

### Task 2: Trim onboarding service overflow + drop the bio fallback

**Files:**
- Modify: `apps/backend/src/modules/onboarding/onboarding.service.ts`
- Test: `apps/backend/src/modules/onboarding/onboarding.service.spec.ts`

- [ ] **Step 1: Add a failing test for the trimmed overflow**

In `apps/backend/src/modules/onboarding/onboarding.service.spec.ts`, append this test at the end of the file (it asserts that removed keys never reach `User.onboardingDraft`, and that a legacy `bio` value in the stored JSON is ignored):

```ts
test("patchDraft no longer persists removed overflow keys", async () => {
  const calls: Record<string, unknown> = {};
  const prisma = {
    user: {
      findUnique: async () => ({
        ...makeUser({ onboardingDraft: { bio: "legacy bio", categoryIds: ["cat_1"] } }),
        provider: null,
      }),
      update: async (args: unknown) => {
        calls.userUpdate = args;
      },
    },
    $transaction: async (cb: (tx: unknown) => Promise<void>) =>
      cb({
        user: { update: async (args: unknown) => { calls.userUpdate = args; } },
      }),
  };
  const service = new OnboardingService(prisma as never, {} as never);

  await service.patchDraft(makeActor(), {
    // @ts-expect-error — these keys must no longer exist on ProviderDraftInput
    idFrontUploaded: true,
    // @ts-expect-error
    zoneRadiusKm: 12,
    firstName: "Jean",
  });

  const data = (calls.userUpdate as { data?: { onboardingDraft?: unknown } } | undefined)?.data;
  const draftJson = JSON.stringify(data?.onboardingDraft ?? {});
  assert.equal(draftJson.includes("idFrontUploaded"), false);
  assert.equal(draftJson.includes("zoneRadiusKm"), false);
  assert.equal(draftJson.includes("legacy bio"), false);
});
```

- [ ] **Step 2: Run the spec to verify the new test fails**

From `apps/backend/`:
Run: `node --test -r ts-node/register src/modules/onboarding/onboarding.service.spec.ts`
Expected: FAIL — the new test errors on the `@ts-expect-error` lines being unused OR the assertions failing because `bio`/overflow keys still flow through. (TypeScript via ts-node will report the `@ts-expect-error` as unused if the keys still exist on the type — that is the expected red.)

- [ ] **Step 3: Trim the local `ProviderDraftInput` type**

In `apps/backend/src/modules/onboarding/onboarding.service.ts`, replace the `ProviderDraftInput` type (lines ~17–43) with exactly:

```ts
export type ProviderDraftInput = {
  onboardingStep?: number;

  firstName?: string;
  lastName?: string;
  phone?: string;

  primaryCategoryId?: string;
  categoryIds?: string[];
  subcategoryIds?: string[];
  profession?: string;
  skills?: ProviderDraftSkillInput[];
  yearsOfExperience?: number;
  description?: string;

  serviceZones?: Array<{ city: string; commune?: string | null }>;

  hourlyRate?: number;

  avatar?: string;
  languages?: string[];
};
```

- [ ] **Step 4: Trim `OverflowDraft` and `OVERFLOW_KEYS`**

Replace the `OverflowDraft` type + `OVERFLOW_KEYS` const (lines ~45–67) with exactly:

```ts
type OverflowDraft = {
  primaryCategoryId?: string;
  categoryIds?: string[];
  subcategoryIds?: string[];
  languages?: string[];
};

const OVERFLOW_KEYS: (keyof OverflowDraft)[] = [
  "primaryCategoryId",
  "categoryIds",
  "subcategoryIds",
  "languages",
];
```

- [ ] **Step 5: Remove the dead fields + bio fallback from `buildDraftDto`**

In `buildDraftDto` (lines ~366–381), replace the `const draft: ProviderDraftInput = { ... };` literal with exactly:

```ts
    const draft: ProviderDraftInput = {
      onboardingStep: state.user.onboardingStep ?? undefined,
      firstName: state.user.firstName ?? undefined,
      lastName: state.user.lastName ?? undefined,
      phone: state.user.phone ?? undefined,
      avatar: state.user.avatar ?? undefined,
      primaryCategoryId: overflow.primaryCategoryId,
      categoryIds: overflow.categoryIds,
      subcategoryIds: overflow.subcategoryIds,
      languages: overflow.languages,
    };
```

Then delete the legacy bio-fallback block (lines ~410–413):

```ts
      if (!draft.profession && overflow.bio && state.provider.description) {
        draft.profession = state.provider.description;
        draft.description = overflow.bio;
      }
```

Delete those four lines entirely (do not replace).

- [ ] **Step 6: Run the full onboarding spec**

From `apps/backend/`:
Run: `node --test -r ts-node/register src/modules/onboarding/onboarding.service.spec.ts`
Expected: PASS — all pre-existing tests (happy-path publish, the four rejection tests) plus the new trimmed-overflow test pass.

- [ ] **Step 7: Backend type-check**

Run: `pnpm --filter @kayu/backend type-check`
Expected: PASS — no references to removed fields remain (the controller pipe uses the rebuilt schema from Task 1).

- [ ] **Step 8: Commit** (batch — see Memory note)

```bash
git add apps/backend/src/modules/onboarding/onboarding.service.ts apps/backend/src/modules/onboarding/onboarding.service.spec.ts
git commit -m "feat(onboarding): drop dead overflow fields and legacy bio fallback"
```

---

### Task 3: Profile Strength pure function

**Files:**
- Create: `apps/backend/src/modules/providers/provider-strength.ts`
- Test: `apps/backend/src/modules/providers/provider-strength.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/backend/src/modules/providers/provider-strength.spec.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { computeProviderStrength } from "./provider-strength";

const base = {
  hasAvatar: false,
  portfolioProjectCount: 0,
  hasDescription: false,
  verificationStatus: "PENDING" as const,
  languagesCount: 1,
  skillsCount: 0,
  serviceZonesCount: 1,
};

test("a freshly published profile is tier 'base' at baseline 40", () => {
  const r = computeProviderStrength(base);
  assert.equal(r.score, 40);
  assert.equal(r.tier, "base");
  const photo = r.items.find((i) => i.key === "photo");
  assert.equal(photo?.done, false);
  assert.equal(photo?.points, 15);
});

test("photo + description + 1 portfolio project reaches 'solide'", () => {
  const r = computeProviderStrength({
    ...base,
    hasAvatar: true,
    hasDescription: true,
    portfolioProjectCount: 1,
  });
  // 40 + 15 + 10 + 8 = 73
  assert.equal(r.score, 73);
  assert.equal(r.tier, "solide");
});

test("full enrichment reaches 100 and 'remarquable'", () => {
  const r = computeProviderStrength({
    hasAvatar: true,
    portfolioProjectCount: 3,
    hasDescription: true,
    verificationStatus: "VERIFIED",
    languagesCount: 2,
    skillsCount: 4,
    serviceZonesCount: 2,
  });
  // 40 + 15 + 20 + 10 + 10 + 5 = 100
  assert.equal(r.score, 100);
  assert.equal(r.tier, "remarquable");
  assert.equal(r.items.every((i) => i.done), true);
});

test("portfolio points scale 0/8/14/20 by project count", () => {
  const pts = (n: number) =>
    computeProviderStrength({ ...base, portfolioProjectCount: n }).items.find(
      (i) => i.key === "portfolio",
    )?.earned;
  assert.equal(pts(0), 0);
  assert.equal(pts(1), 8);
  assert.equal(pts(2), 14);
  assert.equal(pts(3), 20);
  assert.equal(pts(9), 20);
});

test("depth counts when any of languages>=2, skills>=3, zones>=2", () => {
  assert.equal(
    computeProviderStrength({ ...base, languagesCount: 2 }).items.find((i) => i.key === "depth")?.done,
    true,
  );
  assert.equal(
    computeProviderStrength({ ...base, skillsCount: 3 }).items.find((i) => i.key === "depth")?.done,
    true,
  );
  assert.equal(
    computeProviderStrength({ ...base, serviceZonesCount: 2 }).items.find((i) => i.key === "depth")?.done,
    true,
  );
  assert.equal(
    computeProviderStrength(base).items.find((i) => i.key === "depth")?.done,
    false,
  );
});
```

- [ ] **Step 2: Run the test to verify it fails**

From `apps/backend/`:
Run: `node --test -r ts-node/register src/modules/providers/provider-strength.spec.ts`
Expected: FAIL with "Cannot find module './provider-strength'".

- [ ] **Step 3: Implement the pure function**

Create `apps/backend/src/modules/providers/provider-strength.ts`:

```ts
export type ProviderStrengthInput = {
  hasAvatar: boolean;
  portfolioProjectCount: number;
  hasDescription: boolean;
  verificationStatus: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
  languagesCount: number;
  skillsCount: number;
  serviceZonesCount: number;
};

export type ProviderStrengthTier = "base" | "solide" | "remarquable";

export type ProviderStrengthItem = {
  key: "photo" | "portfolio" | "description" | "verification" | "depth";
  label: string;
  done: boolean;
  points: number; // max points this item can contribute
  earned: number; // points currently earned (0..points)
};

export type ProviderStrengthResult = {
  score: number; // 0..100
  tier: ProviderStrengthTier;
  items: ProviderStrengthItem[];
};

// Baseline awarded once the profile is published (identity, trade, zone, price
// are all required to publish — they are the essentials).
const BASELINE = 40;

function portfolioEarned(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 8;
  if (count === 2) return 14;
  return 20;
}

export function computeProviderStrength(
  input: ProviderStrengthInput,
): ProviderStrengthResult {
  const depthDone =
    input.languagesCount >= 2 ||
    input.skillsCount >= 3 ||
    input.serviceZonesCount >= 2;

  const items: ProviderStrengthItem[] = [
    {
      key: "photo",
      label: "Ajoute ta photo",
      done: input.hasAvatar,
      points: 15,
      earned: input.hasAvatar ? 15 : 0,
    },
    {
      key: "portfolio",
      label: "Construis ton portfolio",
      done: input.portfolioProjectCount >= 3,
      points: 20,
      earned: portfolioEarned(input.portfolioProjectCount),
    },
    {
      key: "description",
      label: "Soigne ta présentation",
      done: input.hasDescription,
      points: 10,
      earned: input.hasDescription ? 10 : 0,
    },
    {
      key: "verification",
      label: "Fais-toi vérifier",
      done: input.verificationStatus === "VERIFIED",
      points: 10,
      earned: input.verificationStatus === "VERIFIED" ? 10 : 0,
    },
    {
      key: "depth",
      label: "Complète tes infos",
      done: depthDone,
      points: 5,
      earned: depthDone ? 5 : 0,
    },
  ];

  const score = Math.min(
    100,
    BASELINE + items.reduce((sum, item) => sum + item.earned, 0),
  );

  const tier: ProviderStrengthTier =
    score >= 85 ? "remarquable" : score >= 55 ? "solide" : "base";

  return { score, tier, items };
}
```

- [ ] **Step 4: Run the test to verify it passes**

From `apps/backend/`:
Run: `node --test -r ts-node/register src/modules/providers/provider-strength.spec.ts`
Expected: PASS — all 5 tests pass.

- [ ] **Step 5: Commit** (batch — see Memory note)

```bash
git add apps/backend/src/modules/providers/provider-strength.ts apps/backend/src/modules/providers/provider-strength.spec.ts
git commit -m "feat(providers): add Profile Strength pure computation"
```

---

### Task 4: Profile Strength endpoint + schema + api client

**Files:**
- Modify: `packages/schemas/src/dto.ts` (add `ProviderStrengthResponseSchema`)
- Modify: `packages/api/src/endpoints.ts` (add `providersApi.getStrength`)
- Modify: `packages/api/src/query-keys.ts` (add `queryKeys.providers.strength`)
- Modify: `apps/backend/src/modules/providers/providers.service.ts` (add `getStrength`)
- Modify: `apps/backend/src/modules/providers/providers.controller.ts` (add route)
- Test: `apps/backend/src/modules/providers/providers.service.spec.ts`

- [ ] **Step 1: Add the response schema**

In `packages/schemas/src/dto.ts`, immediately AFTER the `OnboardingStatusSchema` block (the one edited in Task 1 Step 3), add:

```ts
export const ProviderStrengthItemSchema = z.object({
  key: z.enum(["photo", "portfolio", "description", "verification", "depth"]),
  label: z.string(),
  done: z.boolean(),
  points: z.number().int(),
  earned: z.number().int(),
});

export const ProviderStrengthResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  tier: z.enum(["base", "solide", "remarquable"]),
  items: z.array(ProviderStrengthItemSchema),
});
```

Then add the type exports next to the other onboarding type exports (near `export type DraftResponse = ...`, line ~1289):

```ts
export type ProviderStrengthResponse = z.infer<typeof ProviderStrengthResponseSchema>;
```

Run: `pnpm --filter @kayu/schemas build`
Expected: build succeeds.

- [ ] **Step 2: Add the api client method + query key**

In `packages/api/src/endpoints.ts`, add `ProviderStrengthResponse` to the existing `import type { ... } from "@kayu/schemas"` block, then replace the `providersApi` factory (lines ~179–193) with exactly the existing object plus one method:

```ts
export const providersApi = (client: ApiClient) => ({
  search: (params?: Partial<ProviderSearchParams>) =>
    client.get<ProvidersResponse>("/providers", params as Record<string, string | number | boolean | undefined>),
  getById: (id: string) =>
    client.get<ProviderProfileResponse>(`/providers/${id}`),
  availability: (id: string, params: { from: string; to: string }) =>
    client.get<AvailabilityResponse>(`/providers/${encodeURIComponent(id)}/availability`, params),
  updateMe: (data: UpdateProviderDto) =>
    client.patch<{ success: boolean }>("/providers/me", data),
  updateAvailability: (data: { isAvailable: boolean }) =>
    client.patch<{ success: boolean; isAvailable: boolean }>(
      "/providers/me/availability",
      data,
    ),
  getStrength: () =>
    client.get<ProviderStrengthResponse>("/providers/me/strength"),
});
```

In `packages/api/src/query-keys.ts`, replace the `providers` block (lines ~25–29) with:

```ts
  providers: {
    search: (params?: Partial<ProviderSearchParams>) =>
      ["providers", "search", params] as const,
    detail: (id: string) => ["providers", "detail", id] as const,
    strength: ["providers", "strength"] as const,
  },
```

Run: `pnpm --filter @kayu/api build`
Expected: build succeeds.

- [ ] **Step 3: Write the failing service test**

In `apps/backend/src/modules/providers/providers.service.spec.ts`, append:

```ts
test("getStrength derives strength from the caller's provider record", async () => {
  const prisma = {
    provider: {
      findUnique: async (args: unknown) => {
        assert.deepEqual((args as { where: unknown }).where, { userId: "user_1" });
        return {
          id: "provider_1",
          description: "Plombier fiable",
          verificationStatus: "PENDING",
          languages: ["Français"],
          user: { avatar: "https://cdn/x.jpg" },
          _count: { portfolioProjects: 2, skills: 4, serviceZones: 1 },
        };
      },
    },
  };
  const service = new ProvidersService(prisma as never, {} as never);
  const result = await service.getStrength({ id: "user_1" } as never);
  // 40 + photo15 + portfolio14 + description10 + depth5(skills>=3) = 84
  assert.equal(result.score, 84);
  assert.equal(result.tier, "solide");
});
```

> Note: match the existing `providers.service.spec.ts` import style. If the file constructs the service as `new ProvidersService(prisma as never, identity as never)`, keep the same second argument shape (`{} as never`). Open the file first and mirror its existing fixture/imports exactly (it follows the same `node:test` + hand-rolled fake pattern as `onboarding.service.spec.ts`).

- [ ] **Step 4: Run the test to verify it fails**

From `apps/backend/`:
Run: `node --test -r ts-node/register src/modules/providers/providers.service.spec.ts`
Expected: FAIL — `service.getStrength is not a function`.

- [ ] **Step 5: Implement `getStrength` in the service**

In `apps/backend/src/modules/providers/providers.service.ts`, add this import near the top with the other local imports:

```ts
import { computeProviderStrength } from "./provider-strength";
```

Add this public method to the `ProvidersService` class (place it next to `updateMe`):

```ts
  async getStrength(actor: User) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId: actor.id },
      select: {
        id: true,
        description: true,
        verificationStatus: true,
        languages: true,
        user: { select: { avatar: true } },
        _count: {
          select: {
            portfolioProjects: true,
            skills: true,
            serviceZones: true,
          },
        },
      },
    });
    if (!provider) {
      throw new NotFoundException("Provider profile not found");
    }
    return computeProviderStrength({
      hasAvatar: Boolean(provider.user?.avatar),
      portfolioProjectCount: provider._count.portfolioProjects,
      hasDescription: Boolean(provider.description && provider.description.trim().length > 0),
      verificationStatus: provider.verificationStatus,
      languagesCount: provider.languages.length,
      skillsCount: provider._count.skills,
      serviceZonesCount: provider._count.serviceZones,
    });
  }
```

> `NotFoundException` is already imported in this file (used by `updateMe`). `User` type is already imported (`import type { User } from "@prisma/client"` or via `Actor`). If `User` is not imported, add `import type { User } from "@prisma/client";`.

- [ ] **Step 6: Add the controller route**

In `apps/backend/src/modules/providers/providers.controller.ts`, add this method to `ProvidersController` (place it directly after `updateAvailability`, before `findById` — order matters: it must be declared before the `@Get(":id")` catch-all so `/me/strength` is not captured as `:id`):

```ts
  @Get("me/strength")
  @Roles("PROVIDER")
  @UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
  getStrength(@CurrentActor() actor: Actor) {
    return this.providers.getStrength(actor);
  }
```

> Critical: `@Get("me/strength")` MUST appear above `@Get(":id")` in the class body, otherwise Nest routes `/providers/me/strength` into `findById` with `id="me"`. Place it between `updateAvailability` (ends line ~105) and `@Get(":id")` (line ~107).

- [ ] **Step 7: Run the spec to verify it passes**

From `apps/backend/`:
Run: `node --test -r ts-node/register src/modules/providers/providers.service.spec.ts`
Expected: PASS — including the new `getStrength` test.

- [ ] **Step 8: Type-check**

Run: `pnpm --filter @kayu/backend type-check`
Expected: PASS.

- [ ] **Step 9: Commit** (batch — see Memory note)

```bash
git add packages/schemas/src/dto.ts packages/api/src/endpoints.ts packages/api/src/query-keys.ts apps/backend/src/modules/providers/providers.service.ts apps/backend/src/modules/providers/providers.controller.ts apps/backend/src/modules/providers/providers.service.spec.ts
git commit -m "feat(providers): add GET /providers/me/strength endpoint"
```

---

### Task 5: Supabase Storage module + signed-upload endpoint

**Files:**
- Modify: `apps/backend/package.json` (add `@supabase/supabase-js`)
- Create: `apps/backend/src/modules/storage/storage.service.ts`
- Create: `apps/backend/src/modules/storage/storage.module.ts`
- Create: `apps/backend/src/modules/storage/media.controller.ts`
- Modify: `apps/backend/src/app.module.ts` (register `StorageModule`)
- Modify: `packages/schemas/src/dto.ts` (add `UploadSignRequestDto`, `UploadSignResponseSchema`, `ConfirmAvatarDto`)
- Modify: `packages/api/src/endpoints.ts` (`mediaApi`)
- Test: `apps/backend/src/modules/storage/storage.service.spec.ts`

- [ ] **Step 1: Add the dependency**

In `apps/backend/package.json`, add to `"dependencies"` (keep alphabetical order in the block, matching existing formatting):

```json
"@supabase/supabase-js": "^2.103.0",
```

Run: `pnpm install`
Expected: lockfile updates, install succeeds (the version already exists in the workspace via `apps/web`).

- [ ] **Step 2: Add the upload schemas**

In `packages/schemas/src/dto.ts`, after `ProviderStrengthResponseSchema` (added in Task 4), add:

```ts
export const UploadPurposeSchema = z.enum(["avatar", "portfolio", "verification"]);

export const UploadSignRequestDto = z.object({
  purpose: UploadPurposeSchema,
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
});

export const UploadSignResponseSchema = z.object({
  bucket: z.string(),
  path: z.string(),
  token: z.string(),
  signedUrl: z.string(),
});

export const ConfirmAvatarDto = z.object({
  path: z.string().min(1),
});
```

Add type exports near the other DTO type exports:

```ts
export type UploadPurpose = z.infer<typeof UploadPurposeSchema>;
export type UploadSignRequestDtoType = z.infer<typeof UploadSignRequestDto>;
export type UploadSignResponse = z.infer<typeof UploadSignResponseSchema>;
export type ConfirmAvatarDtoType = z.infer<typeof ConfirmAvatarDto>;
```

Run: `pnpm --filter @kayu/schemas build`
Expected: build succeeds.

- [ ] **Step 3: Write the failing storage service test**

Create `apps/backend/src/modules/storage/storage.service.spec.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { StorageService } from "./storage.service";

function fakeSupabase(signed: { signedUrl: string; token: string; path: string }) {
  return {
    storage: {
      from(bucket: string) {
        return {
          async createSignedUploadUrl(path: string) {
            return { data: { ...signed, path: `${bucket}/${path}` }, error: null };
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `https://cdn.example/${bucket}/${path}` } };
          },
        };
      },
    },
  };
}

test("bucket + visibility policy per purpose", () => {
  const s = new StorageService(fakeSupabase({ signedUrl: "x", token: "t", path: "p" }) as never);
  assert.equal(s.bucketFor("avatar"), "avatars");
  assert.equal(s.bucketFor("portfolio"), "portfolio");
  assert.equal(s.bucketFor("verification"), "verification-docs");
  assert.equal(s.isPublic("avatar"), true);
  assert.equal(s.isPublic("portfolio"), true);
  assert.equal(s.isPublic("verification"), false);
});

test("buildObjectPath namespaces by purpose + actor and sanitizes the name", () => {
  const s = new StorageService(fakeSupabase({ signedUrl: "x", token: "t", path: "p" }) as never);
  const path = s.buildObjectPath("portfolio", "user_1", "Mon Chantier (1).JPG");
  assert.match(path, /^portfolio\/user_1\/[a-z0-9-]+-mon-chantier-1-\.jpg$/i);
});

test("assertOwnedPath accepts only the caller's namespace", () => {
  const s = new StorageService(fakeSupabase({ signedUrl: "x", token: "t", path: "p" }) as never);
  assert.equal(s.assertOwnedPath("avatar", "user_1", "avatar/user_1/abc-x.jpg"), true);
  assert.throws(() => s.assertOwnedPath("avatar", "user_1", "avatar/user_2/abc-x.jpg"));
  assert.throws(() => s.assertOwnedPath("avatar", "user_1", "portfolio/user_1/abc-x.jpg"));
});

test("resolveStoredUrl returns a public URL for public buckets, a storage ref for private", () => {
  const s = new StorageService(fakeSupabase({ signedUrl: "x", token: "t", path: "p" }) as never);
  assert.equal(
    s.resolveStoredUrl("avatar", "avatars/user_1/a.jpg"),
    "https://cdn.example/avatars/avatars/user_1/a.jpg",
  );
  assert.equal(
    s.resolveStoredUrl("verification", "verification-docs/user_1/a.jpg"),
    "storage://verification-docs/verification-docs/user_1/a.jpg",
  );
});

test("createSignedUpload returns bucket/path/token/signedUrl", async () => {
  const s = new StorageService(
    fakeSupabase({ signedUrl: "https://up", token: "tok", path: "ignored" }) as never,
  );
  const out = await s.createSignedUpload("avatar", "user_1", "pic.png");
  assert.equal(out.bucket, "avatars");
  assert.equal(out.token, "tok");
  assert.equal(out.signedUrl, "https://up");
  assert.match(out.path, /^avatar\/user_1\//);
});
```

- [ ] **Step 4: Run the test to verify it fails**

From `apps/backend/`:
Run: `node --test -r ts-node/register src/modules/storage/storage.service.spec.ts`
Expected: FAIL with "Cannot find module './storage.service'".

- [ ] **Step 5: Implement the storage service**

Create `apps/backend/src/modules/storage/storage.service.ts`:

```ts
import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_CLIENT = "SUPABASE_CLIENT";

export type UploadPurpose = "avatar" | "portfolio" | "verification";

const BUCKETS: Record<UploadPurpose, string> = {
  avatar: "avatars",
  portfolio: "portfolio",
  verification: "verification-docs",
};

const PUBLIC: Record<UploadPurpose, boolean> = {
  avatar: true,
  portfolio: true,
  verification: false,
};

@Injectable()
export class StorageService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  bucketFor(purpose: UploadPurpose): string {
    return BUCKETS[purpose];
  }

  isPublic(purpose: UploadPurpose): boolean {
    return PUBLIC[purpose];
  }

  buildObjectPath(
    purpose: UploadPurpose,
    actorId: string,
    fileName: string,
  ): string {
    const safe = fileName
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 200);
    const suffix = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    return `${purpose}/${actorId}/${suffix}-${safe}`;
  }

  assertOwnedPath(
    purpose: UploadPurpose,
    actorId: string,
    path: string,
  ): true {
    if (!path.startsWith(`${purpose}/${actorId}/`)) {
      throw new ForbiddenException("Upload path does not belong to the caller");
    }
    return true;
  }

  async createSignedUpload(
    purpose: UploadPurpose,
    actorId: string,
    fileName: string,
  ): Promise<{ bucket: string; path: string; token: string; signedUrl: string }> {
    const bucket = this.bucketFor(purpose);
    const path = this.buildObjectPath(purpose, actorId, fileName);
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);
    if (error || !data) {
      throw new Error(`Failed to create signed upload URL: ${error?.message ?? "unknown"}`);
    }
    return { bucket, path, token: data.token, signedUrl: data.signedUrl };
  }

  resolveStoredUrl(purpose: UploadPurpose, path: string): string {
    const bucket = this.bucketFor(purpose);
    if (this.isPublic(purpose)) {
      const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    }
    return `storage://${bucket}/${path}`;
  }
}
```

- [ ] **Step 6: Implement the module + Supabase client provider**

Create `apps/backend/src/modules/storage/storage.module.ts`:

```ts
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";
import { StorageService, SUPABASE_CLIENT } from "./storage.service";
import { MediaController } from "./media.controller";

@Global()
@Module({
  controllers: [MediaController],
  providers: [
    {
      provide: SUPABASE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>("SUPABASE_URL");
        const key = config.get<string>("SUPABASE_SERVICE_KEY");
        if (!url || !key || url.includes("<project-ref>")) {
          throw new Error(
            "SUPABASE_URL / SUPABASE_SERVICE_KEY are not configured",
          );
        }
        return createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
      },
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
```

- [ ] **Step 7: Implement the media controller (sign + avatar confirm)**

Create `apps/backend/src/modules/storage/media.controller.ts`:

```ts
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { CurrentActor, LazyZodValidationPipe } from "../../common";
import { ActorGuard } from "../../common/guards/actor.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { PrismaService } from "../../database/prisma.service";
import { StorageService } from "./storage.service";

type UploadSignBody = {
  purpose: "avatar" | "portfolio" | "verification";
  fileName: string;
  mimeType: string;
};

type ConfirmAvatarBody = { path: string };

const signBodyPipe = new LazyZodValidationPipe(async () => {
  const { UploadSignRequestDto } = await import("@kayu/schemas");
  return UploadSignRequestDto;
});

const confirmAvatarPipe = new LazyZodValidationPipe(async () => {
  const { ConfirmAvatarDto } = await import("@kayu/schemas");
  return ConfirmAvatarDto;
});

@Controller("me")
@UseGuards(SupabaseGuard, ActorGuard)
export class MediaController {
  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("uploads/sign")
  sign(
    @CurrentActor() actor: Actor,
    @Body(signBodyPipe) body: UploadSignBody,
  ) {
    return this.storage.createSignedUpload(
      body.purpose,
      actor.id,
      body.fileName,
    );
  }

  @Post("avatar")
  async setAvatar(
    @CurrentActor() actor: Actor,
    @Body(confirmAvatarPipe) body: ConfirmAvatarBody,
  ) {
    this.storage.assertOwnedPath("avatar", actor.id, body.path);
    const avatarUrl = this.storage.resolveStoredUrl("avatar", body.path);
    await this.prisma.user.update({
      where: { id: actor.id },
      data: { avatar: avatarUrl },
    });
    return { success: true as const, avatarUrl };
  }
}
```

- [ ] **Step 8: Register the module**

In `apps/backend/src/app.module.ts`, add `import { StorageModule } from "./modules/storage/storage.module";` with the other module imports, and add `StorageModule,` to the `imports:` array (place it after `CommonModule,` so it is available globally before feature modules).

- [ ] **Step 9: Add the api client `mediaApi`**

In `packages/api/src/endpoints.ts`, add `UploadSignRequestDtoType`, `UploadSignResponse`, `ConfirmAvatarDtoType` to the `import type ... from "@kayu/schemas"` block, then add this factory near `onboardingApi`:

```ts
export const mediaApi = (client: ApiClient) => ({
  sign: (data: UploadSignRequestDtoType) =>
    client.post<UploadSignResponse>("/me/uploads/sign", data),
  setAvatar: (data: ConfirmAvatarDtoType) =>
    client.post<{ success: boolean; avatarUrl: string }>("/me/avatar", data),
});
```

Run: `pnpm --filter @kayu/api build`
Expected: build succeeds.

- [ ] **Step 10: Run the storage spec + type-check**

From `apps/backend/`:
Run: `node --test -r ts-node/register src/modules/storage/storage.service.spec.ts`
Expected: PASS — all 5 tests pass.

Run: `pnpm --filter @kayu/backend type-check`
Expected: PASS.

- [ ] **Step 11: Commit** (batch — see Memory note)

```bash
git add apps/backend/package.json pnpm-lock.yaml apps/backend/src/modules/storage apps/backend/src/app.module.ts packages/schemas/src/dto.ts packages/api/src/endpoints.ts
git commit -m "feat(storage): Supabase Storage module + signed-upload & avatar endpoints"
```

---

### Task 6: Provider portfolio CRUD endpoints

**Files:**
- Modify: `packages/schemas/src/dto.ts` (portfolio DTOs)
- Modify: `packages/api/src/endpoints.ts` + `packages/api/src/query-keys.ts`
- Modify: `apps/backend/src/modules/providers/providers.service.ts`
- Modify: `apps/backend/src/modules/providers/providers.controller.ts`
- Modify: `apps/backend/src/modules/providers/providers.module.ts` (ensure `StorageService` is injectable — it is `@Global` from Task 5, so no import needed; verify)
- Test: `apps/backend/src/modules/providers/providers.service.spec.ts`

- [ ] **Step 1: Add the portfolio schemas**

In `packages/schemas/src/dto.ts`, after the upload schemas from Task 5, add:

```ts
export const PortfolioImageInputSchema = z.object({
  imageType: z.enum(["BEFORE", "DURING", "AFTER", "GENERAL", "DETAIL", "PLAN"]).default("GENERAL"),
  path: z.string().min(1),
  caption: z.string().max(200).optional(),
  displayOrder: z.number().int().min(0).default(0),
});

export const PortfolioProjectInputDto = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  categoryId: IdSchema.optional(),
  duration: z.number().int().min(0).optional(),
  price: z.number().min(0).optional(),
  images: z.array(PortfolioImageInputSchema).min(1).max(12),
});

export const PortfolioImageSchema = z.object({
  id: z.string(),
  imageType: z.enum(["BEFORE", "DURING", "AFTER", "GENERAL", "DETAIL", "PLAN"]),
  imageUrl: z.string(),
  caption: z.string().nullable(),
  displayOrder: z.number().int(),
});

export const PortfolioProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  categoryId: z.string().nullable(),
  duration: z.number().int().nullable(),
  price: z.number().nullable(),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  images: z.array(PortfolioImageSchema),
  createdAt: z.string(),
});

export const PortfolioListResponseSchema = z.object({
  projects: z.array(PortfolioProjectSchema),
});

export const PortfolioMutationResponseSchema = z.object({
  success: z.boolean(),
  project: PortfolioProjectSchema,
});
```

Add type exports:

```ts
export type PortfolioProjectInputDtoType = z.infer<typeof PortfolioProjectInputDto>;
export type PortfolioProject = z.infer<typeof PortfolioProjectSchema>;
export type PortfolioListResponse = z.infer<typeof PortfolioListResponseSchema>;
export type PortfolioMutationResponse = z.infer<typeof PortfolioMutationResponseSchema>;
```

Run: `pnpm --filter @kayu/schemas build`
Expected: build succeeds.

- [ ] **Step 2: Write the failing service tests**

In `apps/backend/src/modules/providers/providers.service.spec.ts`, append:

```ts
test("createPortfolioProject confirms image paths and persists the project", async () => {
  const calls: Record<string, unknown> = {};
  const prisma = {
    provider: {
      findUnique: async () => ({ id: "provider_1" }),
    },
    portfolioProject: {
      create: async (args: unknown) => {
        calls.create = args;
        return {
          id: "proj_1",
          title: "Fuite cuisine",
          description: null,
          categoryId: null,
          duration: null,
          price: null,
          isFeatured: false,
          isPublished: true,
          createdAt: new Date("2026-05-16T00:00:00.000Z"),
          images: [
            {
              id: "img_1",
              imageType: "BEFORE",
              imageUrl: "https://cdn/p.jpg",
              caption: null,
              displayOrder: 0,
            },
          ],
        };
      },
    },
  };
  const storage = {
    assertOwnedPath: (_p: string, _a: string, _path: string) => true,
    resolveStoredUrl: (_p: string, path: string) => `https://cdn/${path}`,
  };
  const service = new ProvidersService(prisma as never, {} as never);
  // @ts-expect-error — test-inject the storage collaborator
  service.storage = storage;
  const result = await service.createPortfolioProject({ id: "user_1" } as never, {
    title: "Fuite cuisine",
    images: [{ imageType: "BEFORE", path: "portfolio/user_1/x.jpg", displayOrder: 0 }],
  });
  assert.equal(result.success, true);
  assert.equal(result.project.id, "proj_1");
  const createData = (calls.create as { data: { images: { create: unknown[] } } }).data;
  assert.equal(
    (createData.images.create[0] as { imageUrl: string }).imageUrl,
    "https://cdn/portfolio/user_1/x.jpg",
  );
});

test("deletePortfolioProject rejects a project owned by another provider", async () => {
  const prisma = {
    provider: { findUnique: async () => ({ id: "provider_1" }) },
    portfolioProject: {
      findUnique: async () => ({ id: "proj_9", providerId: "provider_OTHER" }),
    },
  };
  const service = new ProvidersService(prisma as never, {} as never);
  await assert.rejects(() =>
    service.deletePortfolioProject({ id: "user_1" } as never, "proj_9"),
  );
});
```

> Mirror the file's existing `ProvidersService` constructor signature exactly when constructing the service (use `{} as never` for the second collaborator if that is the established pattern, as in `onboarding.service.spec.ts`).

- [ ] **Step 3: Run the spec to verify it fails**

From `apps/backend/`:
Run: `node --test -r ts-node/register src/modules/providers/providers.service.spec.ts`
Expected: FAIL — `service.createPortfolioProject is not a function`.

- [ ] **Step 4: Inject `StorageService` into `ProvidersService`**

In `apps/backend/src/modules/providers/providers.service.ts`, add the import:

```ts
import { StorageService } from "../storage/storage.service";
```

Add `private readonly storage: StorageService` to the `ProvidersService` constructor parameter list (append it as the last constructor parameter; do not reorder existing ones).

- [ ] **Step 5: Implement portfolio methods**

Add these methods to `ProvidersService` (next to `getStrength`):

```ts
  private async requireOwnProviderId(actor: User): Promise<string> {
    const provider = await this.prisma.provider.findUnique({
      where: { userId: actor.id },
      select: { id: true },
    });
    if (!provider) {
      throw new NotFoundException("Provider profile not found");
    }
    return provider.id;
  }

  async listPortfolio(actor: User) {
    const providerId = await this.requireOwnProviderId(actor);
    const projects = await this.prisma.portfolioProject.findMany({
      where: { providerId },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      include: { images: { orderBy: { displayOrder: "asc" } } },
    });
    return { projects: projects.map((p) => this.mapPortfolioProject(p)) };
  }

  async createPortfolioProject(
    actor: User,
    body: {
      title: string;
      description?: string;
      categoryId?: string;
      duration?: number;
      price?: number;
      images: Array<{
        imageType?: "BEFORE" | "DURING" | "AFTER" | "GENERAL" | "DETAIL" | "PLAN";
        path: string;
        caption?: string;
        displayOrder?: number;
      }>;
    },
  ) {
    const providerId = await this.requireOwnProviderId(actor);
    const images = body.images.map((img, index) => {
      this.storage.assertOwnedPath("portfolio", actor.id, img.path);
      return {
        imageType: img.imageType ?? "GENERAL",
        imageUrl: this.storage.resolveStoredUrl("portfolio", img.path),
        caption: img.caption ?? null,
        displayOrder: img.displayOrder ?? index,
      };
    });
    const project = await this.prisma.portfolioProject.create({
      data: {
        providerId,
        title: body.title,
        description: body.description ?? null,
        categoryId: body.categoryId ?? null,
        duration: body.duration ?? null,
        price: body.price ?? null,
        images: { create: images },
      },
      include: { images: { orderBy: { displayOrder: "asc" } } },
    });
    return { success: true as const, project: this.mapPortfolioProject(project) };
  }

  async updatePortfolioProject(
    actor: User,
    id: string,
    body: {
      title: string;
      description?: string;
      categoryId?: string;
      duration?: number;
      price?: number;
      images: Array<{
        imageType?: "BEFORE" | "DURING" | "AFTER" | "GENERAL" | "DETAIL" | "PLAN";
        path: string;
        caption?: string;
        displayOrder?: number;
      }>;
    },
  ) {
    const providerId = await this.requireOwnProviderId(actor);
    const existing = await this.prisma.portfolioProject.findUnique({
      where: { id },
      select: { id: true, providerId: true },
    });
    if (!existing || existing.providerId !== providerId) {
      throw new NotFoundException("Portfolio project not found");
    }
    const images = body.images.map((img, index) => {
      this.storage.assertOwnedPath("portfolio", actor.id, img.path);
      return {
        imageType: img.imageType ?? "GENERAL",
        imageUrl: this.storage.resolveStoredUrl("portfolio", img.path),
        caption: img.caption ?? null,
        displayOrder: img.displayOrder ?? index,
      };
    });
    const project = await this.prisma.$transaction(async (tx) => {
      await tx.portfolioImage.deleteMany({ where: { projectId: id } });
      return tx.portfolioProject.update({
        where: { id },
        data: {
          title: body.title,
          description: body.description ?? null,
          categoryId: body.categoryId ?? null,
          duration: body.duration ?? null,
          price: body.price ?? null,
          images: { create: images },
        },
        include: { images: { orderBy: { displayOrder: "asc" } } },
      });
    });
    return { success: true as const, project: this.mapPortfolioProject(project) };
  }

  async deletePortfolioProject(actor: User, id: string) {
    const providerId = await this.requireOwnProviderId(actor);
    const existing = await this.prisma.portfolioProject.findUnique({
      where: { id },
      select: { id: true, providerId: true },
    });
    if (!existing || existing.providerId !== providerId) {
      throw new NotFoundException("Portfolio project not found");
    }
    await this.prisma.portfolioProject.delete({ where: { id } });
    return { success: true as const };
  }

  private mapPortfolioProject(project: {
    id: string;
    title: string;
    description: string | null;
    categoryId: string | null;
    duration: number | null;
    price: number | null;
    isFeatured: boolean;
    isPublished: boolean;
    createdAt: Date;
    images: Array<{
      id: string;
      imageType: string;
      imageUrl: string;
      caption: string | null;
      displayOrder: number;
    }>;
  }) {
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      categoryId: project.categoryId,
      duration: project.duration,
      price: project.price,
      isFeatured: project.isFeatured,
      isPublished: project.isPublished,
      createdAt: project.createdAt.toISOString(),
      images: project.images.map((img) => ({
        id: img.id,
        imageType: img.imageType as
          | "BEFORE" | "DURING" | "AFTER" | "GENERAL" | "DETAIL" | "PLAN",
        imageUrl: img.imageUrl,
        caption: img.caption,
        displayOrder: img.displayOrder,
      })),
    };
  }
```

- [ ] **Step 6: Add controller routes**

In `apps/backend/src/modules/providers/providers.controller.ts`, add a body pipe near the existing pipes:

```ts
const portfolioBodyPipe = new LazyZodValidationPipe(async () => {
  const { PortfolioProjectInputDto } = await import("@kayu/schemas");
  return PortfolioProjectInputDto;
});
```

Add `Delete` and `Post` to the `@nestjs/common` import (the file currently imports `Body, Controller, Get, Patch, Query, Req, Param, UseGuards` — add `Post, Delete`). Add these methods to `ProvidersController` **between `@Get("me/strength")` (Task 4) and `@Get(":id")`** (the catch-all must stay last):

```ts
  @Get("me/portfolio")
  @Roles("PROVIDER")
  @UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
  listPortfolio(@CurrentActor() actor: Actor) {
    return this.providers.listPortfolio(actor);
  }

  @Post("me/portfolio")
  @Roles("PROVIDER")
  @UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
  createPortfolio(
    @CurrentActor() actor: Actor,
    @Body(portfolioBodyPipe) body: never,
  ) {
    return this.providers.createPortfolioProject(actor, body);
  }

  @Patch("me/portfolio/:id")
  @Roles("PROVIDER")
  @UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
  updatePortfolio(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(portfolioBodyPipe) body: never,
  ) {
    return this.providers.updatePortfolioProject(actor, id, body);
  }

  @Delete("me/portfolio/:id")
  @Roles("PROVIDER")
  @UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
  deletePortfolio(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.providers.deletePortfolioProject(actor, id);
  }
```

> The `body: never` typing matches the file's existing convention for lazy-validated bodies (see `updateMe`'s `UpdateProviderBody`); declare a local `type PortfolioBody = { title: string; description?: string; categoryId?: string; duration?: number; price?: number; images: Array<{ imageType?: "BEFORE"|"DURING"|"AFTER"|"GENERAL"|"DETAIL"|"PLAN"; path: string; caption?: string; displayOrder?: number }> };` near `UpdateProviderBody` and use it instead of `never` for both `createPortfolio` and `updatePortfolio` so the service-call types line up.

- [ ] **Step 7: Add api client + query key**

In `packages/api/src/endpoints.ts`, add `PortfolioProjectInputDtoType`, `PortfolioListResponse`, `PortfolioMutationResponse` to the schemas import, then add the methods to `providersApi` (extend the object from Task 4 Step 2):

```ts
  listPortfolio: () =>
    client.get<PortfolioListResponse>("/providers/me/portfolio"),
  createPortfolio: (data: PortfolioProjectInputDtoType) =>
    client.post<PortfolioMutationResponse>("/providers/me/portfolio", data),
  updatePortfolio: (id: string, data: PortfolioProjectInputDtoType) =>
    client.patch<PortfolioMutationResponse>(`/providers/me/portfolio/${id}`, data),
  deletePortfolio: (id: string) =>
    client.delete<{ success: boolean }>(`/providers/me/portfolio/${id}`),
```

In `packages/api/src/query-keys.ts`, add to the `providers` block: `portfolio: ["providers", "portfolio"] as const,`.

Run: `pnpm --filter @kayu/api build`
Expected: build succeeds.

- [ ] **Step 8: Run the spec + type-check**

From `apps/backend/`:
Run: `node --test -r ts-node/register src/modules/providers/providers.service.spec.ts`
Expected: PASS — including the two new portfolio tests.

Run: `pnpm --filter @kayu/backend type-check`
Expected: PASS.

- [ ] **Step 9: Commit** (batch — see Memory note)

```bash
git add packages/schemas/src/dto.ts packages/api/src/endpoints.ts packages/api/src/query-keys.ts apps/backend/src/modules/providers
git commit -m "feat(providers): provider portfolio CRUD endpoints"
```

---

### Task 7: Wire real Supabase Storage into verification uploads

**Files:**
- Modify: `packages/schemas/src/verification.ts` (`UploadVerificationDocDto`, `VerificationStoragePolicy`)
- Modify: `apps/backend/src/modules/verification/verification.service.ts`
- Modify: `apps/backend/src/modules/verification/verification.module.ts`
- Test: `apps/backend/src/modules/verification/verification.service.spec.ts` (create if absent)

- [ ] **Step 1: Extend the verification DTO + storage policy**

In `packages/schemas/src/verification.ts`:
- Change `VerificationStoragePolicy` (currently `z.enum(["LAUNCH_STUB_METADATA_ONLY"])`) to `z.enum(["LAUNCH_STUB_METADATA_ONLY", "SUPABASE_PRIVATE"])`.
- In `UploadVerificationDocDto` (currently `{ kind, fileName?, fileSize?, mimeType? }`) add a required `path`: replace the object with:

```ts
export const UploadVerificationDocDto = z.object({
  kind: VerificationDocKind,
  path: z.string().min(1),
  fileName: z.string().max(255).optional(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().max(120).optional(),
});
```

Run: `pnpm --filter @kayu/schemas build`
Expected: build succeeds.

- [ ] **Step 2: Write the failing verification test**

Check whether `apps/backend/src/modules/verification/verification.service.spec.ts` exists.
Run (from repo root): `ls apps/backend/src/modules/verification/verification.service.spec.ts`

If it does NOT exist, create it with this content; if it DOES exist, append the single `test(...)` block below to it (reusing its existing fixture helpers — adapt the fake to match its style):

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { VerificationService } from "./verification.service";

test("uploadDoc stores the resolved Supabase storage URL, not a launch stub", async () => {
  const calls: Record<string, unknown> = {};
  const tx = {
    provider: {
      findUniqueOrThrow: async () => ({ verificationStatus: "PENDING" }),
    },
    verificationDoc: {
      findFirst: async () => null,
      create: async (args: { data: { url: string } }) => {
        calls.create = args;
        return {
          id: "doc_1",
          kind: "ID_FRONT",
          url: args.data.url,
          fileName: "id.jpg",
          fileSize: null,
          mimeType: null,
          uploadedAt: new Date("2026-05-16T00:00:00.000Z"),
          reviewedAt: null,
          reviewedBy: null,
          decision: null,
          rejectionReason: null,
        };
      },
      findMany: async () => [{ kind: "ID_FRONT", decision: null }],
    },
    provider2: {},
  };
  const prisma = {
    provider: { findUnique: async () => ({ id: "provider_1" }) },
    $transaction: async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx),
  };
  const storage = {
    assertOwnedPath: () => true,
    resolveStoredUrl: (_p: string, path: string) => `storage://verification-docs/${path}`,
  };
  const service = new VerificationService(prisma as never);
  // @ts-expect-error — inject storage collaborator
  service.storage = storage;

  const result = await service.uploadDoc({ id: "user_1", role: "PROVIDER" } as never, {
    kind: "ID_FRONT",
    path: "verification/user_1/abc-id.jpg",
  });

  const created = (calls.create as { data: { url: string } }).data.url;
  assert.equal(created.startsWith("storage://verification-docs/"), true);
  assert.equal(created.includes("launch-stub://"), false);
  assert.equal(result.success, true);
});
```

- [ ] **Step 3: Run the test to verify it fails**

From `apps/backend/`:
Run: `node --test -r ts-node/register src/modules/verification/verification.service.spec.ts`
Expected: FAIL — `uploadDoc` still calls `buildStubUrl` (URL starts with `launch-stub://`) and `service.storage` is undefined.

- [ ] **Step 4: Inject `StorageService` into `VerificationService`**

In `apps/backend/src/modules/verification/verification.service.ts`:
- Add import: `import { StorageService } from "../storage/storage.service";`
- Change the constructor to:

```ts
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}
```

- [ ] **Step 5: Replace the stub URL with the resolved storage URL**

In `verification.service.ts`, change the `UploadDocInput` type (lines ~17–22) to add `path`:

```ts
type UploadDocInput = {
  kind: VerificationDocKind;
  path: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
};
```

In `uploadDoc` (lines ~92–95), replace:

```ts
    const providerId = await this.requireProviderId(actor);
    const normalizedFileName = this.normalizeFileName(body.kind, body.fileName);
    const generatedUrl = this.buildStubUrl(providerId, body.kind, normalizedFileName);
```

with:

```ts
    const providerId = await this.requireProviderId(actor);
    this.storage.assertOwnedPath("verification", actor.id, body.path);
    const normalizedFileName = this.normalizeFileName(body.kind, body.fileName);
    const generatedUrl = this.storage.resolveStoredUrl("verification", body.path);
```

Update the `VERIFICATION_STORAGE` constant (lines ~36–41) to:

```ts
const VERIFICATION_STORAGE = {
  mode: "SUPABASE_PRIVATE" as const,
  title: "Stockage privé Supabase",
  description:
    "Les pièces KYC sont stockées dans un bucket privé Supabase. Seule l'équipe de vérification y accède.",
};
```

Delete the now-unused `buildStubUrl` private method (lines ~417–426). Leave `normalizeFileName` in place (still used).

- [ ] **Step 6: Make `StorageService` available to the verification module**

`StorageModule` is `@Global()` (Task 5 Step 6), so `StorageService` is injectable without importing the module. Verify `apps/backend/src/modules/verification/verification.module.ts` does not need changes; if Nest fails to resolve `StorageService` at runtime, add `imports: [StorageModule]` (import from `../storage/storage.module`). Confirm via type-check + the spec run below.

- [ ] **Step 7: Run the spec + type-check**

From `apps/backend/`:
Run: `node --test -r ts-node/register src/modules/verification/verification.service.spec.ts`
Expected: PASS — the upload now stores `storage://verification-docs/...`.

Run: `pnpm --filter @kayu/backend type-check`
Expected: PASS — no remaining references to `buildStubUrl`.

- [ ] **Step 8: Update the verification api client**

In `packages/api/src/endpoints.ts`, the `verificationApi.uploadDoc` already sends `UploadVerificationDocDtoType`; the schema change in Step 1 makes `path` required on that type automatically. No code change needed — verify by running `pnpm --filter @kayu/api build` (Expected: success).

- [ ] **Step 9: Commit** (batch — see Memory note)

```bash
git add packages/schemas/src/verification.ts apps/backend/src/modules/verification packages/api
git commit -m "feat(verification): store KYC docs in Supabase private storage"
```

---

### Task 8: Full backend verification suite

**Files:** none (verification gate only)

- [ ] **Step 1: Run every affected backend spec**

From `apps/backend/`:
Run: `node --test -r ts-node/register "src/modules/onboarding/*.spec.ts" "src/modules/providers/*.spec.ts" "src/modules/storage/*.spec.ts" "src/modules/verification/*.spec.ts"`
Expected: PASS — all suites green (onboarding, providers incl. strength + portfolio, storage, verification).

- [ ] **Step 2: Full backend type-check**

Run: `pnpm --filter @kayu/backend type-check`
Expected: PASS.

- [ ] **Step 3: Confirm package builds are current**

Run: `pnpm --filter @kayu/schemas build && pnpm --filter @kayu/api build`
Expected: both succeed (the CJS backend consumes `dist/`; these must be rebuilt for downstream Plans 2 & 3).

---

### Task 9: Single feature commit (replaces the per-task commits above)

**Files:** all of the above.

- [ ] **Step 1: Review the full diff**

Run: `git status && git diff --stat`
Expected: only the files listed across Tasks 1–7, plus `pnpm-lock.yaml`.

- [ ] **Step 2: One commit for the backend foundation**

> Per the Memory note, prefer a single commit for the whole plan rather than the per-task commits. If you committed per task during execution, this step is a no-op; otherwise:

```bash
git add packages/schemas packages/api apps/backend
git commit -m "feat(onboarding): backend foundation for provider onboarding redesign

- trim dead onboarding draft fields, 3-step model
- Profile Strength computation + GET /providers/me/strength
- Supabase Storage module + signed-upload & avatar endpoints
- provider portfolio CRUD
- KYC docs stored in Supabase private storage"
```

---

## Self-Review

Checked against the spec's "Data & backend changes", "Profile Strength", "Step state & publish", and "Out of scope" sections:

- **Remove dead fields** → Task 1 (schemas) + Task 2 (service `ProviderDraftInput`/`OverflowDraft`/`OVERFLOW_KEYS` + bio fallback). ✓
- **3-step model** → Task 1 (`onboardingStep`/`step`/`OnboardingStatusSchema` bounds + `totalSteps` 3). ✓
- **Profile Strength pure fn, backend-side, fixed tiers, node:test** → Task 3 + Task 4 endpoint. ✓
- **Supabase Storage, signed upload URLs, no multipart** → Task 5 (signed-upload endpoint, client-direct). ✓
- **Avatar set endpoint → User.avatar** → Task 5 Step 7 (`POST /me/avatar`). ✓
- **Provider portfolio CRUD onto existing PortfolioProject/PortfolioImage** → Task 6. ✓
- **Real storage into existing verification (replace stub seam)** → Task 7 (replaces `buildStubUrl`, integrates existing `VerificationModule`). ✓
- **No `@@unique([providerId,kind])` migration** — intentionally omitted (app-enforced today; not required by the spec; YAGNI). Noted here so a reviewer knows it was a conscious choice.
- **`hourlyRate` legacy name** kept (spec §"out of scope": v1 deferred rename). ✓

Type consistency: `computeProviderStrength` signature/return is used identically in Task 3 (definition), Task 4 (service call + schema), and the spec. `StorageService` method names (`bucketFor`, `isPublic`, `buildObjectPath`, `assertOwnedPath`, `createSignedUpload`, `resolveStoredUrl`) are used consistently in Tasks 5, 6, 7. Upload `purpose` enum (`avatar|portfolio|verification`) is identical across schema, `StorageService`, and `MediaController`.

Placeholder scan: no TBD/TODO; every code step shows complete code; every test step shows the assertion and the exact run command + expected result. The only conditional is Task 7 Step 2 (spec file may or may not exist) — both branches are fully specified.

Web work (Phase 1 wizard, Phase 2 module/editors) is intentionally **out of scope for this plan** — it is Plans 2 and 3.

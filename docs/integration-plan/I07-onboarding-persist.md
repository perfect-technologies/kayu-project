# I07 — Provider Onboarding draft + publish

## Goal

Replace the localStorage-only draft with server-side persistence. Every step saves to the backend via a debounced `PATCH /me/provider-draft`. Publishing transitions the draft to a full Provider record and navigates to the dashboard. Onboarding progress survives app reload, device switch, and is auditable.

## Why it matters

Pros drop off onboarding at high rates if they lose progress. LocalStorage works until a tab closes or a device breaks. Server-side persistence is the minimum bar for a trust marketplace.

## Scope

### In scope
- Add `User.onboardingStep` field (nullable, 0-6)
- Add `Provider.onboardingCompleteAt` field (nullable datetime)
- Extend or add endpoints:
  - `GET /me/provider-draft` — returns current draft state (whatever has been saved so far), plus `onboardingStep`
  - `PATCH /me/provider-draft` — partial patch; merges with existing; updates `onboardingStep` if provided; debounced on client
  - `POST /me/provider-publish` — final validation, transitions draft to full Provider, creates ProviderCategory/Trade/Skill/ServiceZone rows, sets `onboardingCompleteAt`, returns the full ProviderDetailSchema
- Autosave on each field change (debounced 600ms) — no "save" button
- Explicit "back" button always allowed; "continuer" enabled only when required fields for the current step are filled
- Resume from wherever the user stopped (if `onboardingStep` exists, jump to that step on mount)

### Out of scope
- Photo upload to cloud storage (kept as placeholder for I08)
- Admin review of the draft
- Draft expiry (drafts live forever until publish or delete)
- Versioning / undo history

## Backend tasks

### Prisma migration

```prisma
model User {
  ...
  onboardingStep Int?   // null if not started or complete; 0-5 for steps 1-6 in UI
}

model Provider {
  ...
  onboardingCompleteAt DateTime?
}
```

Migration: `prisma migrate dev --name add-onboarding-persistence`.

### Draft storage

Two approaches:
1. **Denormalize into User/Provider** — populate fields partially; use `onboardingStep` as the "is still drafting" sentinel.
2. **Dedicated `ProviderDraft` JSON blob** — one row per user, holds `data` as JSON.

**Choice:** approach 1. It's simpler and the final publish already writes to Provider anyway. The draft IS the Provider row, incomplete. We just guard queries: pros with `onboardingCompleteAt = null` don't show up in search.

### Endpoints

```ts
// GET /me/provider-draft
// Returns User fields + Provider fields (if partial Provider exists) + ProviderCategory[], ProviderTrade[], Skill[], ServiceZone[]
// Plus the current step index and an isComplete flag.
// Also returned by GET /dashboard/provider as its `onboarding` block (I03) so the
// dashboard can render the progress banner without an extra call.

// PATCH /me/provider-draft
// Body: partial of the draft shape
//   - step 1 keys: firstName, lastName, phone, idFront, idBack
//   - step 2: primaryCategoryId, skills, yearsOfExperience, description
//   - step 3: serviceZones (array of { city, commune })
//   - step 4: hourlyRate, visitFee
//   - step 5: avatar, bio, languages
//   - also accepts: onboardingStep (0-5)
// Response: updated draft shape (full)

// POST /me/provider-publish
// Body: optional legal acceptance flags
// Server: validates all required fields present; creates Provider if not exists; fills all nested rows; sets onboardingCompleteAt; clears onboardingStep.
// Response: { provider: ProviderDetailType }
```

### Entry points — when users land on onboarding

1. **New pro from Auth (I02)** — freshly OTP-verified, tapped "Je suis un pro" on DoneStep. Lands on `/pro/onboarding` at step 1 with an empty draft.
2. **Returning incomplete pro from Dashboard banner (I03)** — the dashboard renders a "Complétez votre inscription · Étape N/6 · Continuer" banner whenever `Provider.onboardingCompleteAt` is null. Tapping continue opens the wizard at the saved `User.onboardingStep`.
3. **Returning incomplete pro via deep link** — visiting `/pro/onboarding` directly is always allowed, with step restored from `User.onboardingStep`.

The dashboard banner is **not dismissible** — partial pros don't receive requests, so nudging them is the right behavior. See I03 for banner spec.

### Validation

Each PATCH is idempotent and partial. No strict schema — accept any subset. Full validation runs on publish: if any required field is missing, return 400 with a list of missing fields so the UI can jump the user to the right step.

```ts
async publish(actor: Actor) {
  const draft = await this.getDraft(actor.id)
  const missing = this.validateForPublish(draft)
  if (missing.length > 0) throw new BadRequestException({ missing })

  return this.prisma.$transaction(async (tx) => {
    // ensure Provider row exists
    let provider = await tx.provider.findUnique({ where: { userId: actor.id } })
    if (!provider) {
      provider = await tx.provider.create({ data: { userId: actor.id, profession: draft.profession, ... } })
    } else {
      provider = await tx.provider.update({ where: { id: provider.id }, data: { ... } })
    }
    // clear + recreate ProviderCategory, ProviderTrade, Skill, ServiceZone rows from draft arrays
    ...
    await tx.provider.update({
      where: { id: provider.id },
      data: { onboardingCompleteAt: new Date() },
    })
    await tx.user.update({ where: { id: actor.id }, data: { onboardingStep: null } })
    return provider
  })
}
```

## Zod schemas

```ts
// Incremental draft — all fields optional
export const ProviderDraftDto = z.object({
  onboardingStep: z.number().int().min(0).max(5).optional(),

  // Step 1
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  idFrontUploaded: z.boolean().optional(),
  idBackUploaded: z.boolean().optional(),

  // Step 2
  primaryCategoryId: z.string().optional(),
  subcategoryIds: z.array(z.string()).optional(),
  skills: z.array(z.object({ name: z.string(), level: z.number().min(1).max(5).default(3) })).optional(),
  yearsOfExperience: z.number().int().min(0).max(60).optional(),
  description: z.string().optional(),

  // Step 3
  serviceZones: z.array(z.object({ city: z.string(), commune: z.string() })).optional(),
  zoneRadiusKm: z.number().min(1).max(50).optional(),

  // Step 4
  hourlyRate: z.number().int().positive().optional(),
  visitFee: z.number().int().nonnegative().optional(),

  // Step 5
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  languages: z.array(z.string()).optional(),
})

export const DraftResponseSchema = z.object({
  draft: ProviderDraftDto,
  step: z.number().int().min(0).max(5).nullable(),
  isComplete: z.boolean(),
  missingForPublish: z.array(z.string()).optional(),
})
```

## API client

```ts
export const onboardingApi = (client: ApiClient) => ({
  getDraft: () => client.get<DraftResponseType>("/me/provider-draft"),
  patchDraft: (data: ProviderDraftDtoType) => client.patch<DraftResponseType>("/me/provider-draft", data),
  publish: () => client.post<{ provider: ProviderDetailType }>("/me/provider-publish"),
})

queryKeys.onboarding = { draft: ["onboarding", "draft"] }
```

## Frontend wiring

Web: `apps/web/src/app/pro/onboarding/page.tsx`

```tsx
const { data } = useQuery({
  queryKey: queryKeys.onboarding.draft,
  queryFn: () => onboardingApi(apiClient).getDraft(),
})

const patchMut = useMutation({
  mutationFn: (patch: ProviderDraftDtoType) => onboardingApi(apiClient).patchDraft(patch),
})

const debouncedPatch = useDebouncedCallback((patch) => patchMut.mutate(patch), 600)

// On field change:
const handleChange = (key, value) => {
  setLocalDraft({ ...localDraft, [key]: value })
  debouncedPatch({ [key]: value })
}

// On "Continuer":
const goToNext = () => {
  patchMut.mutate({ onboardingStep: step + 1 })     // cancels the debounce
  setStep(step + 1)
}

// On "Publier":
const publishMut = useMutation({
  mutationFn: () => onboardingApi(apiClient).publish(),
  onSuccess: () => router.replace("/pro"),
  onError: (err) => {
    if (err.status === 400 && err.body.missing) {
      // Jump user to first step containing a missing field
      const firstStep = findStepForField(err.body.missing[0])
      setStep(firstStep)
      toast.warning(`Il manque : ${err.body.missing.join(", ")}`)
    }
  },
})
```

Hydrate local state from `data.draft` on mount; if `data.step` is set, jump to that step.

Mobile: same pattern. LocalStorage/AsyncStorage becomes a **cache** for optimistic rendering while the backend is source of truth.

## Fixtures to delete

- `INITIAL_DATA` (web + mobile)
- Local-only draft state management utilities (if any persist separately)

## Dependencies
- None strict. Can parallel with I04/I05/I06.
- Blocks I08 (verification documents build on the Provider row existing post-publish)
- Blocks I10

## Acceptance criteria

1. Typing in a field on step 2 → a PATCH fires 600ms later
2. Closing the browser and reopening `/pro/onboarding` → the user resumes at the same step with the same data
3. Another device with the same account logs in → sees the same draft
4. "Publier" with missing fields returns a clear error and jumps the user to the right step
5. Successful publish creates a full Provider record visible in search
6. `onboardingCompleteAt` is set; `onboardingStep` is cleared

## QA checklist
- [ ] `grep -r "INITIAL_DATA" apps/` returns nothing (except schemas)
- [ ] A PATCH request fires after 600ms of inactivity, not sooner
- [ ] Rapid typing debounces to 1 PATCH per pause
- [ ] Publish with empty required field returns 400 with `missing` array
- [ ] Publish with all fields valid → Provider row created with all nested rows
- [ ] Publish clears `onboardingStep` and sets `onboardingCompleteAt`
- [ ] After publish, `GET /me.role` returns "PROVIDER" and search finds the pro
- [ ] Photo field submission (avatar URL string) is stored; actual upload is TODO and tracked in I08
- [ ] Localstorage/AsyncStorage still used as optimistic cache (renders instantly on mount) but server is source of truth on reconciliation
- [ ] Draft DRAFT payload is always small (partial); responses are the merged full draft
- [ ] Logout mid-draft → the draft persists in DB; logging back in resumes

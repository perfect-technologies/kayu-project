# Settings — Provider Data Editing

Date: 2026-05-16
Status: Approved (pending spec review)
Surface: `apps/web/src/app/dashboard/settings/page.tsx`

## Problem

`/dashboard/settings` has a complete section/IA (sidebar + role-aware sections),
but several provider sections are display-only stubs ("Édition à venir" /
`ComingLaterChip`) — providers cannot actually update their data from settings.
Two sections are already wired (`Profil` via `identityApi.completeProfile`;
provider `Visibilité` via `settingsApi`). The gap is the **provider data
sections**, and those are exactly the ones with existing backend support.

## Scope (locked with stakeholder)

Wire **only the provider data sections that existing endpoints already
support** — no new backend:

1. **Services & tarifs** — full: profession, prix de départ, expérience,
   catégories, sous-catégories, compétences.
2. **Profil pro → "Présentation publique"** — bio + langues (replaces the
   current "arrive plus tard" message card).
3. **Zones d'intervention** — communes desservies.
4. **Disponibilités** — the `isAvailable` toggle only.

**Explicitly out of scope** (need new backend that does not exist; stay as
deferred `ComingLaterChip` stubs): Notifications preference persistence, client
Confidentialité toggles, the weekly availability calendar (`AvailabilitySchedule`
has no provider write endpoint), account pause/delete, sessions, GDPR export.
**Intentionally informational** (nothing to wire by design): Language (FR-only
launch), Payment (cash MVP), Support, Sécurité. These are untouched.

## Approach

- **Read** current values via `onboardingApi.getDraft()` (post-publish,
  `buildDraftDto` returns the live Provider's profession/description/experience/
  hourlyRate/categoryIds/subcategoryIds/skills/serviceZones/languages — the
  exact field set, already mapped) plus `categoriesApi.getAll({
  withSubcategories: true })` for category/subcategory option lists. The
  `Disponibilités` toggle reads current `isAvailable` from the cached
  `queryKeys.dashboard.provider` (`dashboardApi.getProviderDashboard()`).
- **Write** via `providersApi.updateMe(...)` (partial update — each section
  sends only its own fields) and `providersApi.updateAvailability({ isAvailable })`
  for the toggle. No new endpoints, no new query keys.
- Alternatives rejected: `providersApi.getById(id)` (needs provider id, shape
  mismatch with the update DTO) and the dashboard `provider` partial
  (incomplete — no reliable skills/zones).

## Components & patterns

Replace four stub components in `apps/web/src/app/dashboard/settings/page.tsx`:
`ServicesSection`, `ZonesSection`, `AvailabilitySection`, and the provider
"Présentation publique" card inside `ProfileSection`. Keep the page's existing
primitives (`SettingsHeader`, `CardSection`, `CardTitle`, `FieldRow`,
`TextField`, `Toggle`) and the `ProfileSection` save pattern (`useMutation` +
`useToast` + a per-section "Enregistrer" button). Match the settings page's
own design language (Tailwind utility classes + `var(--k-*)` tokens), NOT the
onboarding inline-token style. Reuse the onboarding `CITIES` constant and the
"Tout sélectionner" commune pattern, and `YEARS_OPTIONS` + the year-bucket↔number
mapping (extract a small shared helper if cleaner than duplicating).

## Field partitioning (no field written by two sections)

| Section | Fields written (via `updateMe` unless noted) |
|---|---|
| Services & tarifs | `profession`, `hourlyRate`, `experience` (from `YEARS_OPTIONS` bucket → number), `categoryIds` (≤3), `subcategoryIds` (≤3, filtered to chosen categories), `skills` |
| Profil pro → Présentation publique | `description` (≤1000), `languages` |
| Zones d'intervention | `serviceZones` (Kinshasa communes; guard ≥1) |
| Disponibilités | `isAvailable` — via `updateAvailability` |

`description` lives only in Présentation publique; no other section writes it.
Categories/skills use real backend IDs from `getDraft()`/`categoriesApi`
(no fuzzy slug resolver needed).

## Data flow, errors, testing

- Per section: `useQuery(queryKeys.onboarding.draft)` (+ `queryKeys.categories.all`
  where needed; `queryKeys.dashboard.provider` for the availability toggle) to
  prefill local edit state → "Enregistrer" → mutation → on success invalidate
  `queryKeys.onboarding.draft`, `queryKeys.dashboard.provider`, and
  `queryKeys.providers.strength` (so dashboard + the Renforce ton profil module
  reflect changes) → success toast; on error → destructive toast (same as
  `ProfileSection`).
- UI constraints to avoid backend 400s: cap `categoryIds`/`subcategoryIds` at 3
  (matches `UpdateProviderDto`), enforce `profession` ≥ 2 chars and
  `hourlyRate` ≥ 0 before enabling save, block saving zero `serviceZones` with
  an inline hint.
- **Testing:** backend is unchanged (no new endpoints) — nothing added to
  `node:test`. `apps/web` has no test harness by project design — verification
  is `pnpm --filter @kayu/web type-check` (must be 0 errors) plus a manual
  desktop+mobile smoke checklist (edit each section, save, reload, confirm
  persistence and that the dashboard/strength reflect changes).

## Success criteria

- A logged-in provider can edit and persist profession, prix, expérience,
  catégories, sous-catégories, compétences, bio, langues, communes, and the
  availability toggle entirely from `/dashboard/settings`.
- Values prefill from current data and survive reload; dashboard + strength
  module reflect saved changes.
- No new backend; no new query keys; existing settings design language and
  primitives reused; web type-check green; the out-of-scope/informational
  sections are left exactly as they are.

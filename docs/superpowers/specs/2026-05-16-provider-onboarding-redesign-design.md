# Provider Onboarding Redesign — Design

Date: 2026-05-16
Status: Approved (pending spec review)
Surface: `apps/web/src/app/pro/onboarding/` + supporting backend

## Problem

The provider onboarding is the only major surface untouched by the redesign. It
works but is weak in ways that directly undermine provider acquisition and
profile quality:

- **The three things a provider most needs to sell themselves do not work.**
  Profile photo, portfolio, and ID upload are all "coming soon" placeholders.
  Onboarding collects **zero** portfolio, even though the backend already models
  `PortfolioProject` / `PortfolioImage` / `Certification` / `VerificationDoc`.
- **It asks for data the backend ignores.** `travelMode`, `payment`,
  `zoneRadiusKm`, `visitFee` are collected and discarded.
- **Bio is collected twice** (step 2 and step 5) into the same field. Step 5
  ("Profil") is otherwise nearly empty (photo + portfolio stubbed).
- **It asks instead of helping.** Free-text job title, coarse experience bands,
  pick-only skills, no scaffolding, no profile-strength feedback, no payoff.
- **It breaks the design direction.** Gradient page background, gradient avatar,
  gradient cards; built from raw `k-input` / `k-btn` inline styles instead of
  `@kayu/ui` primitives. Mobile is a shrunk desktop, not mobile-first.

## Goals

1. Lowest-friction path for a provider to **go live**.
2. Then actively **help them build the strongest possible profile and
   portfolio** — guiding, pre-filling, never facing a blank form.
3. Beautiful, mobile-first UI fully conformant with the Kayou design direction
   and built from `@kayu/ui`.
4. Stop collecting dead data; wire up the data that matters for real.

## Foundational decisions (locked with stakeholder)

1. **Real uploads now** via **Supabase Storage** (Supabase is already the auth
   provider; service key configured). Photo, portfolio images, and ID/KYC docs
   become real working features.
2. **Two phases: go live fast, then guided strength-building.** Maps exactly to
   the backend's existing publish-with-minimum + enrich-later model.
3. **Smart scaffolding, no AI** (v1). Derive title/skills/languages/price
   guidance from the chosen trade + city; tap-to-build bio and portfolio
   descriptions; example-led empty states.
4. **Geography: Kinshasa only for launch** (keep existing 24-commune list),
   structured so other cities / Congo-Brazzaville can be added later. Phone
   stays `+243` for now (`+242` later).

## Structure — "Go Live, then Stand Out"

### Phase 1 — the wizard (≈3 minutes, then searchable)

Three tap-driven steps + publish. Identity is pre-filled from the signed-in
user. The provider **confirms and taps; they do not compose.**

**Step 1 — Toi & ton métier**
- Identity: first name, last name, phone shown as a **confirm/edit row**
  pre-filled from the user record (not blank inputs). Phone `+243`.
- Métier: tap the trade (category). On selection, **suggest professional
  titles** as chips (e.g. Plomberie → "Plombier", "Plombier-chauffagiste",
  "Plombier sanitaire", "Autre…"). No blank "intitulé" field.
- Expérience: tap a band (`< 1` / `1–3` / `4–7` / `8+` ans).
- Compétences (optional): category-derived chips, tap to add, custom allowed.
- Auto-derived defaults: title options, skill suggestions, default languages
  (Français + Lingala for Kinshasa), editable later from the profile.

**Step 2 — Où tu interviens**
- Kinshasa → its communes as chips (existing list). Multi-commune.
- Radius slider **removed**.

**Step 3 — Ton prix de départ**
- "À partir de" price: presets + free number. Guidance band is a **static,
  curated per-category starting-price range** (not live market analytics;
  replaces today's single static Kinshasa figure). Travel mode & payment
  **removed**.

**Publish**
- A real, on-brand preview of the public profile card (initials on warm beige
  — **no gradient avatar**), terms checkbox, Publish.
- On success → land on the pro dashboard where Phase 2 is waiting.

`validateForPublish()` required set is **unchanged** (firstName, lastName,
phone, profession, primary category, yearsOfExperience, service zone,
hourlyRate) — all collected in Phase 1, so publish-with-minimum still holds.

### Phase 2 — Profile Strength (on the pro dashboard)

A **"Renforce ton profil"** module on the redesigned pro dashboard. Not a
separate wizard. Sits at the top right after publishing, then settles into the
existing *à-faire* strip as tasks complete, and collapses to a small
"Profil remarquable ✓" badge once complete.

- **Tiers, not a fabricated metric:** `Profil de base → Profil solide → Profil
  remarquable`. The bar reflects only work actually done.
- **Tasks:** Ajoute ta photo · **Construis ton portfolio** · Fais-toi vérifier ·
  Soigne ta présentation (bio). Each opens a focused one-thing-per-screen
  editor (same calm rhythm as Phase 1, reused on mobile).
- **Honest benefit framing — deliberately no invented stats.** No "+37% de
  demandes". Each task states the real reason (visibility, trust, ranking,
  Vérifié badge). Consistent with the design system's plain-text /
  no-fake-numbers rule; preserves provider trust.
- **Live profile preview alongside**, filling in as tasks complete: initials →
  photo, portfolio thumbnails appear, Vérifié badge lights up.

### Portfolio builder (centerpiece)

A provider never faces a blank form. They add a **chantier** (job),
photo-first; we scaffold the rest.

- **Example-led empty state.** Not "Aucun projet" — a real example chantier for
  *their* trade (avant/après photos, a tight 2-line description, durée):
  "Voilà à quoi ressemble un bon chantier. Ajoute le tien." Sets the bar.
- **Photo-first.** Avant (required) / Pendant (optional) / Après (recommended)
  slots, mobile camera capture. Inline quality coaching (lumière, cadrage,
  pas de flou).
- **Description by tapping, not writing.** Quoi? / Où? / Résultat? prompts with
  tappable phrases assembled into a clean, editable description.
- **Optional** durée and prix réalisé (tap bands, skippable).
- **Concrete target:** "3 chantiers avec photos avant/après → Profil
  remarquable."
- Maps 1:1 to `PortfolioProject` + `PortfolioImage` (BEFORE/DURING/AFTER).
  Reorder, set *chantier vedette*, hide/show.
- `bookingId` proof-of-work: when a chantier links to a completed booking, a
  **"Travail vérifié"** badge auto-appears (no extra work for the provider;
  empty during onboarding, surfaces post-jobs).

## Visual & UX system

- **Zero gradients.** Flat Sand background, white cards, soft two-layer shadow
  (`shadow.e2`). Remove today's page-background gradient, gradient avatar disc,
  and gradient publish card.
- **Avatar fallback** = initials in mono on `#F5F2E9`, never a gradient disc.
- **Lucide icons only**, one primary blue action per screen, plain-text counts.
- **Built from `@kayu/ui`**: Button, Input, Chip, StepIndicator, InlineAlert,
  Avatar. No `k-input` / `k-btn` inline-style soup.
- **"Confirm, don't compose"** as a visible pattern (pre-filled identity row;
  métier/title/skills are taps).
- **Mobile is first-class:** compact dot stepper, single column, full-width
  sticky primary at thumb height, 44px tap targets. Not a shrunk desktop.
- **Kept:** the existing debounced draft autosave + resume; it works well.

## Data & backend changes

**Remove (backend ignores it today):**
- `zoneRadiusKm`, `visitFee` — drop from draft overflow.
- `travelMode`, `payment` — frontend-only, delete (`types.ts`).
- Duplicate `bio` overflow → collapse to single `description` (one source).
- `idFrontUploaded` / `idBackUploaded` flags → replaced by real verification
  upload.
- Trim `ProviderDraftDto` accordingly; update its Zod spec + service spec.

**Add (wire onto existing models):**
- **Supabase Storage** buckets: `avatars` (public-read), `portfolio`
  (public-read), `verification-docs` (private). Backend issues **signed upload
  URLs**; client uploads directly (no large files through NestJS).
- Provider portfolio CRUD endpoints → `PortfolioProject` + `PortfolioImage`
  (models exist; endpoints to add).
- Avatar set endpoint → `User.avatar`.
- Verification doc upload → existing `VerificationDoc` + existing admin review
  flow → flips `verificationStatus` → Vérifié badge.

**Step state & publish:**
- `onboardingStep` `0–5` → `0–2` (3 steps). `validateForPublish()` required
  set untouched. `DraftResponse` + autosave/resume kept; step mapping updated.

**Profile Strength:**
- Pure derived function over the provider record (has avatar? · #portfolio ·
  has description? · verified? · depth). Computed backend-side as one source
  (dashboard + potential future ranking). No new DB column (derive on read;
  cache later if needed). Fixed tier thresholds.

**Geography:**
- Keep Kinshasa + 24 communes. Move the list to a structured shape that makes
  adding cities / Congo-Brazzaville a data change, not a code change. No
  multi-city UI work for v1.

**Testing:** Backend service logic via `node:test` + hand-rolled Prisma fakes
per repo convention (trimmed draft DTO, new step state, portfolio CRUD,
verification doc, Profile Strength computation).

## Out of scope (YAGNI for v1)

- AI-assisted bio/title/skill generation (revisit post-launch).
- Congo-Brazzaville cities and `+242` phone.
- Multi-city commune curation.
- A standalone "Profile Studio" page (folded into the dashboard module).
- React Native / Expo app (web responsive only for now).
- Image thumbnail pipeline (`sharp` not a dependency) — rely on Supabase image
  transforms or store originals; revisit if needed.
- Availability scheduling in onboarding (post-publish, existing surface).

## Success criteria

- A provider can go from signup to a live, searchable profile in ~3 minutes,
  mostly by tapping.
- Photo, portfolio, and ID verification are real, working uploads.
- The pro dashboard shows a Profile Strength module that guides enrichment with
  honest framing and a live preview.
- No dead data is collected. No gradients. Built from `@kayu/ui`. Mobile-first.
- Backend service logic covered by specs per repo convention.

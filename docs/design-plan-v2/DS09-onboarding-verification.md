# DS09 — Provider Onboarding + Verification

## Goal

Ship two linked pro screens that gate the pro role:
- `ProviderOnboarding` — 6-step wizard (Identité → Métier → Zones → Tarifs → Profil → Publier) that new pros complete after Auth's "Je suis un pro" selection
- `ProVerification` — the ongoing verification/KYC view with 5 states (not_started / in_progress / in_review / verified / rejected), a document upload wizard, and a dispute view for pros who are party to a litige

## Why it matters

Trust is the marketplace's foundation. KAYOU pros go from "untrusted unknown" to "De confiance/Expert" through these flows. Without them, the role is ungated and the trust signals on provider profiles are meaningless.

## Scope

### In scope
- `ProviderOnboarding` screen: 6-step wizard with per-step screens (identity, craft, zones, pricing, profile, publish), `StepIndicator`, per-step validators, "continue/back" sticky bar, summary/publish step with preview
- `ProVerification` screen with 3 modes:
  - `VerifyStatus` (default): status card with current state's tint/icon/title/sub/CTA + progress percent + benefits list
  - `VerifyWizard` (document upload): ID front/back → selfie → address proof → optional cert
  - `DisputeView`: active dispute detail with timeline, both sides' statements, evidence carousel, response composer
- Routes: `/pro/onboarding`, `/pro/verify`; mobile screens with same names
- `StepIndicator` primitive promoted to `@kayu/ui` (used also by `WriteReview` in DS05 but locally there — consolidate in DS09)

### Out of scope
- Backend KYC provider integration (Smile Identity, Veriff, manual review) — deferred
- Real camera access for the document photos — placeholder file input
- Geolocation for zone selection — placeholder city+commune multi-select
- Tax / business registration fields (SIRET-equivalent) — if needed, DS09.5 follow-up

## Reference files
- `prototype/components/ProviderOnboarding.jsx` — 628 lines; `ONBOARDING_STEPS`, `CITIES`, `StepIndicator`, `FieldLabel`, `StepIdentity` (only the first step is fully shown; read the file for all 6)
- `prototype/components/ProVerification.jsx` — 869 lines; `VERIFY_STEPS`, `VERIFY_BENEFITS`, `PRO_DISPUTE`, `VerifyStatus`, `VerifyWizard`, `DisputeView`

## Provider Onboarding

### StepIndicator

Horizontal track, 6 step circles + 5 connector lines:
- Past step: success bg + white check + success connector
- Current step: primary bg + primary-subtle ring glow + icon
- Future step: surface bg + Slate-subtle icon + Slate-border connector
- Web: shows step labels under circles; mobile: circles only

Exported from `@kayu/ui` and parameterized by `steps[]` + `step` index. Reused in WriteReview (rename DS05 usage to import from `@kayu/ui`).

### Step 1 — Identité

- Identity assurance Sky-subtle info card at top (why we verify, badge payoff)
- Form fields:
  - Prénom (k-input)
  - Nom (k-input)
  - Numéro de téléphone (fixed `+243` prefix + input)
  - Pièce d'identité: 2-tile upload grid (Recto / Verso); border goes from dashed to success when set
- Validates: firstName + lastName + phone (9 digits) + both ID sides uploaded
- Note: phone may be pre-filled from the Auth flow — if already in user record, show read-only with "modifier" ghost link

### Step 2 — Métier

- Primary category picker (grid of 9 category tiles from `CATEGORIES`, shared.jsx)
- Sub-specialties: chip cloud of skills filtered by category (e.g. Plomberie → Fuites, Chauffe-eau, Installations, Débouchage, Canalisations)
- Years of experience: slider (0-30 years) or stepper
- "Décrivez brièvement votre savoir-faire" textarea (optional but encouraged)

### Step 3 — Zones

- City multi-select (cards with `CITIES` data): Kinshasa, Lubumbashi, Brazzaville, Pointe-Noire
- Per selected city: commune chip picker (multi-select)
- Radius slider: "Zone d'intervention" 1-20 km from each selected commune
- Preview: small map with filled zones (decorative SVG placeholder)

### Step 4 — Tarifs

- Tarif horaire: FC input with common presets (5 000 / 8 000 / 12 000 / 15 000 / custom)
- Frais de déplacement: FC input (can be 0)
- Tarifs spécifiques per service type (optional table)
- Note: hint explains how the final total is computed

### Step 5 — Profil

- Photo upload (avatar) with drag-and-drop zone
- "À propos de moi" textarea (500 char limit, counter)
- Languages spoken (chip picker: Français / Lingala / Swahili / Kikongo / Tshiluba / Anglais)

### Step 6 — Publier

- Preview of the public profile in a card (pulls from previous steps)
- Legal: "En publiant, je confirme que les informations sont exactes et j'accepte les conditions de KAYOU"
- Primary CTA "Publier mon profil" — submits to backend + routes to `provider` dashboard
- Secondary CTA "Enregistrer comme brouillon" — saves state, returns to dashboard with onboarding banner

### Sticky bottom bar

- Shown on every step except Step 6 (which has its own CTAs)
- Left: "← Étape précédente" ghost link (hidden on Step 1)
- Right: "Continuer →" primary button, disabled if step not valid

### Auto-save

Each step's fields save optimistically to local storage + backend `PATCH /me/provider-draft`. Resuming returns to the last incomplete step.

## Provider Verification

### VerifyStatus — 5 state configs

Each state has: `tint` (accent color), `tintBg`, `icon`, `title`, `sub`, `cta` (nullable), `progress` (0-100).

States:
- `not_started` (amber): "Vérifiez votre compte" / "Obtenez le badge «De confiance» …" / CTA "Commencer la vérification" / progress 0
- `in_progress` (sky): "Continuez où vous en étiez" / "Il vous reste 2 documents …" / CTA "Reprendre" / progress 50
- `in_review` (violet): "Dossier en cours d'examen" / "Notre équipe vérifie …" / no CTA / progress 75
- `verified` (emerald): "Vous êtes vérifié !" / "Votre profil affiche le badge …" / CTA "Voir mon profil" / progress 100
- `rejected` (danger-rose): "Vérification refusée" / "Un de vos documents n'est pas lisible …" / CTA "Renvoyer les documents" / progress 0

### Layout

Card-level:
- Big colored icon circle (80px, state-tinted)
- Title + sub
- Progress bar (thin, state-tinted) if progress > 0
- Primary CTA if present
- Below: "Avantages de la vérification" section with 4 benefit rows (VERIFY_BENEFITS) — each is an icon + label + desc

If state === "verified", swap the benefits section for a "Tips for more missions" or similar — the payoff has already been unlocked.

Debug dropdown (`?debug=1`): allows toggling between states to preview each without backend changes.

### VerifyWizard

4-step upload wizard:
1. Identité (ID card / passport): capture front + back (camera or file upload)
2. Selfie: selfie with ID visible (camera only)
3. Adresse: utility bill (EDC/Regideso) or bank statement
4. Certificat métier (optional): trade diploma, insurance cert, any relevant doc

Each step uses the same `StepIndicator` + per-step card layout. Capture UI:
- Large dashed-border drop zone (camera icon + "Prendre une photo" or "Téléverser un fichier")
- Thumbnail preview after capture
- Retry link
- Guidance caption ("Bien cadré, lisible, pas flouté")

After step 4 submits → `VerifyStatus` with state `in_review`.

### DisputeView

Shown when `flow === "dispute"` — accessed from `ProVerification` when the pro has a pending dispute to respond to (from `PRO_DISPUTE` mock).

Content:
- Hero banner: Rose-subtle bg, "Litige B-2847 · Client: Marie K." + deadline "Il vous reste 22h pour répondre"
- Service + amount summary
- Side-by-side (or stacked on mobile) statements:
  - Côté client: full statement text, evidence count, photos thumb grid
  - Côté pro: (empty initially) → composer with textarea + evidence upload
- Timeline of the dispute (opened / pro notified / pending response / escalated if applicable)
- Submit "Envoyer ma réponse" primary CTA

Admin also views this (DS10) but with resolution actions (side with client / side with pro / investigating / refund %). DS09 is pro-side only.

## Routing

- `/pro/onboarding` (web), `ProviderOnboardingScreen` (mobile): tab bar hidden per DS01
- `/pro/verify` (web), `ProVerificationScreen` (mobile): tab bar visible

Auto-redirects:
- After Auth with role=PROVIDER and no onboarding → `/pro/onboarding`
- After onboarding publish → `/pro` (dashboard)
- A pro dashboard header card prompts "Complétez votre vérification" linking to `/pro/verify` until state=verified

## Dependencies
- Depends on DS01, DS02 (Auth flow lands here)
- Blocks: DS11 audit

## Acceptance criteria

1. Web `/pro/onboarding` renders the 6-step wizard with step indicator
2. Each step validates before "Continuer" enables
3. Back button on non-first steps decrements; back on step 1 exits (confirmation prompt for draft-save)
4. Publishing (step 6) navigates to `/pro`
5. Web `/pro/verify` renders the status screen for the current pro state
6. Debug toggle allows previewing all 5 states without backend
7. "Commencer la vérification" / "Reprendre" opens the VerifyWizard
8. VerifyWizard completion returns to status with `in_review`
9. Pros with a pending dispute see a dispute-view card above the status
10. DisputeView renders both sides + response composer; submitting returns to status

## QA checklist
- [ ] StepIndicator exported from `@kayu/ui` (single source of truth); DS05 WriteReview import updated
- [ ] Identity step phone field validates 9 digits (reuses DS02 helper if available)
- [ ] ID upload tiles switch from dashed-border Slate to solid-border success when populated
- [ ] Step 3 zone radius slider clamps [1, 20]
- [ ] Step 4 tarif horaire presets update the input field
- [ ] Step 6 preview pulls data from the wizard state (not hardcoded)
- [ ] Publish CTA disables while submitting, shows spinner-less shimmer on label (no spinner)
- [ ] `ProVerification` status card uses dynamic tint based on state config
- [ ] Benefits list shows 4 VERIFY_BENEFITS rows with correct icon + label + desc
- [ ] Debug dropdown is gated behind `?debug=1` query param and doesn't render in prod builds
- [ ] DisputeView deadline renders count-down (prototype-static OK for this chunk)
- [ ] Response composer requires at least 20 chars before enabling submit
- [ ] Pro-side dispute: no resolution actions (those are admin-only in DS10)
- [ ] Mobile wizard sticky bottom bar doesn't overlap the tab bar (hidden per DS01 on `onboarding`)

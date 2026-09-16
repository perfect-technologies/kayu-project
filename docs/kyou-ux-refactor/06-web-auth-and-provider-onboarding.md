# 06 - Web Auth and Provider Onboarding

## Objective

Rebuild the entry screens (welcome carousel, login, register) on the K-YOU auth canvas while keeping Supabase phone OTP underneath, and rebuild provider onboarding as the K-YOU four-step wizard that publishes in one request. The same step components power the profile editor and the restyled KYC verification screen.

## Severity

P0. Nobody reaches the signed-in product without these screens; providers cannot exist without the wizard.

## Owns

- `apps/web/src/app/bienvenue/**`
- `apps/web/src/app/login/**`, `apps/web/src/app/register/**`
- `apps/web/src/app/prestataire/nouveau/**`
- `apps/web/src/app/prestataire/[id]/modifier/**`
- `apps/web/src/app/verification/**`
- `apps/web/src/components/auth/**` (except `LoginWall`, owned by 05)
- `apps/web/src/components/onboarding/**`, `apps/web/src/components/schedule/**`, `apps/web/src/components/media/VideoEditor.tsx`, `apps/web/src/components/media/PhotoDropzone.tsx`
- `apps/web/src/contexts/AuthContext.tsx` (post-auth routing only)
- `apps/web/src/lib/auth-return-to.ts`, `apps/web/src/lib/onboarding-draft.ts`
- `apps/web/src/copy/auth.ts`, `onboarding.ts`, `verification.ts`

## In scope

- Four public/auth routes and three provider routes below.
- Redirects in `next.config.ts`: `/auth` → `/login` (query preserved, `mode=signup` → `/register`), `/pro/onboarding` → `/prestataire/nouveau`, `/pro/profile/:path*` → `/prestataire/me/modifier` (the page resolves `me` to the viewer's provider id), `/pro/verify` → `/verification`.
- Deletion of `AuthFlow.tsx`, its `BrandSide` gradient panel and split layout, `/auth`, `/pro/onboarding`, `/pro/profile/*`, `/pro/verify` and the verification debug fixtures.

## Out of scope

- The auth canvas CSS, `AuthCard`, `PrimaryAction`, `Field` primitives (04).
- `ReferenceFields`, `AddressAutocomplete`, `PhoneField` (05 and 04); this workstream consumes them.
- Backend validation of the publish payload (02).
- Email/password, magic links, social login. Phone OTP only.

## Auth model recap

Supabase `signInWithOtp({ phone })` then `verifyOtp({ phone, token, type: 'sms' })`. The backend provisions the local `User` on the first `GET /me`. Role is `CLIENT` by default and becomes `PROVIDER` only through `POST /me/provider`. There is no `PATCH /me/role` call from the web anymore; the register screen's account-type choice is a **routing hint** stored in `sessionStorage` (`kayou.signupIntent = 'client' | 'provider'`) that decides where the user lands after OTP. The demo-accounts panel (`signInWithPassword`) survives, dev-only, as a collapsible block under the form.

---

## `/bienvenue` — Welcome carousel

Reference: `screenshots/ui-refresh/bienvenue.png`.

**Files**: `apps/web/src/app/bienvenue/page.tsx` (server, metadata), `apps/web/src/app/bienvenue/WelcomeClient.tsx`, `apps/web/src/components/auth/WelcomeSlide.tsx`.

**Audience**: public. Rendered outside `Layout` (route group `(bare)` from 04).

**When it appears**: on the first visit only, on viewports under 640 px, and only from `/`. `apps/web/src/app/page.tsx` stays a server component; a tiny client `WelcomeGate` mounted in the home page checks `localStorage.kayou_onboarded` and `matchMedia('(max-width: 639px)')` and calls `router.replace('/bienvenue')` when both conditions hold. Justification: K-YOU never wired the redirect, but its carousel copy and the store-style slides only make sense as a first-launch experience on a phone; on desktop the hero already explains the product, and forcing a four-slide interstitial on every desktop first visit would cost acquisition traffic. The gate never fires for a signed-in session or when a `returnTo` query is present.

**Layout, mobile 390 px**: top bar with `Logo` left and "Passer" text button right; centred slide area with a 240 px square illustration (layered `-inset-2` gradient blur, `bg-accent/10` plate, `rounded-[2rem]` image with `shadow-soft`), left-aligned H1 `text-2xl font-extrabold`, paragraph; bottom: progress dot row (active dot is a 28 px primary pill, inactive 8 px `bg-primary/20`), full-width gold pill "Continuer" / "Commencer" on the last slide, underlined "J'ai déjà un compte" link → `/login`.

**Desktop 1440 px**: same layout inside a centred 480 px column on the auth canvas; the illustration grows to 320 px.

**Slides** (copy in `copy/auth.ts`): "Les services dont vous avez besoin…" / "Réservez en quelques gestes." / "Des pros vérifiés, à votre porte." / "Votre avis compte." Illustrations are four static images in `apps/web/public/welcome/`.

**Interactions and motion**: `AnimatePresence` slide x ±28 over 0.32 s; swipe left/right on touch (pointer events, 40 px threshold); keyboard arrows. Finishing or skipping sets `localStorage.kayou_onboarded = '1'` and navigates to `/` (signed in) or `/login`.

---

## `/login`

Reference: `screenshots/ui-refresh/login.png`, `screenshots/login-desktop.png`.

**Files**: `apps/web/src/app/login/page.tsx` (server, metadata, reads `searchParams.returnTo`), `apps/web/src/app/login/LoginClient.tsx`, shared step components in `apps/web/src/components/auth/`: `PhoneStep.tsx`, `OtpStep.tsx`, `CountrySelect.tsx`, `NameStep.tsx`, `TermsStep.tsx`, `DemoAccountsPanel.tsx` (dev-only), `AuthStepDots.tsx`.

**Audience**: public. Signed-in visitors are redirected to their home (`/mon-espace`, `/mes-reservations` or `/admin`) by a client effect.

**Layout, mobile 390 px**: `main.auth-canvas` (gold + mint radial gradient on `#F8F8F3`, the card loses border, shadow and background); centred logo with wordmark (60 px mark, 34 px text); H1 "Bienvenue sur KAYOU" 28 px; subtitle; then the current step:

- `PhoneStep`: `CountrySelect` pill (+243 RD Congo / +242 Congo-Brazzaville with format hint) + phone `Field` with a leading `Phone` icon; inline `role="alert"` red error box; full-width `PrimaryAction` "Recevoir le code" (54 px, 30 px radius) with an inline spinner while sending.
- `OtpStep`: six-digit input group (auto-advance, paste support), "Renvoyer le code" text button with a 32 s countdown, "Modifier le numéro" link back, `PrimaryAction` "Se connecter".
- `NameStep` (only when the provisioned user has no first name): Prénom, Nom, `LocationFields` limited to country › city, `PrimaryAction` "Continuer" → `PATCH /me/profile`.
- `TermsStep` (only when `termsAcceptedAt` is null): checkbox linking `/cgu` and `/confidentialite`, `PrimaryAction` "Accepter et continuer" → `POST /me/accept-terms`.

Footer line "Nouveau ici ? Créer un compte" → `/register?returnTo=…`. `DemoAccountsPanel` renders below the card only when `NODE_ENV !== 'production'`.

**Desktop 1440 px**: white `AuthCard` 480 px, `rounded-[30px]`, `shadow 0 24px 90px -50px rgba(10,61,54,.31)`, canvas with the mint and cream radial gradients on `#F8FAF7`.

**Data**: `supabase.auth.signInWithOtp`, `supabase.auth.verifyOtp`, then `identityApi.me()` → `GET /me`. Errors map to French copy: invalid phone, wrong code, expired code, rate limited.

**Post-auth routing matrix** (implemented once in `apps/web/src/lib/auth-return-to.ts` and called from both screens):

| Condition | Destination |
| --- | --- |
| `role === 'ADMIN'` | `/admin` |
| `returnTo` present and safe (`/`-prefixed, not `//`, not `/login`/`/register`) | `returnTo` |
| `signupIntent === 'provider'` and `provider === null` | `/prestataire/nouveau` |
| `role === 'PROVIDER'` | `/mon-espace` |
| otherwise | `/rechercher` |

**Motion**: card fades and rises 20 px on mount; steps swap with `AnimatePresence mode="wait"` x ±24, 0.28 s; the OTP boxes shake 200 ms on a wrong code (disabled under reduced motion).

---

## `/register`

Reference: K-YOU `src/pages/Register.jsx` and `screenshots/ui-refresh/login.png` for the canvas.

**Files**: `apps/web/src/app/register/page.tsx`, `apps/web/src/app/register/RegisterClient.tsx`. Reuses every step component from `/login`.

**Layout, mobile 390 px**: same canvas; logo; `.eyebrow` "LES BELLES RENCONTRES COMMENCENT ICI"; H1 "Faites le premier pas."; subtitle; a two-up `AccountTypeSelector` (Je cherche un service / Je propose mes talents — `rounded-2xl` bordered buttons with an icon, selected = `border-primary bg-primary/5 text-primary`); then `PhoneStep` → `OtpStep` → `NameStep` (always shown on register) → `TermsStep` (always shown). Footer "Déjà membre ? Se connecter".

**Behaviour**: the selector writes `sessionStorage.kayou.signupIntent`. Supabase treats an existing phone as a login, so after OTP the screen checks `GET /me`: an existing user with a name and accepted terms is routed by the matrix above without seeing the name and terms steps. The intent is cleared once consumed.

**Desktop**: identical to `/login`.

---

## `/prestataire/nouveau` — Provider wizard

Reference: K-YOU `src/pages/BecomeProvider.jsx`, `STRUCTURED-FORMS.md`, `screenshots/structured/planning.png`, `screenshots/structured/localisation.png`.

**Files**: `apps/web/src/app/prestataire/nouveau/page.tsx` (server, metadata), `apps/web/src/app/prestataire/nouveau/WizardClient.tsx`, `apps/web/src/components/onboarding/`: `WizardHero.tsx`, `ProgressRail.tsx`, `StepInfos.tsx`, `StepServices.tsx`, `StepLocation.tsx`, `StepPublic.tsx`, `PreviewCard.tsx`, `BenefitsCard.tsx`, `WizardFooter.tsx`, `wizard-state.ts` (reducer + `useWizardDraft` over `sessionStorage`), `wizard-validation.ts` (mirrors the server rules from 02 with Zod schemas from `@kayu/schemas`); `apps/web/src/components/schedule/ScheduleEditor.tsx`, `RangeRow.tsx`, `ExceptionRow.tsx`; `apps/web/src/components/media/PhotoDropzone.tsx`, `VideoEditor.tsx`, `UploadProgress.tsx`.

**Audience**: signed in, `CLIENT` only. A `PROVIDER` is redirected to `/prestataire/[id]/modifier`; anonymous → `/login?returnTo=/prestataire/nouveau`.

**Data**

| Call | Endpoint | When |
| --- | --- | --- |
| `categoriesApi.getTree()` | `GET /categories/tree` | step 2 selects |
| `referencesApi.list({ type })` | `GET /references?type=SKILL&categoryId=`, `LANGUAGE`, `INTERVENTION_MODE`, `CURRENCY`, `PRICE_UNIT` | steps 2 and 4 |
| `placesApi.list(...)` | `GET /places` | step 3 through `LocationFields` |
| `mediaApi.sign({ purpose: 'media' })` + direct Supabase upload | `POST /me/uploads/sign` | photo, images, video uploads |
| `providersApi.publish(payload)` | `POST /me/provider` | final submit |

Nothing is written server-side before the final submit. The draft lives in `sessionStorage` (`kayou.providerDraft`, versioned) and survives reloads on the same tab; uploaded media paths are part of the draft so a reload does not lose uploads.

**Layout, mobile 390 px**

1. `Logo` top bar (the page renders inside `Layout` with the dock, as K-YOU does).
2. `WizardHero` — `rounded-3xl bg-primary p-6 text-white` with an accent blurred orb, H1 "Devenez prestataire KAYOU", subtitle. The circular masked photo is hidden below `sm`.
3. `ProgressRail` — four numbered circles on a hairline rail with a primary fill sized `(step-1)/3`; done steps show `Check`; 10 px labels: Informations personnelles / Vos services / Localisation / Profil public.
4. Step card `rounded-3xl border bg-white p-5`, content swapped with `AnimatePresence mode="wait"` (x ±24, 0.28 s):
   - **Step 1 Infos**: Nom d'affichage* (`Field` with `User` icon), Téléphone* + WhatsApp (`PhoneField`, E.164 with +243 default), `PhotoDropzone` (dashed `rounded-2xl bg-secondary/30`, preview circle or `Camera`, ≤ 8 MB JPEG/PNG/WebP, uploads immediately with `UploadProgress`).
   - **Step 2 Services**: Catégorie* (`Choice` with a leading `Briefcase`), Sous-catégorie and Service selects cascading from the tree (disabled until the parent is chosen; the deepest chosen node is what gets sent as `subcategoryId`), Années d'expérience (number 0–60), `MultipleChoices type="SKILL"` scoped to the category, free-text skills (comma separated, ≤ 10), Description textarea (≤ 2000, `ExpandableText` preview in the recap).
   - **Step 3 Localisation**: `LocationFields` full chain with the "Mon lieu est absent" suggestion form, Adresse (`AddressAutocomplete`) and the green GPS line; browser geolocation fallback when the autocomplete returns no coordinates.
   - **Step 4 Profil public**: `MultipleChoices` Langues parlées, `MultipleChoices` Mode d'intervention, `PricingFields`, `ScheduleEditor`, `VideoEditor`, `PreviewCard` (avatar, name, "category · subcategory", "city · country"), CGU checkbox row with a custom square check (links to `/cgu` and `/confidentialite`), `BenefitsCard` (emerald card, three icon columns: Recevez des demandes / Gérez votre planning / Soyez visible localement — the K-YOU "Soyez payé en sécurité" line is dropped because payments do not exist).
5. `WizardFooter` — "← Retour" outline pill from step 2, gold full-width "Continuer →" / "Créer mon profil →", disabled until the step validates (1: name + phone; 2: deepest node chosen; 3: city chosen; 4: CGU accepted and no upload in flight).
6. Success state: centred gold circle with `CheckCircle`, "Votre profil est en ligne", then `router.replace('/prestataire/<id>')` after 1.5 s. The `AuthContext` user is refetched so the role flips to `PROVIDER` and the dock switches to the provider tabs.

**Desktop 1440 px**: `max-w-3xl`, hero shows the 112 px circular photo with `ring-4 ring-accent/30`, step-1 phone fields in `grid-cols-2`, the footer pills sit side by side.

**`ScheduleEditor`**: timezone select (Africa/Kinshasa, Africa/Lubumbashi, Africa/Brazzaville); seven weekday rows each with an on/off switch and up to four `RangeRow` (start, end time inputs at 15 min steps, remove button, "+ Plage" while under four); appointment duration (15–240, step 15) and buffer (0–60) selects; exceptions list with `ExceptionRow` (date, closed / custom range, reason) and "+ Exception". Client validation: ranges ordered and non-overlapping per day, end > start, no duplicate exception dates. Emits the `schedule` object of 02.

**`VideoEditor`**: "Mes vidéos" section, YouTube first — URL field that accepts `youtube.com/watch`, `youtu.be`, `youtube.com/shorts` only (host check ported into `@kayu/utils`), shows the thumbnail, adds a tile; then "Ajouter une vidéo" file picker (MP4, MOV, WebM, ≤ 25 MB) with `UploadProgress` (XHR-style progress via `XMLHttpRequest` to the signed URL). Maximum 12 tiles combined; drag to reorder with `@dnd-kit/sortable` (already a dependency); remove with confirm.

**`PhotoDropzone`** doubles as the gallery picker in step 4 with `multiple` (≤ 12 images).

**States**: upload error → tile with a retry button, draft kept; publish 409 (provider exists) → redirect to the editor; publish 400 → field errors mapped from the Zod issue paths onto the step that owns the field, and the wizard jumps to that step.

---

## `/prestataire/[id]/modifier` — Profile editor

Reference: K-YOU `src/pages/EditProvider.jsx`.

**Files**: `apps/web/src/app/prestataire/[id]/modifier/page.tsx` (server, `createAuthenticatedServerApiClient()`, `GET /providers/:id`, 403 → `notFound()` unless owner or admin), `apps/web/src/app/prestataire/[id]/modifier/EditorClient.tsx`.

**Audience**: the owner or an admin.

**Layout**: `mobile-page max-w-3xl`; back circle → `/mon-espace`; H1 "Modifier mon profil"; a horizontally scrolling tab strip (Infos / Services / Localisation / Profil public / Planning / Vidéos) reusing the step components in edit mode with a sticky bottom save bar. Each tab saves independently:

| Tab | Call |
| --- | --- |
| Infos, Services, Localisation, Profil public (languages, modes, pricing, social links) | `providersApi.updateMe(partial)` → `PATCH /providers/me` |
| Planning | `providersApi.replaceSchedule(schedule)` → `PUT /providers/me/schedule`; a notice reminds that existing bookings are not changed |
| Vidéos and gallery | `providersApi.replaceMedia(list)` → `PUT /providers/me/media` |

Admins editing another provider use the same screen against `PATCH /admin/providers/:id` for the moderation fields only (hidden, tier, verification); content fields are read-only for admins to keep one write path per field.

**States**: dirty-tab guard before switching tabs; success toast per tab; 400 field errors inline.

---

## `/verification` — KYC (kept, restyled)

Reference: existing `apps/web/src/app/pro/verify/*` behaviour; visual language from `screenshots/ui-refresh/compte.png` cards.

**Files**: `apps/web/src/app/verification/page.tsx` (server), `apps/web/src/app/verification/VerificationClient.tsx`, `apps/web/src/components/verification/VerifyWizard.tsx`, `VerifyStatus.tsx`, `UploadTarget.tsx`, `DocStatusRow.tsx`.

**Audience**: `PROVIDER` only; others → `/mon-espace` or `/mes-reservations`.

**Data**: `verificationApi.getState()` → `GET /pro/verification/state`; `uploadDoc` → `POST /pro/verification/documents` after a signed upload with purpose `verification`; `removeDoc` → `DELETE /pro/verification/documents/:id`; `submit` → `POST /pro/verification/submit`.

**Layout**: back circle + H1 "Vérification" + subtitle; `VerifyStatus` hero card (`rounded-3xl bg-primary text-white` with a faded `ShieldCheck` watermark: state label, progress bar, next action) when a submission exists, else `VerifyWizard` with four `UploadTarget` cards (Pièce d'identité recto / verso, Selfie, Justificatif d'adresse, plus an optional certificate) each a dashed dropzone that becomes a `DocStatusRow` (file name, uploaded date, approved / rejected pill with the reason, remove button); a benefits card; a security note about the private bucket; gold "Envoyer pour vérification" pill enabled when the four required kinds are present.

**Delete**: `DisputeView.tsx`, `DisputeBanner`, `DebugStateSwitch`, `apps/web/src/app/pro/verify/fixtures.ts`, `?debug=1` handling.

---

## Deletions

| Path | Reason |
| --- | --- |
| `apps/web/src/app/auth/**` incl. `AuthFlow.tsx` (1455 lines), `BrandSide`, `StepDots`, `LogoBadge`, `ErrorRow`, `FormField`, `AuthSwitchFooter`, `RoleCard` | replaced by `/login`, `/register` and the `components/auth/*` steps |
| `apps/web/src/app/pro/onboarding/**` incl. `OnboardingSteps.tsx` (924 lines), `types.ts` (`CITIES`, `LANGUAGES`, `SKILL_SUGGESTIONS` constants) | replaced by the wizard and reference endpoints |
| `apps/web/src/app/pro/profile/**` (`photo`, `portfolio`, `portfolio/new`, `presentation`) | replaced by the editor tabs |
| `apps/web/src/app/pro/verify/**` | moved to `/verification` |
| `apps/web/src/app/dashboard/settings/page.tsx` provider sections (`services`, `availability`, `zones`) | moved to the editor; the remaining settings sections are owned by 07 (`/compte`) |
| `apps/web/src/lib/upload.ts` | replaced by `apps/web/src/lib/media-upload.ts` with progress support and purposes `avatar \| media \| attachments \| verification` |

## Acceptance criteria

- `/auth`, `/auth?mode=signup`, `/pro/onboarding`, `/pro/verify` respond 308 to the new paths.
- A new phone completes register → OTP → name → terms → wizard → published profile in one session without a page error, and `GET /me` returns `role: PROVIDER` afterwards.
- An existing client logging in with `returnTo=/prestataire/<id>` lands on that profile; an unsafe `returnTo` (`//evil`, `https://…`) is ignored.
- The wizard draft survives a reload on the same tab, including uploaded media paths, and is cleared after publish.
- The wizard refuses to advance with the exact client rules listed, and maps a server 400 back to the owning step.
- `ScheduleEditor` rejects overlapping ranges and more than four ranges per day before any request is sent.
- `VideoEditor` rejects `youtube.com.evil.io` style hosts and files over 25 MB client-side.
- The welcome carousel appears once on a fresh mobile profile, never on desktop, never when signed in.
- No gradient panel or split-screen brand column exists on `/login` or `/register`.
- The demo-accounts panel is absent from a production build (`NODE_ENV=production pnpm --filter @kayu/web build` then grep the output for "Password123").

## Verification commands

```sh
pnpm --filter @kayu/web type-check
pnpm --filter @kayu/web build
curl -sI "http://localhost:3000/auth?mode=signup" | grep -i location      # /register?mode=signup
curl -sI http://localhost:3000/pro/onboarding | grep -i location          # /prestataire/nouveau
node scripts/ui-review.mjs --routes "/bienvenue,/login,/register,/prestataire/nouveau,/verification" --widths 320,390,1440
```

# 06 → 07, 08, 10: auth, wizard, editor and verification as implemented

Workstream 06 rebuilt the entry screens and provider onboarding of `apps/web` on branch `kyou-ux/06-auth-onboarding`. Decisions are logged in `PROGRESS.md` (rows prefixed "(06)"). This file lists what later workstreams reuse.

## Routes

| Route | Files | Notes |
| --- | --- | --- |
| `/bienvenue` | `bienvenue/{page,WelcomeClient}.tsx` | `AuthCanvas topBar`; sets `localStorage.kayou_onboarded` on mount and on finish; `WelcomeGate` (mounted on `/`) sends a fresh anonymous phone-sized visit here |
| `/login` | `(canvas)/login/{page,LoginClient}.tsx` | `?returnTo` (same-origin, never an auth path); already signed in → `returnTo` or role home |
| `/register` | `(canvas)/register/{page,RegisterClient}.tsx` | Same flow plus `AccountTypeSelector`; `?as=provider` pre-selects the intent; `?returnTo` |
| `/prestataire/nouveau` | `(shell)/prestataire/nouveau/{page,WizardClient}.tsx` | `ProtectedRoute`; an existing provider is sent to its editor by the client; publishes through `POST /me/provider` |
| `/prestataire/[id]/modifier` | `(shell)/prestataire/[id]/modifier/{page,EditorClient}.tsx` | Server: `me` → own id (or wizard, or login); `GET /providers/:id` through the cookie; `RequireOwnerOrAdmin` |
| `/verification` | `(shell)/verification/{page,VerificationClient}.tsx` | `RequireRole PROVIDER`; `GET /pro/verification/state`, upload / remove / submit |

Redirect row applied in `next.config.ts`: `/pro/profile/:rest*` → `/prestataire/me/modifier`.

## Auth

- `useAuth()` now also exposes `updateProfile(dto)`; `login`, `verifyOtp`, `acceptTerms`, `updateProfile` and `refreshUser` resolve with the `AuthUser` (or `null` when anonymous), so screens can route without waiting for a render.
- `lib/auth-return-to.ts`: `postAuthDestination(user, { returnTo, signupIntent })` (ADMIN → `/admin`; safe `returnTo`; provider intent without a row → `/prestataire/nouveau`; PROVIDER → `/mon-espace`; else `/rechercher`), `roleLanding(user)` (`/admin` · `/mon-espace` · `/mes-reservations`), `usableReturnTo(raw)`, `readSignupIntent` / `writeSignupIntent` / `clearSignupIntent` (`sessionStorage.kayou.signupIntent`). 04's `postLoginDestination` delegates here.
- `AuthGate` leaves `/login` and `/register` alone while `status === "needs-terms"`: those screens show the terms step inline. Every other route still gets `AcceptTermsScreen`.
- Link to sign-up with a provider intent: `/register?as=provider` (07's "Devenir prestataire" CTAs, 05's premium teaser).

## Components handed to 07 and 08

All client components; props typed against `@kayu/schemas`.

| Component | Props | Notes |
| --- | --- | --- |
| `forms/Field`, `TextAreaField`, `SelectField` | `label` (required), `hint?`, `error?`, `required?`, `icon?`, native props | Labelled `.field` inputs with an inline `role="alert"`; `FormError` (red box) and `Spinner` (18 px ring) in the same file |
| `schedule/ScheduleEditor` | `value: ScheduleValue`, `onChange`, `className?` | Timezone, duration / buffer, seven day rows (≤ 4 `RangeRow`), `ExceptionRow` list; runs `validateSchedule` from `@kayu/utils` and shows the issues inline. `defaultSchedule()` and `scheduleIssues(value)` are exported; `ScheduleValue` is the `PUT /providers/me/schedule` body |
| `media/PhotoDropzone` | single: `value: MediaDraftItem \| null`, `onChange`; `multiple`: `value: MediaDraftItem[]`, `onChange`, `max?`; both: `label`, `hint?`, `onBusyChange?` | Uploads to purpose `media` as soon as a file is picked (JPEG/PNG/WebP ≤ 8 MB), progress bar, retry tile on failure, drag-and-drop. Use `uploadFile("avatar", …)` + `mediaApi.setAvatar` for the account avatar in 07 |
| `media/VideoEditor` | `value: MediaDraftItem[]` (videos only), `onChange`, `onBusyChange?` | YouTube tab (`parseYouTubeUrl` host allow-list, thumbnail) and upload tab (MP4/MOV/WebM ≤ 25 MB, XHR progress); ≤ 12 tiles; dnd-kit reorder (pointer + keyboard); confirm on remove |
| `media/media-draft` | `MediaDraftItem`, `toMediaInput(item)`, `fromProviderMedia(row)`, `isImage`, `isVideo`, `newMediaKey()` | The draft ⇄ `MediaInput` bridge for `POST /me/provider` and `PUT /providers/me/media` |
| `onboarding/CategoryCascade` | `tree`, `value: { categoryId, subcategoryId, serviceId }`, `onChange`, `error?`, `disabled?` | Category › sub › service selects; `selectionForNode(tree, id)` maps a stored `subcategoryId` back to the three ids (08's provider edits, search deep links) |
| `onboarding/PublicProfileFields` | `value: { languageIds, modeIds, pricing, social }`, `onChange`, `errors` | Languages, modes, pricing and the four social links |
| `onboarding/StepInfos`, `StepServices`, `StepLocation` | `value`, `onChange(patch)`, `errors`, `heading?` | Used by the wizard and the editor tabs (`heading={false}`) |
| `onboarding/wizard-validation` | `stepErrors`, `stepIsValid`, `toPublishPayload`, `validatePayload`, `mapIssues`, `deepestNode`, `splitFreeSkills` | `mapIssues` accepts Zod issue paths or the backend's dotted `errors[].path` and returns `{ step, fields }` |
| `auth/TermsStep` → `TermsCheckbox` | `checked`, `onChange`, `copy: { accept, cgu, and, privacy, end }` | The custom square check linking `/cgu` and `/confidentialite` |
| `verification/UploadTarget`, `DocStatusRow`, `VerifyStatus` | see files | 08's KYC queue can reuse `DocStatusRow` for read-only rows (`removable={false}`) |
| `auth/DemoAccountsPanel` | `returnTo` | Dev only (`NODE_ENV !== "production"` and compiled out of the production bundle) |

## Helpers

- `lib/media-upload.ts`: `uploadFile(purpose, file, { onProgress?, signal? })` → `{ path, bucket, url }` (`url` only for the public purposes `avatar` and `media`); `publicObjectUrl(bucket, path)`; `UploadError`. Signs through `POST /me/uploads/sign` then PUTs the bytes straight to the signed Supabase URL.
- `lib/onboarding-draft.ts`: `readDraft` / `writeDraft` / `clearDraft` over `sessionStorage.kayou.providerDraft` (versioned envelope).
- `copy/auth.ts`, `copy/onboarding.ts` (wizard, editor, schedule, video, photo copy), `copy/verification.ts`.

## Environment notes (for 10)

- The Supabase project lacks the `provider-media` and `verification-docs` buckets: `POST /me/uploads/sign` answers 500 for purposes `media` and `verification`. Create them (public / private as in 02's storage service) before the closed beta; the client shows the retry tile until then.
- `kayu_05_verify` has the demo accounts Paul, Jean-Pierre, Michelle, Joseph and admin linked to their Supabase auth ids so the dev panel signs each role in; the dev reset should seed those links.

## Verification

```sh
pnpm --filter @kayu/web type-check
NODE_ENV=production pnpm --filter @kayu/web build && grep -r Password123 apps/web/.next/static apps/web/.next/server/app   # no match
curl -sI "http://localhost:3000/auth?mode=signup" | grep -i location        # /register?mode=signup
curl -sI http://localhost:3000/pro/onboarding | grep -i location            # /prestataire/nouveau
cd apps/web && PW_CHANNEL=chrome node scripts/overflow-check.mjs --urls /bienvenue /login /register --widths 320 390 1440 --reduced-motion
```

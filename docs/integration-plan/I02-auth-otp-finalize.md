# I02 — Auth OTP finalization

## Goal

Finalize Supabase SMS OTP authentication on both platforms. Remove the `DEMO_ACCOUNTS` dev-only fallback used during DS02. First-time users get a proper role-selection step that persists the role via `PATCH /me/role`, then route to the appropriate home.

## Why it matters

Phone OTP is the primary auth for the DRC / Congo-B audience. Until the real Supabase SMS provider is wired, we're shipping a mock. The dev demo fallback (`admin@...` / `pro@...` / `client@...` email accounts that bypass the OTP step) is convenient during development but must not ship to production.

## Scope

### In scope
- **Two explicit flows** distinguished by URL:
  - **Signup** (`/auth?mode=signup` or `/auth/signup`): role picker **first** → phone → OTP → route to home or onboarding
  - **Login** (`/auth` default): phone → OTP → route based on existing `user.role`. If the returned user has no role (edge case), fall back to showing the role picker before redirecting.
- Wire `supabase.auth.signInWithOtp({ phone })` and `verifyOtp({ phone, token, type: "sms" })`
- Resend logic with a real 32s cooldown (server-side)
- Remove **all legacy homepage auth dialogs**:
  - `LoginDialog`, `RegisterDialog`, and any similar modal components on the web homepage
  - Any "Se connecter" / "S'inscrire" buttons that open modals → rewire to navigate to `/auth` and `/auth?mode=signup` respectively
  - Any `<AuthModal>` / `<UserMenu>` modal wrapper embedded in the web header
- Remove `DEMO_ACCOUNTS` fallback panel from both web and mobile
- Session handling: Supabase's existing SSR + SecureStore approach
- Error states: invalid OTP, expired OTP, rate-limited → clear French copy

### Out of scope
- Email auth as a fallback
- Social login (Google / Apple)
- Account recovery (phone OTP is stateless — no password recovery)
- Multi-device session management

## Backend state

No backend work required. Supabase owns OTP. The backend already:
- Validates Supabase JWTs via `SupabaseGuard`
- Auto-creates the `User` record in `ActorGuard` on first authenticated request
- Exposes `PATCH /me/role` for setting the role

**Confirm** the Supabase project's phone provider is configured for both `+243` (CD) and `+242` (CG) prefixes. If not, that's a project-level config task in the Supabase dashboard. Open `SMS > Providers` and ensure Twilio (or whichever provider) has valid credentials and a sending number that can deliver to both countries.

## `@kayu/schemas` state

No new schemas needed. `MeResponseSchema` already has the `role` field.

## `@kayu/api` state

No new endpoint functions needed. The identity module already has `setRole`.

## Two flows — signup vs login

### Signup flow (`/auth?mode=signup`)

Role picker is **step 0**. Commit to the role before typing a phone number.

```
Step 0: Role picker
  "Que voulez-vous faire sur KAYOU ?"
  [ Je cherche un pro ]   (client — Sky tint + search icon)
  [ Je suis un pro     ]   (pro — Coral tint + sparkles icon)

Step 1: Phone
  Copy adapts to chosen role:
    client: "Entrez votre numéro pour créer votre compte"
    pro:    "Entrez votre numéro pour créer votre compte pro"

Step 2: OTP
  6-digit grid, auto-advance, auto-verify after 6th digit.

Step 3 (client only — pros skip): Name entry
  "Enchanté ! Dites-nous qui vous êtes."
  • Prénom (required)
  • Nom (required)
  • Ville (optional — defaults to Kinshasa)
  • Email (optional — "Pour recevoir vos reçus, facultatif")
  [ Continuer ]

On signup completion:
  • setRole({ role: chosenRole })
  • client: PATCH /me/profile with name fields → / (home)
  • pro:    → /pro/onboarding (onboarding step 1 Identité collects the same fields anyway)
```

### Login flow (`/auth` — default)

```
Step 0: Phone input (no role picker)
Step 1: OTP input

On success:
  if (user.role && user.firstName) → route to role's home (/, /pro, /admin)
  else if (!user.role) → edge case: show role picker fallback → setRole → …
  else if (user.role === "CLIENT" && !user.firstName) → edge case: show name step → PATCH /me/profile → /
  else pro without firstName: onboarding banner on /pro handles it (I03)
```

## Why step 3 is client-only

Pros land on `/pro/onboarding` immediately after step 2, and onboarding's step 1 (Identité) **already collects** firstName + lastName + phone + ID docs. Asking in step 3 then again in onboarding step 1 is a double prompt.

Clients don't have an onboarding flow — they need to be able to use the app (search, book, message) the moment signup completes. Without a name, the UI breaks: greetings ("Bonjour {firstName}"), chat bubble attribution, booking receipts all lose their anchor. The minimal 2-field step solves this in under 10 seconds.

## Frontend wiring — web

File: `apps/web/src/app/auth/page.tsx` + `apps/web/src/components/auth/AuthFlow.tsx`

### Current state
Mocked: phone → OTP → role picker. `DEMO_ACCOUNTS` button lets a dev click through directly. Plus legacy dialogs (`LoginDialog`, `RegisterDialog`) still live on the homepage.

### Target state

```tsx
// /auth route reads ?mode= query param
const searchParams = useSearchParams()
const mode: "signup" | "login" = searchParams.get("mode") === "signup" ? "signup" : "login"

// Signup starts at step 0 (role); login starts at step 1 (phone)
const [step, setStep] = useState(mode === "signup" ? 0 : 1)
const [chosenRole, setChosenRole] = useState<"CLIENT" | "PROVIDER" | null>(null)

// Step 0 (signup only) — role pick
const selectRole = (role: "CLIENT" | "PROVIDER") => {
  setChosenRole(role)
  setStep(1)
}

// Step 1 → 2 (request OTP)
const requestOtp = async () => {
  const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone })
  if (error) { setError(supabaseErrorCopy(error)); return }
  setStep(2)
  startResendCountdown(32)
}

// Step 2 verify
const verifyOtp = async (code: string) => {
  const { data, error } = await supabase.auth.verifyOtp({ phone: fullPhone, token: code, type: "sms" })
  if (error) { setError("Code invalide ou expiré"); return }

  const me = await identityApi(apiClient).me()

  // ── SIGNUP flow ──────────────────────────────────────────────
  if (mode === "signup" && chosenRole && !me.user.role) {
    await identityApi(apiClient).setRole({ role: chosenRole })
    if (chosenRole === "PROVIDER") {
      // Pro: skip name step — onboarding step 1 collects it
      router.replace("/pro/onboarding")
    } else {
      // Client: need name
      setStep(3) // client name step
    }
    return
  }

  // ── LOGIN flow ───────────────────────────────────────────────
  if (!me.user.role) {
    // Edge: Supabase user exists but no local role → role-picker fallback
    setStep(3)
    return
  }

  // Returning pro with incomplete onboarding → dashboard banner catches them (I03)
  if (me.user.role === "PROVIDER") {
    router.replace("/pro")
    return
  }

  // Returning client missing firstName (edge) → prompt for name
  if (me.user.role === "CLIENT" && !me.user.firstName) {
    setStep(3) // client name step
    return
  }

  // Happy path — returning user with everything set
  router.replace(me.user.role === "ADMIN" ? "/admin" : "/")
}

// Step 3 — dual purpose: signup name OR fallback role picker for edge cases
// Component decides based on context: if (mode === "signup" && chosenRole === "CLIENT") → name form
// else if login edge case with no role → role cards

const submitName = async ({ firstName, lastName, city, email }: ClientNameInput) => {
  await identityApi(apiClient).completeProfile({ firstName, lastName, city, email })
  router.replace("/")
}

const selectRoleFallback = async (role: "CLIENT" | "PROVIDER") => {
  await identityApi(apiClient).setRole({ role })
  if (role === "PROVIDER") router.replace("/pro/onboarding")
  else setStep(3) // fall through to name step for client
}
```

### Step indicator

- Signup as client: 4 dots (role, phone, otp, name)
- Signup as pro: 3 dots (role, phone, otp) — next step is `/pro/onboarding` with its own indicator
- Login happy path: 2 dots (phone, otp)
- Login edge cases: dots animate to 3 or 4 as fallbacks trigger

### Name step UI (step 3, client)

```
Enchanté !
Dites-nous qui vous êtes.

[ Prénom        ] required
[ Nom           ] required
[ Ville ▾       ] optional, defaults to Kinshasa, dropdown of major CD/CG cities
[ Email (optionnel) ]
Pour recevoir vos reçus par email — vous pouvez l'ajouter plus tard.

[ Continuer → ]    disabled until firstName + lastName filled
```

Minimal, 2 required fields. "Plus tard" link is NOT offered — name is required. Email stays optional.

Uses existing `PATCH /me/profile` endpoint (already shipped in the identity module).

### Critical flow detail

New pros go directly from OTP verification to `/pro/onboarding` because their role was set at step 0 (before the phone number). There is **no intermediate** "welcome pro" screen.

If they abandon the wizard, their draft is persisted (I07). The dashboard banner (I03) catches them on return. Full safety net.

Returning pros with `role=PROVIDER` and completed onboarding land on `/pro` directly.

## Removing the legacy homepage dialogs

Find these on the web (exact names may vary — grep to locate):

```bash
grep -rn "LoginDialog\|RegisterDialog\|AuthModal\|SignInModal\|SignUpModal" apps/web/src/
```

For each hit:
1. Delete the component file
2. Find every usage and replace:
   - "Se connecter" button → `<Link href="/auth">Se connecter</Link>` (or `router.push("/auth")`)
   - "S'inscrire" button → `<Link href="/auth?mode=signup">S'inscrire</Link>`
3. Remove any `useState` + modal-controlling state (`isLoginOpen`, `isSignUpOpen`) from the parent (likely homepage or web header)
4. Remove dialog imports

If the web header has a user menu / avatar dropdown showing "Se connecter" for unauthenticated users, rewire it the same way — direct navigation, no modal.

For the **homepage hero** that may currently have a "S'inscrire" CTA: keep the CTA but route to `/auth?mode=signup`.

**Don't replace with a different modal.** The auth flow is full-screen on purpose; mixing a modal on top of a multi-step flow hurts conversion.

## Mobile parity

Mobile navigates directly to the `AuthScreen` — there are no dialogs to remove (DS02 already retired the v1 Login/Register screens). Update the `AuthScreen` to accept a `mode` route param (or read from a local state that defaults by entry point):

```tsx
// apps/mobile/src/screens/auth/AuthScreen.tsx
const route = useRoute<AuthRouteProp>()
const mode = route.params?.mode ?? "login"
const [step, setStep] = useState(mode === "signup" ? 0 : 1)
// ... rest matches web
```

Entry points on mobile:
- Not-logged-in user hits any protected screen → `navigation.navigate("Auth", { mode: "login" })`
- Splash / welcome screen "Créer un compte" button → `navigation.navigate("Auth", { mode: "signup" })`
- Splash / welcome screen "Se connecter" button → `navigation.navigate("Auth", { mode: "login" })`

Remove the `DEMO_ACCOUNTS` component and its entry point. If local dev really needs a bypass, use Supabase's test phone numbers (configurable per project) instead of baking it into the app.

## Frontend wiring — mobile

File: `apps/mobile/src/screens/auth/AuthScreen.tsx`

Same flow, using `@supabase/supabase-js` + the Expo SecureStore adapter already in place from v1 DS02.

```ts
import * as SecureStore from "expo-secure-store"
import { supabase } from "@/lib/supabase"

// signInWithOtp and verifyOtp work the same as web
// On success, Supabase auto-persists the session in SecureStore
```

Remove the `DEMO_ACCOUNTS` panel.

## Error copy (French)

- Invalid phone → "Numéro invalide. Vérifie le format."
- OTP request failed → "Impossible d'envoyer le code. Réessaie dans un instant."
- OTP invalid → "Code invalide ou expiré. Demande-en un nouveau."
- OTP expired → "Ce code n'est plus valide. Reçois-en un autre."
- Rate limited → "Trop de tentatives. Réessaie dans quelques minutes."
- Role update failed → "Une erreur est survenue. Réessaie."

Display these inline under the relevant input (error state styling from v1 D02).

## Resend countdown

Server-side cooldown enforced by Supabase (usually 60s). UI shows a 32s soft-cooldown then allows tap; the server may reject earlier requests with rate-limit — surface the Supabase error if it does.

## Dependencies
- None
- Blocks I10

## Acceptance criteria

1. A real phone number in CD or CG receives an SMS with a 6-digit code
2. Entering the correct code completes login; incorrect code shows error
3. **Signup flow:** role picker appears **before** phone input; role is persisted after OTP success
4. **Client signup:** after OTP, a name step prompts for firstName + lastName (required), city + email (optional), persists via `PATCH /me/profile`, then routes to `/`
5. **Pro signup:** after OTP, skip directly to `/pro/onboarding` — no name step (onboarding collects name in step 1)
6. **Login flow:** role picker does not appear unless the user has no role set (edge case)
7. **Login edge case:** returning client without firstName → name step appears, then routes to `/`
8. Returning users with complete profile skip all extra steps
9. `LoginDialog` / `RegisterDialog` and any related modal components are deleted from the web
10. All "Se connecter" / "S'inscrire" triggers navigate to `/auth` (no modals)
11. `DEMO_ACCOUNTS` is not referenced anywhere in app code
12. Resend cooldown prevents spamming; UI reflects countdown
13. Mobile `AuthScreen` accepts a `mode` route param

## QA checklist
- [ ] `grep -rn "LoginDialog\|RegisterDialog\|AuthModal\|SignInModal\|SignUpModal" apps/web/` returns nothing
- [ ] `grep -r "DEMO_ACCOUNTS" apps/` returns nothing
- [ ] Homepage "Se connecter" navigates to `/auth` (full-page, no modal)
- [ ] Homepage "S'inscrire" navigates to `/auth?mode=signup` (full-page, no modal)
- [ ] `/auth?mode=signup` renders **role picker first**; step indicator shows 3 dots
- [ ] `/auth` (default) renders **phone first**; step indicator shows 2 dots
- [ ] Signup as client: pick role → phone → OTP → **name step** → redirected to `/`
- [ ] Signup as client: name step requires firstName + lastName; "Continuer" disabled until both filled
- [ ] Signup as client: city + email are optional; submitting without them works
- [ ] Signup as client: submitting name calls `PATCH /me/profile`; reload → `me.firstName` populated
- [ ] Signup as pro: pick role → phone → OTP → redirected to `/pro/onboarding` (no name step)
- [ ] Login as returning client (has firstName): phone → OTP → `/`
- [ ] Login as returning client (edge: no firstName): phone → OTP → name step → `/`
- [ ] Login as returning pro (complete onboarding): phone → OTP → `/pro`
- [ ] Login as returning pro (incomplete onboarding): phone → OTP → `/pro` with onboarding banner
- [ ] Edge case: Supabase user exists but no local role → OTP verified → role picker fallback appears → pick → routes correctly (pro to onboarding, client to name step)
- [ ] Submit an invalid phone → error message without advancing
- [ ] Submit a valid phone → SMS arrives within 30s on a real device
- [ ] Enter wrong OTP → "Code invalide ou expiré" appears; slot reset
- [ ] Resend cooldown counts down from 32s; resend disabled until elapsed
- [ ] Logout → auth state cleared; next visit to `/messages` redirects to `/auth`
- [ ] Session persists across web page refresh (Supabase SSR cookies)
- [ ] Session persists across mobile app restart (SecureStore)
- [ ] Error states use the French copy verbatim
- [ ] No dev-only button visible in production builds
- [ ] Mobile: `navigation.navigate("Auth", { mode: "signup" })` lands on role-picker step 0
- [ ] Mobile: `navigation.navigate("Auth", { mode: "login" })` lands on phone step 1

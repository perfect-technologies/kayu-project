# DS02 — Auth: phone OTP + role picker

## Goal

Replace the v1 email+password Login/Register screens with a single `AuthScreen` that runs a 3-step phone OTP flow ending on a role picker. Web has a split-panel layout with an animated live feed; mobile is a full-bleed single column.

## Why it matters

DRC / Congo-Brazzaville users expect SMS authentication. Email is optional and added later. The v1 scaffolding assumed email+password because the backend had it; the v2 design reverses that default — backend has to adapt, not design.

## Scope

### In scope
- New screen `Auth` with 3 steps: `phone → otp → done (role picker)`
- Country picker: CD (+243) with 9-digit hint, CG (+242) with 9-digit hint — both flags, monospace dial codes
- Formatted phone input (inserts spaces every 3 digits) with `inputMode="numeric"` and `maxLength=9`
- 6-digit OTP grid with auto-advance on digit, backspace backward, auto-verify when all filled (600ms debounce then advance)
- Resend counter (32s countdown from first send)
- Step dot indicator (active step = 22px wide pill; others = 6px dots)
- DoneStep: two large role-card buttons — "Je cherche un pro" (Sky tint + search icon) and "Je suis un pro" (Coral tint + sparkles icon). Tapping routes to `home` or `onboarding` respectively.
- Web: grid 2-column (form on left, `420–520px`; brand panel on right, `1.1fr`) — brand panel has animated "En direct · Kinshasa" live feed with 3 rotating events, gradient Sky→deep background with decorative radial pattern
- Mobile: full-bleed single column, 48px top padding, 24px side padding
- Retire `apps/mobile/src/screens/auth/{Login,Register}Screen.tsx`

### Out of scope
- Backend OTP implementation — assume there's a `/auth/otp/request` and `/auth/otp/verify` endpoint (or flag in PROGRESS if not)
- Email entry as a fallback (the chat mentions it's optional later)
- Account recovery / password reset (no password exists anymore)

## Reference files
- `prototype/components/Auth.jsx` — **pixel source of truth** for this chunk. Read the file in full (395 lines).
- `prototype/design-chat.md` search for "phone OTP" and "role picker" — design rationale

## Component structure

```
AuthScreen
├── Panel (shared render)
│   ├── if step === 0: <PhoneStep/>
│   │   ├── Logo (44px)
│   │   ├── H2 "Bienvenue sur KAYOU"
│   │   ├── Body copy "Entrez votre numéro…"
│   │   ├── <CountryTabs/> (2 segmented tabs, elevated "active" with shadow)
│   │   ├── <PhoneInputGroup/> (prefix block | input)
│   │   ├── Hint Caption
│   │   ├── "Envoyer le code" primary large button (disabled until 9 digits)
│   │   └── Privacy assurance card (Sky-subtle bg, shield icon)
│   ├── if step === 1: <OtpStep/>
│   │   ├── Back ghost link
│   │   ├── H2 "Entrez le code à 6 chiffres"
│   │   ├── Target + "modifier" link
│   │   ├── <OtpGrid/> (6 slots, 52×64 web / 44×56 mobile, weight 600, mono font 26/22)
│   │   └── Resend countdown
│   └── if step === 2: <DoneStep/>
│       ├── Success circle (80px, emerald glow)
│       ├── H2 "Vous êtes connecté·e"
│       ├── Body "Comment voulez-vous utiliser KAYOU ?"
│       ├── <RolePickerCard variant="client"/> → nav("home")
│       └── <RolePickerCard variant="pro"/> → nav("onboarding")
│
└── <StepDots/> (2 dots; shown on steps 0/1 only, below panel with 1px top divider)
```

## Per-platform layout

### Web
- `grid: minmax(420px, 1fr) 1.1fr`
- Left: form panel, 48 56 padding, max-width 520, centered vertically (`justify-content: center`)
- Right: brand panel with `linear-gradient(135deg, #0EA5E9 0%, #0284C7 55%, #0C4A6E 100%)`, pattern overlay (radial + diagonal), content bottom-aligned
- Brand content: "En direct · Kinshasa" with pulsing green dot → "2 187 pros vérifiés · Un·e à 10 minutes de chez vous." → live feed cards stacked, each with `rgba(255,255,255,0.08)` bg and backdrop blur

### Mobile
- Full-bleed `var(--k-bg)` background
- `padding: 48 24 32`
- No brand panel (fits in 390px)
- StepDots at the bottom of the flex column

## Validation rules
- Phone must equal 9 digits exactly for "Envoyer le code" to enable
- OTP auto-advances on each digit. When the 6th fills, 600ms delay then `setStep(2)`.
- Resend: show "Renvoyer dans 32s" — counter is mock for the prototype; wire to real backoff later.

## Keyboard behavior
- Phone input: `autoFocus`, `inputMode="numeric"`, formats display value with space every 3 digits but stores digits only
- OTP inputs: `autoFocus` on first box; on digit entry move focus forward; on Backspace in empty box move focus backward
- Never force a keyboard back-dismiss — let the platform handle it

## Routes & state
- **Web route:** `/auth`
- After DoneStep → `router.replace("/")` for client, `router.replace("/pro/onboarding")` for pro
- **Mobile screen:** `AuthScreen` in the auth stack; after DoneStep → `navigation.reset` to the main tabs (client) or `navigation.replace("ProviderOnboarding")` (pro)

## Backend contract

Minimum shape needed from backend:
```ts
POST /auth/otp/request { country: "CD" | "CG", phone: "897123456" }
  → { ok: true, codeMaskedTo: "+243 897 123 456", retryAt: 32_000 }

POST /auth/otp/verify { country: "CD", phone: "897123456", code: "123456" }
  → { user: { id, role: "CLIENT" | "PROVIDER" | null, firstName?, ... }, sessionToken }
```

If the returned user has `role` already set (returning user), the DoneStep **skips** entirely: on confirming OTP, navigate directly to the role-appropriate home.

If `role` is null, DoneStep renders and sets the role via `PATCH /me { role: ... }` before navigating.

## What to retire

In mobile:
- `apps/mobile/src/screens/auth/LoginScreen.tsx` → delete (content was email+password)
- `apps/mobile/src/screens/auth/RegisterScreen.tsx` → delete (content was email+password)
- Update navigation config to point to the new `AuthScreen`

Web doesn't have a v1 auth route to retire — it was only ever on mobile.

## Dependencies
- Depends on DS01 (icons, tab bar, routing)
- Blocks: DS11 audit

## Acceptance criteria

1. Web `/auth` renders the 2-column layout at ≥1024px; mobile renders single column
2. Country picker switches between CD +243 and CG +242 without layout shift
3. Phone input formats with spaces, rejects non-digits, enables CTA at 9 digits
4. OTP auto-advances forward, backspace moves backward, auto-verifies on 6th digit
5. DoneStep shows two role cards; tapping client → `home`, tapping pro → `onboarding`
6. Returning user with role set skips DoneStep and navigates directly
7. V1 `Login/Register` screens deleted; nav config updated
8. Reduced-motion: the pulsing "live" dot in the web brand panel stops animating; live feed doesn't rotate

## QA checklist
- [ ] `autoFocus` works on mobile (phone input) without keyboard bouncing
- [ ] Paste a 6-digit code into the first OTP slot → all 6 slots fill
- [ ] Resend countdown doesn't start on step 2; only starts when OTP was actually sent
- [ ] Web brand panel stays fixed-width on wider viewports (panel doesn't expand past `1.1fr`)
- [ ] Live feed cards use `backdrop-filter: blur(6px)` with fallback to solid on older browsers
- [ ] DoneStep role cards show correct hover color (Sky for client, Coral for pro)
- [ ] Accessibility: each OTP slot has `aria-label="Chiffre N"` (1-6)
- [ ] Accessibility: success circle on DoneStep has `role="img"` + `aria-label="Connexion réussie"`
- [ ] Mobile: no horizontal scroll at 360px width
- [ ] StepDots: current step pill is 22px wide; completed steps fill to Sky; pending stay at 6px border
- [ ] Retired v1 files are deleted AND no dead imports remain in navigator

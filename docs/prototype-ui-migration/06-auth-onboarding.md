# 06 - Auth And Provider Onboarding

## Status

Ready after reading `00`.

## Goal

Keep current phone-first auth and provider onboarding logic, but use prototype polish for trust, step clarity, and local-market details.

## Owns

- `apps/web/src/app/auth/AuthFlow.tsx`
- `apps/web/src/app/pro/onboarding/ProviderOnboardingClient.tsx`
- `apps/web/src/app/pro/onboarding/OnboardingSteps.tsx`
- `apps/mobile/src/screens/auth/*` if matching mobile changes are needed
- `apps/mobile/src/screens/pro/*` if matching onboarding changes are needed

## Keep Current Flow

- Phone OTP remains.
- Role selection remains.
- Provider onboarding remains API-backed.
- Draft/publish behavior remains.
- No KYC-heavy workflow unless already implemented and launch-safe.

## Prototype Inputs

Borrow:

- Country selector: RDC + Congo-Brazzaville
- Operator awareness for phone/Mobile Money later, without enabling payment
- Step indicator visual rhythm
- Identity, craft, zones, pricing, profile, publish progression
- Warm brand-side auth panel
- Local city/commune chips

## Tasks

1. Improve auth visual hierarchy without changing auth contracts.
2. Ensure language does not mention technical internals.
3. Make provider onboarding steps visually consistent with KAYOU tokens.
4. Keep pricing simple: hourly/start price guidance, not quote-marketplace setup.
5. Move full verification/KYC claims behind later/admin scope unless current implementation supports them.

## Do Not

- Do not add password auth unless already part of current flow.
- Do not add Mobile Money setup as required launch onboarding.
- Do not add formal quote setup.
- Do not block provider launch on complex KYC unless product explicitly decides it.

## Validation

Run:

```bash
pnpm --filter @kayu/web type-check
pnpm --filter @kayu/web build
pnpm --filter @kayu/mobile type-check
```

Manual routes:

- `/auth`
- `/pro/onboarding`
- mobile viewport 390px


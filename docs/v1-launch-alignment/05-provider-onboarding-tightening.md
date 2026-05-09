# 05 - Provider Onboarding Tightening

## Objective

Make provider onboarding match the v1 launch requirements and remove misleading placeholder behavior.

## Severity

P1

## Owns

- `apps/backend/src/modules/onboarding/*`
- `apps/backend/src/modules/providers/*`
- `apps/backend/src/modules/verification/*`
- `apps/backend/prisma/schema.prisma` if onboarding fields are promoted from draft JSON
- `packages/schemas/src/*`
- `apps/web/src/app/pro/onboarding/*`
- `apps/mobile/src/screens/pro/ProviderOnboardingScreen.tsx`
- `apps/mobile/src/screens/pro/onboardingData.ts`

## Target Flow

Provider onboarding should collect:

1. Phone number verification.
2. Identity confirmation state.
3. Service categories, max 3.
4. Experience level.
5. Skills and competencies.
6. Kinshasa service communes.
7. Service radius.
8. Starting-from base pricing.
9. Portfolio upload capability, or honest deferred copy.

## Current Gaps

- Phone OTP exists in auth, but onboarding publish does not require `phoneVerifiedAt`.
- Web identity document controls are optional toggles.
- Mobile identity document controls are fake upload toggles.
- Backend publish does not require experience or skills.
- `zoneRadiusKm` lives in draft JSON, not provider/search model.
- Provider update enforces max 3 trades but not max 3 categories.
- Portfolio models exist, but onboarding portfolio is placeholder count.
- Verification copy is inconsistent about review timing.

## In Scope

- Enforce max 3 provider service categories everywhere.
- Decide whether phone verification is required for publish or only for verified badge.
- Require experience and at least one skill if product confirms.
- Keep Kinshasa as the v1 default city and expand commune list as needed.
- Store radius in a stable field if used in discovery.
- Replace fake upload controls with real upload or explicit deferred copy.
- Align verification copy to `verification within 24h` only if operations supports it.
- Ensure verified badge appears only for real verified status.

## Out Of Scope

- Full KYC provider compliance system.
- Automated document fraud checks.
- Payments onboarding.
- Provider subscription/seats model unless separately scoped.

## Acceptance Criteria

- Provider cannot exceed 3 selected service categories.
- Provider publish validation matches v1 onboarding requirements.
- Placeholder upload behavior is not presented as real upload.
- Verification timing copy is consistent across web/mobile.
- Provider profile badge state matches backend verification status.
- Type-check/tests pass for touched packages.

## Test Evidence Required

Record in `PROGRESS.md`:

- Backend tests/type-check results.
- Web/mobile type-check results.
- Manual onboarding path checked.
- Any schema migration/push commands.

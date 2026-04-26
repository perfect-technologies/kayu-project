# 08 - Ops Admin, Settings, Error States

## Status

Ready after reading `00`.

## Goal

Replace the current admin dashboard with the prototype Ops Admin experience, and replace the current settings page with the prototype Settings experiences for both client and provider users.

This workstream is the exception to the "prototype is visual-only" rule. For `/dashboard/admin` and `/dashboard/settings`, the prototype is the target product surface. The admin dashboard is internal, so it can include operational queues and controls that should not appear in the public client/provider MVP. Settings are user-facing, so they must use the prototype UI while staying honest about what is actually supported. Settings must account for both roles: client and provider.

## Owns

- `apps/web/src/app/dashboard/admin/page.tsx`
- any admin-only components created under `apps/web/src/app/dashboard/admin/`
- any admin-only components created under `apps/web/src/components/admin/`
- `apps/web/src/app/dashboard/settings/page.tsx`
- `apps/web/src/components/notifications/*`
- shared empty/error/alert components
- `apps/web/src/components/layout/AppShell.tsx` only for shell polish

## Keep Current Flow

- Existing admin route remains `/dashboard/admin`.
- `/admin` may remain redirect-only.
- Settings route remains `/dashboard/settings`.
- Settings should use the full prototype Settings UI/IA, not only account/profile basics.
- Settings must render the right variant for the current user role:
  - client settings for regular clients,
  - provider settings for providers/prestataires.
- Notification center is not required for launch unless already wired.
- Client/provider routes must not expose admin-only ops promises.

## Prototype Inputs

Before editing code, inspect the prototype HTML directly:

- Primary prototype: `/Users/alainmk/Downloads/KAYOU Prototype _standalone_.html`
- Prototype copy, if present: `/Users/alainmk/Downloads/KAYOU Prototype _standalone_2.html`
- Design system: `/Users/alainmk/Downloads/KAYOU Design System _standalone_.html`

Agents must extract the admin and settings UI from the prototype itself. Do not implement this workstream from memory or from this document alone.

Useful prototype component/screen names to search for:

- `AdminOps`
- `SettingsAccount`
- `NotificationsCenter`
- `ErrorStatesGallery`
- `ProviderDashboard`
- `ProVerification`

Adopt for Ops Admin:

- Ops Admin visual hierarchy: KPI cards, tabs, queues, activity feed.
- Admin command center layout with dense but calm information.
- Verification/review queues where useful for operations.
- User/provider/service moderation queues.
- Support and issue queues.
- Payment, refund, payout, and dispute review sections as admin-only operational surfaces.
- Activity feed and audit trail patterns.
- Risk/status badges and compact decision controls.

Adopt for Settings:

- Client settings IA from the prototype.
- Provider settings IA from the prototype.
- Shared settings IA: profile, language, notifications, privacy, security, support.
- Sectioned settings layout with cards/rows/toggles matching the prototype.
- Account identity/profile editing surface.
- Provider-specific profile/business/service settings where shown in the prototype.
- Provider availability/service area/settings sections where shown in the prototype.
- Language and localization preferences.
- Notification preference rows, using disabled/coming-later states when notification delivery is not wired.
- Privacy/security/support sections from the prototype.
- Clear destructive-account actions with confirmation if implemented.

Borrow for error states:

- Error-state gallery philosophy: every state has title, explanation, action.
- Dense admin can be desktop-first, but still use KAYOU tokens.

## Tasks

1. Replace the existing `/dashboard/admin` information architecture with the prototype Ops Admin structure.
2. Replace the existing `/dashboard/settings` page with the prototype Settings structures for client and provider users.
3. Extract the relevant prototype components/classes/copy from the HTML and map them into maintainable app components.
4. Build or adapt admin sections for:
   - overview KPIs,
   - verification queue,
   - user/provider moderation,
   - service/category moderation,
   - booking/final-offer operations,
   - payment/refund/payout/dispute review,
   - support tickets or issue queue,
   - recent activity/audit feed.
5. Build or adapt settings sections for:
   - role-aware client/provider variant selection,
   - shared profile/account,
   - client-specific preferences from the prototype,
   - provider-specific profile/business preferences from the prototype,
   - provider services/service area/availability settings where shown in the prototype,
   - language,
   - notifications,
   - privacy,
   - security,
   - support/help,
   - account deletion/sign-out controls where appropriate.
6. Keep all payment/refund/payout/dispute surfaces internal to admin.
7. Use KAYOU cards, chips, tabs, mono numbers, compact tables, settings rows, toggles, and prototype status badges.
8. Remove generic admin/settings visual language:
   - raw blue/violet/red Tailwind ramps,
   - generic shadcn card feel,
   - `CDF` money formatting.
9. Add or normalize reusable empty/error states.
10. Polish AppShell premium/admin/settings panels to avoid off-system gradients.
11. If backend data is missing, create honest placeholder states or use existing mock/demo data patterns without pretending unsupported operations are live.

## Do Not

- Do not expose admin payment/refund/payout/dispute workflows to clients or providers.
- Do not add public navigation to old quote/request marketplace routes.
- Do not add client/provider copy promising protected payment, refund guarantee, or online checkout.
- Do not make admin mobile-critical for MVP; admin can be desktop-first, but it must not be broken on tablet/mobile.
- Do not wire destructive admin actions without confirmation and clear disabled/loading/error states.
- Do not make settings toggles silently fake persistence. If an option cannot be saved yet, make it disabled, local-only with clear behavior, or marked as coming later.
- Do not hide core prototype settings sections just because backend persistence is not complete.
- Do not merge client and provider settings into a single lowest-common-denominator page.
- Do not show provider-only settings to client users or client-only settings to provider users.

## Validation

Run:

```bash
pnpm --filter @kayu/web type-check
pnpm --filter @kayu/web build
```

Manual routes:

- `/dashboard/admin`
- `/dashboard/settings`
- common empty/error states where reachable

Manual checks:

- Agent notes in `PROGRESS.md` confirm the prototype HTML files inspected and the prototype component/screen names used.
- Admin tabs/queues fit at desktop width without horizontal layout breakage.
- Admin-only payment/refund/payout/dispute language does not appear in public client/provider routes.
- Money uses `FC`, not raw `CDF`.
- Empty admin queues still look intentional.
- Settings uses the full prototype section structure for both client and provider variants.
- Role switching/current-role detection shows the correct settings variant.
- Unsupported settings controls are visibly disabled, coming-later, or wired to real persistence.

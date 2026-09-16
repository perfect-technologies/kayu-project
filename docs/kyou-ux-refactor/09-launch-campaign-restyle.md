# 09 - Launch Campaign Restyle

## Objective

Bring `/launch`, `/launch/clients`, `/launch/providers` and `/launch/confidentialite` onto the K-YOU tokens and shared components from workstream 04 with **zero behaviour change**. The campaign is the live closed-beta funnel; only its skin moves.

## Severity

P1. The campaign is public today. A visual mismatch with the rest of the site after the refactor is acceptable for a short period; a functional regression is not.

## Owns

- `apps/web/src/app/launch/page.tsx`, `clients/page.tsx`, `providers/page.tsx`, `confidentialite/page.tsx`
- `apps/web/src/app/launch/CampaignLanding.tsx`
- `apps/web/src/app/launch/CampaignForm.tsx`
- `apps/web/src/app/launch/campaign-data.ts` (type only, see taxonomy below)
- The `.k-campaign` block in `apps/web/src/app/globals.css`

## Must not touch

- `apps/web/src/lib/campaign-leads.ts`, `campaign-form-state.ts`, `campaign-routing.ts`, `campaign-copy.ts`, `campaign-phone-contract.ts` and their `*.test.mjs` files
- `apps/web/src/proxy.ts`
- `apps/web/src/components/providers/AppProviders.tsx` (the `/launch*` short-circuit stays)
- `apps/backend/src/modules/launch-leads/**`
- `packages/schemas/src` launch-lead DTOs
- `NEXT_PUBLIC_CAMPAIGN_PRIVACY_NOTICE_VERSION` and its default `campaign-2026-07-25`

## In scope

- Replace the KAYOU sky/coral token usage with the K-YOU palette exposed by workstream 04.
- Swap local markup for the shared primitives created in 04 where a 1:1 equivalent exists.
- Give the landing the auth-canvas feel: ivory canvas with the mint/cream radial wash, centred content column, Sora headings, pill actions in deep green and gold, mint surfaces for the "Jamais demandé ici" card.
- Keep the two-column desktop layout (sticky left column, form right) and the single column on mobile.
- Keep every `id`, `name`, `aria-*`, `data-*` attribute and every DOM order the tests and analytics depend on.

## Out of scope

- New copy, new fields, new steps, new events.
- Moving the campaign inside the marketplace shell or `AppProviders`.
- Changing `KAYOU_PUBLIC_WEB_MODE` semantics or the `proxy.ts` redirects.
- Restyling the backend responses or the privacy notice content.

## Token remap

The campaign files use `var(--k-*)` inline and Tailwind arbitrary values. Workstream 04 redefines the `--k-*` variables to the K-YOU values, so most of the page re-skins with no edit. The table lists what still needs a hand change.

| Today | Replace with | Where |
| --- | --- | --- |
| `text-[var(--k-primary-hover)]` on overlines and links | `text-primary` (deep green) | `CampaignLanding.tsx`, `CampaignForm.tsx`, `confidentialite/page.tsx` |
| `focus:ring-[rgba(14,165,233,0.15)]` (sky ring) | `focus:ring-ring/40` | select and textarea in `CampaignForm.tsx` |
| `bg-[#FFFBF5]` warm card | `bg-secondary` (mint `#E9F0EB`) | "Jamais demandé ici" card in `CampaignLanding.tsx` |
| `rounded-[20px] border … shadow-[var(--k-e2)]` form cards | `rounded-3xl bg-white shadow-soft` (no border, per contract §9) | both form step cards |
| `rounded-[16px] border` details panel | `rounded-2xl border border-border bg-white` | planned-services `<details>` |
| `rounded-[12px]` inputs and selects | 14 px radius `.field` style from 04 | all inputs |
| `k-btn k-btn-primary` | 04 `primary-action` pill (54 px, `rounded-full`, deep green, gold on the final submit) | submit buttons |
| `k-btn k-btn-secondary`, `k-btn-ghost` | 04 `secondary-action` pill | back and retry buttons |
| `k-display-xl`, `k-display-m`, `k-body-l`, `k-overline`, `k-caption` | Same class names; 04 redefines them with Sora / Plus Jakarta Sans. Verify sizes after the redefinition. | headings |
| `.k-campaign-spinner` | Keep the class, restyle to a gold ring on the submit button only. Spinners on content are banned; this one sits inside a button and stays. | `globals.css` |
| `bg-[var(--k-bg)]` page | `auth-canvas` background utility from 04 | root `div.k-campaign` |
| Header "Ouverture prochaine · Kinshasa" pill | 04 `chip` primitive | header |
| Role chooser cards (`ROLE_COPY`) | 04 `ChoiceCard` (the same component as the register account-type selector) | hero left column |

`KIN_COMMUNES` from `@kayu/schemas` stays as the commune source for the campaign form. The campaign does not switch to `Place` references in this refactor because the lead DTO stores commune as a controlled string. Log this in `PROGRESS.md` as a follow-up for the closed-beta folder.

## Components to swap

| Local today | Shared from 04 |
| --- | --- |
| Inline `<header>` with logo + wordmark | `CampaignHeader` stays local but uses `Logo` from `@kayu/ui/web` |
| Inline `FieldLabel`, error row | `Field`, `FieldError` |
| Inline `<select>` styling | `Select` |
| Inline `<textarea>` styling | `Textarea` |
| Inline checkbox rows (consent, marketing) | `CheckRow` |
| Success block (icon circle + heading) | `SuccessCard` (same as the contact form success state) |
| Retry message block | `EmptyState` with a retry action |

Do not swap if the shared primitive changes tab order, form `name` attributes or the `id`s used by `campaign-form-state.ts`.

## Taxonomy impact

Workstream 01 makes `Subcategory` three levels deep. The campaign form keeps showing **level 1 (category `<optgroup>`) and level 2 (subcategory `<option>`) only**:

- `campaign-data.ts` `loadCampaignCategories()` calls `GET /categories/tree` (renamed from `/categories/hierarchy` in 02) and filters `subcategories` to `parentId === null`.
- `CampaignCategory` type stays `{ id, name, subcategories: { id, name }[] }`.
- `primarySubcategoryId` and `neededSubcategoryIds` remain level-2 ids. The backend `launch-leads` validation already accepts any active `Subcategory`; nothing changes there.
- The "planned services" `<details>` list keeps the same two-level rendering.

## Verification

Automated:

```sh
node --test apps/web/src/lib/campaign-copy.test.mjs
node --test apps/web/src/lib/campaign-form-state.test.mjs
node --test apps/web/src/lib/campaign-leads.test.mjs
node --test apps/web/src/lib/campaign-phone-contract.test.mjs
node --test apps/web/src/lib/campaign-routing.test.mjs
pnpm --filter @kayu/web type-check
pnpm --filter @kayu/web build
```

Manual, with `KAYOU_PUBLIC_WEB_MODE=campaign` and the backend flags `LAUNCH_PUBLIC_INTAKE_ENABLED=true`, `LAUNCH_FUNNEL_EVENTS_ENABLED=true` against a disposable database:

1. `/`, `/services`, `/providers/x`, `/auth` redirect to `/launch` with query preserved.
2. `/launch`, `/launch/clients`, `/launch/providers` render at 320, 390 and 1440 px with no horizontal overflow.
3. Provider submission with a valid `+243` number returns the generic accepted state; the database shows one `ProviderLead`, one `LeadSubmissionEvent`, zero `User`, zero `Provider`.
4. Client submission likewise creates one `ClientWaitlistLead`.
5. A duplicate submission returns the same accepted state and creates only a review-required event.
6. `POST /api/launch/funnel-events` fires on step change with the same event names as before (compare the `dataLayer` pushes to a recording made on `main` before the restyle).
7. `/launch/confidentialite` shows the unchanged notice version and `mailto:`.
8. `prefers-reduced-motion` on: no transitions on the form step change.
9. Keyboard-only run through both forms; focus ring visible on every control.

Screenshots of the three viewports go into `docs/kyou-ux-refactor/screenshots/09/`.

## Acceptance criteria

- All five campaign test files pass unchanged.
- No diff under `apps/web/src/lib/campaign-*`, `proxy.ts`, `AppProviders.tsx`, or the backend.
- The DOM `id`/`name` inventory of both forms is identical before and after (dump with `document.querySelectorAll('[id],[name]')` and diff).
- Manual smoke above passes and the evidence is recorded in `PROGRESS.md`.

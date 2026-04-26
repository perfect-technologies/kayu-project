# KAYOU Prototype UI Migration - Progress

Created: 2026-04-26

## Status Summary

This migration uses the new standalone prototype as the visual reference while preserving the Kinshasa MVP product flow.

Current launch truth:

- discovery,
- provider profile,
- chat,
- final offer in chat,
- client accept/decline,
- confirmed cash booking,
- completion,
- optional review.

## Workstream Status

| Workstream | Status | Owner | Notes |
| --- | --- | --- | --- |
| 00 - Product Flow Contract | Ready | Planning | MVP flow guardrails documented |
| 01 - Canonical Design System | Complete | Codex | Standalone tokens, globals, docs, and `/design-system` route aligned |
| 02 - Shared UI Primitives | Complete | Codex | Shared primitives and local shadcn wrappers aligned to KAYOU |
| 03 - Home, Services, Categories | Complete | Codex | New `ProviderShowcaseCard`, polished home + category surfaces |
| 04 - Provider Profile | Complete | Codex | Profile body sections aligned to KAYOU section/chip system |
| 05 - Messages And Final Offer | Complete | Codex | Chat/final-offer clarity pass for web and mobile |
| 06 - Auth And Provider Onboarding | Ready | Unassigned | Auth/onboarding polish |
| 07 - Bookings And Provider Dashboard | Ready | Unassigned | Accepted-offer/job surfaces |
| 08 - Ops Admin, Settings, Error States | Ready | Unassigned | Full prototype Ops Admin and role-aware Settings replacement |
| 09 - Mobile Responsive QA | Ready | Unassigned | Viewport and launch UI QA |

## Decisions Log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-04-26 | Use prototype as visual reference only | Prototype includes old quote/request/payment flows that conflict with Kinshasa MVP |
| 2026-04-26 | Preserve chat final-offer flow as product truth | Matches current backend/web/mobile implementation and market simplicity |
| 2026-04-26 | Defer quote marketplace visuals as product flow | Useful UI pieces can be adapted into final offer composer later |
| 2026-04-26 | Keep cash-first payment language | Launch does not include online/mobile money payment |
| 2026-04-26 | Use prototype Ops Admin as replacement target | Admin is internal and should expose the operational dashboard from the new prototype |
| 2026-04-26 | Use prototype Settings as replacement target | Settings should follow the new prototype UI/IA even when some controls need disabled or coming-later states |
| 2026-04-26 | Keep client and provider Settings variants | Prototype has separate client/provider settings experiences and the app should render the right one per role |
| 2026-04-26 | Agents must inspect prototype HTML directly | Admin/settings implementation must be extracted from `/Users/alainmk/Downloads/KAYOU Prototype _standalone_.html`, not inferred from planning notes |

## Audit Inputs

Prototype screens identified:

- Auth
- Home
- Search
- Provider profile
- Booking
- My bookings
- Messages
- Review
- Provider dashboard
- Pro requests
- Quote compose
- Earnings
- Provider onboarding
- Verification
- Admin ops
- Notifications
- Settings
- Error states

MVP classification:

- Keep: home, search, provider cards/profile, chat shell, auth, basic onboarding, review display.
- Adapt: quote composer to final-offer composer, booking detail to accepted-final-offer job detail, provider dashboard to chats/offers/jobs.
- Discard for public launch: quote marketplace, request marketplace, competing providers, booking checkout, protected payment, public payouts, public disputes.
- Keep for internal admin: prototype Ops Admin, verification queue, moderation queues, support/issues, payment/refund/payout/dispute review sections.
- Later: rich notifications, advanced availability, public online/mobile payment.

## How Agents Should Update This File

For each completed workstream, add:

```md
## Workstream NN Evidence

Completed: YYYY-MM-DD

Changed files:

- `path/to/file`

Behavior implemented:

- ...

Commands run:

- `pnpm ...` - passed/failed

Manual checks:

- Route/view checked
- Viewport/device checked

Notes / decisions:

- ...

Prototype extraction evidence, when applicable:

- Prototype file inspected: `/Users/alainmk/Downloads/KAYOU Prototype _standalone_.html`
- Prototype screens/components used: `...`
- Prototype behavior intentionally adapted or rejected: `...`
```

## Workstream 01 Evidence

Completed: 2026-04-26

Changed files:

- `packages/ui/src/tokens.ts`
- `packages/ui/src/web/FeaturedProviderCard.tsx`
- `packages/ui/src/web/WideProviderCard.tsx`
- `packages/ui/src/web/NearbyCard.tsx`
- `packages/ui/src/web/CardSkeletons.tsx`
- `packages/ui/src/mobile/FeaturedProviderCard.tsx`
- `packages/ui/src/mobile/WideProviderCard.tsx`
- `packages/ui/src/mobile/NearbyCard.tsx`
- `packages/ui/src/mobile/CardSkeletons.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/design/page.tsx`
- `apps/web/src/app/design-system/page.tsx`
- `docs/DESIGN_SYSTEM.md`

Behavior implemented:

- Aligned canonical radius tokens to the standalone system: `sm=8`, `md=12`, `lg=20`, `xl=28`; kept `xxl=28` as a backward-compatible alias only.
- Updated web globals so Tailwind theme variables, `--k-*` variables, `.k-display-*`, `.k-body*`, `.k-price`, `.k-num`, `.k-btn`, `.k-input`, `.k-chip`, and `.k-card` follow the canonical token layer.
- Normalized shared UI card primitives and skeletons to use `radius.lg` for 20px content cards after `radius.xl` moved to 28px modal/sheet use.
- Fixed shimmer mismatch by defining global `kayu-shimmer` keyframes used by shared UI and by app skeleton utilities; the design route no longer imports local shimmer styles.
- Added `/design-system` as a reference route that renders the canonical design probe.
- Updated `docs/DESIGN_SYSTEM.md` so radius, shadow, surface, and Tailwind/globals guidance match the chosen standalone system.

Commands run:

- `pnpm --filter @kayu/ui type-check` - passed
- `pnpm --filter @kayu/ui build` - passed
- `pnpm --filter @kayu/web type-check` - passed
- `pnpm --filter @kayu/web build` - passed

Manual checks:

- `/design-system` present in the Next production build route list.
- Browser visual QA not run in this pass.

Notes / decisions:

- Product flow was not changed.
- `radius.xxl` remains exported for existing mobile/web consumers, but new code should use `radius.xl` for 28px sheet/modal corners.

## Workstream 02 Evidence

Completed: 2026-04-26

Changed files:

- `packages/ui/src/cards.ts`
- `packages/ui/src/index.ts`
- `packages/ui/src/web/Avatar.tsx`
- `packages/ui/src/web/EmptyState.tsx`
- `packages/ui/src/web/ErrorState.tsx`
- `packages/ui/src/web/FeaturedProviderCard.tsx`
- `packages/ui/src/web/Input.tsx`
- `packages/ui/src/web/InlineAlert.tsx`
- `packages/ui/src/web/KayouMoment.tsx`
- `packages/ui/src/web/StatCard.tsx`
- `packages/ui/src/web/Toast.tsx`
- `packages/ui/src/web/index.ts`
- `packages/ui/src/mobile/Avatar.tsx`
- `packages/ui/src/mobile/EmptyState.tsx`
- `packages/ui/src/mobile/ErrorState.tsx`
- `packages/ui/src/mobile/FeaturedProviderCard.tsx`
- `packages/ui/src/mobile/InlineAlert.tsx`
- `packages/ui/src/mobile/KayouMoment.tsx`
- `packages/ui/src/mobile/StatCard.tsx`
- `packages/ui/src/mobile/index.ts`
- `apps/web/src/app/messages/MessagesClient.tsx`
- `apps/web/src/components/ui/alert.tsx`
- `apps/web/src/components/ui/badge.tsx`
- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/card.tsx`
- `apps/web/src/components/ui/input.tsx`
- `apps/web/src/components/ui/skeleton.tsx`
- `apps/web/src/components/ui/textarea.tsx`

Behavior implemented:

- Added shared `formatMoneyFc` and switched shared provider-card price rendering plus chat final-offer price rendering to the shared FC formatter.
- Added exported `InlineAlert` primitives for web and mobile with KAYOU tinted surfaces, calm copy, icons, and optional action.
- Moved web empty/error/input/toast internals to the shared `I` icon layer where touched.
- Remapped local shadcn `Button`, `Card`, `Input`, `Badge`, `Skeleton`, `Alert`, and `Textarea` styles to KAYOU sizing, 12px control radius, 20px card radius, focus rings, token colors, and shimmer animation.
- Removed negative letter-spacing from shared web/mobile primitives touched in this pass.

Commands run:

- `pnpm --filter @kayu/ui type-check` - passed
- `pnpm --filter @kayu/ui build` - passed
- `pnpm --filter @kayu/web type-check` - passed

Manual checks:

- Code-level check that shared buttons retain icon slots and local shadcn buttons still size to 32/40/48px.
- Code-level check that shadcn skeleton now uses the global `animate-k-shimmer` helper.
- Browser visual QA not run in this pass.

Notes / decisions:

- Product flow was not changed.
- Existing Radix/shadcn wrappers remain in place; only their default visual mapping changed.
- Initial validation caught a mobile icon prop mismatch in the new inline alert and stale web declarations before the UI rebuild; both were fixed before the final passing runs above.

## Workstream 03 Evidence

Completed: 2026-04-26

Changed files:

- `packages/ui/src/web/ProviderShowcaseCard.tsx` (new)
- `packages/ui/src/web/index.ts`
- `apps/web/src/app/HomePageClient.tsx`
- `apps/web/src/app/categories/[slug]/CategoryPageClient.tsx`
- `apps/web/src/components/providers/index.ts`
- `apps/web/src/components/providers/ProviderCard.tsx` (deleted)
- `apps/web/src/app/design/page.tsx`

Behavior implemented:

- Added shared web `ProviderShowcaseCard` matching the standalone prototype: square pastel category icon tile (64px) on the left, name + verified + star rating header on the right, profession · city/commune line, `Réponse en ~Xmin` line, trust chips strip (`Expert`/`De confiance`, `N ans`, distance), optional italic testimonial in French quotes, and a footer row with `À partir de 15 000 FC/h` and a dark filled `Voir le profil` CTA pill. Optional `highlight` prop renders a thin top accent line for the first/featured card.
- Added `ProviderShowcaseCardSkeleton` mirroring the same anatomy for loading states.
- Extended `ProviderCardData` with optional `experienceYears` and `testimonial` fields, and mapped backend `experience` through `toProviderCardData`.
- Wired the home `Pros vérifiés à Kinshasa` grid to use `ProviderShowcaseCard` with the dark `Voir le profil` CTA, replacing `FeaturedProviderCard`. The first card sets `highlight` so it renders the thin blue top accent line from the prototype.
- Rewrote `CategoryPageClient` to drop the blue/violet gradient header, gradient subcategory tiles, and the legacy local `ProviderCard`, replacing them with KAYOU token-based surfaces, breadcrumb, header card, subcategory tiles, and `ProviderShowcaseCard` for the featured grid.
- Removed the unused legacy `apps/web/src/components/providers/ProviderCard.tsx` and pruned the providers barrel to keep `QueryProvider` only.
- Added a `ProviderShowcaseCard` showcase section (with skeleton row) at the top of the `D03 · Photo-forward cards` section in `/design-system`.
- Discovery routes preserved: `/`, `/services`, `/services?category=...`, `/categories/[slug]`, `/providers/[id]`. No quote/request/protected-payment behavior introduced; price renders via shared `formatHourly` so `15 000 FC/h` and `À partir de 15 000 FC/h` are consistent.

Commands run:

- `pnpm --filter @kayu/ui type-check` - passed
- `pnpm --filter @kayu/ui build` - passed
- `pnpm --filter @kayu/web type-check` - passed
- `pnpm --filter @kayu/web build` - passed

Manual checks:

- Production route list still includes `/`, `/services`, `/categories/[slug]`, `/design-system`.
- Browser visual QA at 320–390 px not run in this pass.

Notes / decisions:

- Kept `FeaturedProviderCard` (4:5) and `WideProviderCard` (search list) as-is; `ProviderShowcaseCard` is the new featured-grid card for home and category pages.
- `ServicesPageContent` already used the canonical `WideProviderCard` and design tokens, so no change was needed there for this pass.
- Kept the existing `/providers/[id]` route and product flow; only visual surfaces were touched.

## Workstream 04 Evidence

Completed: 2026-04-26

Changed files:

- `apps/web/src/components/provider-profile/ProviderSection.tsx` (new)
- `apps/web/src/components/provider-profile/ProviderAbout.tsx`
- `apps/web/src/components/provider-profile/ProviderSkills.tsx`
- `apps/web/src/components/provider-profile/ProviderCategories.tsx`
- `apps/web/src/components/provider-profile/ProviderCertifications.tsx`
- `apps/web/src/components/provider-profile/ProviderDiplomas.tsx`
- `apps/web/src/components/provider-profile/ProviderReviews.tsx`
- `apps/web/src/components/provider-profile/ProviderPortfolio.tsx`
- `apps/web/src/components/provider-profile/index.ts`

Behavior implemented:

- Added shared `ProviderSection` wrapper using KAYOU surface tokens (`--k-surface`, `--k-border`, `--k-r-lg`, `--k-e1`) with a `clamp(20px, 4vw, 28px)` padding and a `k-display-m` heading sized at 22px to mirror the standalone prototype's section anatomy. Optional caption subtitle and a trailing slot for inline controls.
- Refit `ProviderAbout` to lead with the bio in `k-body-l`, then surface profession, experience, and trades as `k-chip` / `k-chip-primary` tags inside the new section wrapper. Removed the shadcn `Card` shell and the embedded `Separator`.
- Refit `ProviderSkills` to render a flat strip of `k-chip` skills with a small per-chip level annotation. Expert/advanced skills upgrade to `k-chip-success` / `k-chip-primary` so the level data stays visible without the prior multi-row meter component.
- Refit `ProviderCategories` to drop dual shadcn `Card` shells: categories render as link chips and service zones group by city with `k-chip-primary` commune chips inside two stacked `ProviderSection` blocks.
- Refit `ProviderCertifications` and `ProviderDiplomas` to use the prototype's `CertRow` style — verified entries render against `--k-success-subtle` with a green icon and a green-tinted border, and status chips use `k-chip-success/warning/primary`. Document preview dialogs and rejection messaging are preserved; expired badges use `--k-danger-subtle` inline.
- Refit `ProviderReviews` to use the section wrapper, then a clean two-column overview (large average + 5/4/3/2/1 distribution bars), a color-coded dimension list (success / warning / danger by score) with horizontal progress bars matching the prototype `RatingsTab`, and lighter avatar+stars review cards. Sort select, pagination, and provider reply blocks are preserved.
- Refit `ProviderPortfolio` to use the section wrapper with the projects/gallery tab toggle moved into the section's trailing slot. Replaced raw Tailwind color utilities (amber/blue/green/purple/indigo) on image-type chips with KAYOU `k-chip` variants (`success`/`warning`/`primary`/`expert`/`accent`) and re-tokenised the project card surfaces. Lightbox and Avant/Après dialogs preserved.
- Preserved the launch flow: visibility gates (`showHourlyRate`, `showPastWork`, `showCertifications`, `showReviews`, `showAvailability`, `showEmail`, `showPhone`, `showExactLocation`, `allowMessages`) and the `hasAccess` access wall in `ProviderProfileClient` are untouched. Booking still routes to `/book/[id]`, `ContactDialog` is the messaging path, and the mobile sticky bar copy "Discussion puis offre finale" stays for unset rates so chat-first / final-offer remains the conversational frame. No "Devis", "Paiement sécurisé", "Remboursement", or "Mobile Money" copy added; "Paiement en espèces à la fin de la mission" is still surfaced on the desktop rail.

Commands run:

- `pnpm --filter @kayu/web type-check` - passed
- `pnpm --filter @kayu/web build` - passed (Next 16.2.3 / Turbopack), `/providers/[id]` present in dynamic route list

Manual checks:

- Code-level confirmation that `ProviderProfileClient` still injects `visibleProvider` (gated data) into every refit section component, and that the loading skeletons (`ProviderAboutSkeleton`, etc.) still resolve from the index barrel.
- Browser visual QA at 390px viewport not run in this pass.

Notes / decisions:

- Did not introduce a `k-chip-danger` class; expired/danger pill uses inline `--k-danger-subtle` / `--k-danger` until that variant is added to the design system.
- Replaced shadcn `Progress` and `CardHeader/CardTitle` usage in this surface with token-driven primitives so the body matches the prototype's flat-section hierarchy. Section heading copy stays in French and matches existing UX vocabulary.
- Did not touch `ProviderHeader`, `BookingForm`, or `ContactDialog`; the contract calls those out as already-aligned or owned by the launch booking/contact flow.
- Did not copy any prototype data, identifiers, or "/pros/jean-mubake" content per the contract — only the visual hierarchy.

## Workstream 05 Evidence

Completed: 2026-04-26

Changed files:

- `apps/web/src/app/messages/MessagesClient.tsx`
- `apps/web/src/app/globals.css`
- `apps/mobile/src/screens/messages/ChatScreen.tsx`
- `docs/prototype-ui-migration/PROGRESS.md`

Behavior implemented:

- Web messages now use a responsive shell: desktop keeps the split inbox/thread layout, while mobile shows the inbox first and opens a single thread with a visible back control.
- Provider final-offer CTAs stay visible in the conversation header on web and above the composer on mobile; new conversations still require an actual conversation before an offer can be created.
- Final-offer cards now foreground `Offre finale`, status, `Prix convenu`, date/time, duration, address, and `Paiement en espèces à la fin de la mission.`
- Mobile now renders pending, accepted, and declined final offers in the thread instead of only the pending offer.
- Final-offer composer copy was simplified around the agreement discussed in chat, with no line-item quote builder, commission, payout, or online payment UI added.

Commands run:

- `pnpm --filter @kayu/web type-check` - passed
- `pnpm --filter @kayu/mobile type-check` - passed
- `pnpm --filter @kayu/web build` - passed
- `curl -I --max-time 8 http://localhost:3000/messages` - passed, existing Next dev server returned 200

Manual checks:

- Code-level check for client conversation with no final offer, provider final-offer CTA, pending final offer, accepted final offer, and declined final offer states in web/mobile message surfaces.
- Responsive code-level check that `/messages` uses desktop split layout above 768px and list-first/thread-after-selection behavior at 390px mobile web.
- Local route check confirmed `/messages` responds on the existing web dev server at `http://localhost:3000/messages`.
- Search check confirmed touched message surfaces do not contain `devis`, protected-payment, mobile-money, commission, payout, or refund wording.

Notes / decisions:

- Product flow remains chat-first: final offers are created and acted on inside the conversation.
- Cash wording remains visible wherever the final offer mentions payment.

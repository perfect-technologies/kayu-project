# Remove Trade Taxonomy Plan

## Goal

Delete the `Trade` and `ProviderTrade` layer immediately and make the product taxonomy use only:

- `Category`
- `Subcategory`
- provider free-form `Skill`

The app should not expose or depend on a third taxonomy level called `Trade`, `Métier`, or provider trade assignment.

## Product Decision

For v1, `Category` and `Subcategory` are sufficient.

Examples:

- Category: `Maison`
- Subcategory: `Plomberie`
- Provider skills: `Fuites`, `Chauffe-eau`, `Installation lavabo`

Do not model those skills as taxonomy rows. They should remain provider-entered skills or predefined UI suggestions.

## Required Data Model Change

Do not simply delete `Trade` without replacing provider subcategory assignment.

Today, provider subcategory selection is persisted indirectly through `ProviderTrade -> Trade -> Subcategory`. If `Trade` is deleted, we need a direct join table:

```prisma
model ProviderSubcategory {
  id            String      @id @default(cuid())
  providerId    String
  provider      Provider    @relation(fields: [providerId], references: [id], onDelete: Cascade)
  subcategoryId String
  subcategory   Subcategory @relation(fields: [subcategoryId], references: [id], onDelete: Cascade)
  isPrimary     Boolean     @default(false)
  experience    Int?
  createdAt     DateTime    @default(now())

  @@unique([providerId, subcategoryId])
  @@index([providerId])
  @@index([subcategoryId])
}
```

Then remove:

- `model Trade`
- `model ProviderTrade`
- `Subcategory.trades`
- `Provider.trades`
- all `tradeId`, `tradeIds`, `primaryTradeId`, `ProviderTradeSchema`, `TradeSchema` API surface.

## Backend Scope

Update these areas:

- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/seed-categories.ts`
- `apps/backend/prisma/seed-demo.ts`
- `apps/backend/src/modules/categories/categories.service.ts`
- `apps/backend/src/modules/providers/providers.service.ts`
- `apps/backend/src/modules/onboarding/onboarding.service.ts`
- `apps/backend/src/modules/identity/*`
- related backend specs and launch harness fixtures

### Onboarding

Current behavior:

- UI collects `subcategoryIds`.
- Backend resolves selected subcategories into all matching `Trade` rows.
- Backend writes `ProviderTrade`.

Target behavior:

- UI still collects `subcategoryIds`.
- Backend validates those `Subcategory` rows directly.
- Backend writes `ProviderSubcategory`.
- Provider skills stay in `Skill`.

### Provider Search

Current behavior may filter subcategory matches via provider trades.

Target behavior:

- Category filter uses `ProviderCategory`.
- Subcategory filter uses `ProviderSubcategory`.
- Search response can include selected subcategories directly.
- Remove all `tradeIds` search/update params.

### Categories API

Current hierarchy may return:

```text
categories -> subcategories -> trades
```

Target hierarchy:

```text
categories -> subcategories
```

If the frontend still needs service examples, use static skill suggestions or `Service` rows, not `Trade`.

## Schema/API Scope

Update `packages/schemas/src/*`:

- Remove `TradeSchema`.
- Remove `ProviderTradeSchema`.
- Add `ProviderSubcategorySchema` if provider details expose selected subcategories.
- Remove `tradeIds` and `primaryTradeId` from provider create/update DTOs.
- Keep `subcategoryIds` in onboarding draft DTO.
- Update `CategoryHierarchySchema` so subcategories do not contain `trades`.

Update `packages/api` only if endpoint types break.

## Seed Data Scope

Revise seed data so it creates:

- categories
- subcategories
- services if still useful
- provider categories
- provider subcategories
- provider skills

Remove trade seed creation and any provider trade assignment.

If a trade currently contains useful copy, move it to one of these:

- `Subcategory.name`
- `Subcategory.description`
- `Service.name`
- `Service.description`
- skill suggestion arrays in web/mobile onboarding

Do not create a replacement table that is just `Trade` with another name.

## UI Scope

Search for and remove user-facing `trade`/`métier` concepts where they refer to the deleted model.

Likely files:

- `apps/web/src/app/pro/onboarding/*`
- `apps/mobile/src/screens/pro/ProviderOnboardingScreen.tsx`
- `apps/web/src/components/provider-profile/ProviderAbout.tsx`
- `apps/web/src/app/providers/[id]/*`
- `apps/mobile/src/screens/search/*`
- shared provider card/adapters

Target UI language:

- `Catégories`
- `Sous-catégories`
- `Compétences`

Avoid:

- `Métiers` as a third taxonomy level
- `Trade`
- `tradeIds`

## Suggested Implementation Order

1. Update Prisma schema:
   - add `ProviderSubcategory`
   - remove `Trade` and `ProviderTrade`
   - wire `Provider.subcategories` and `Subcategory.providers`
2. Run Prisma format/validate/generate.
3. Update shared schemas and DTOs.
4. Update backend onboarding publish/draft mapping.
5. Update provider update/search/detail mapping.
6. Update categories hierarchy service.
7. Update seed scripts.
8. Update web/mobile UI/adapters.
9. Update backend tests and launch harness fixtures.
10. Run full checks.

## Migration/Persistence Note

This is a destructive schema change.

If preserving existing local data matters, migrate provider trade assignments before dropping:

```text
ProviderTrade.trade.subcategoryId -> ProviderSubcategory.subcategoryId
```

For current local/dev seed-first workflow, acceptable path is:

1. change schema,
2. update seeds,
3. run `prisma db push` or reset local DB if needed,
4. reseed.

Record the exact command used in `PROGRESS.md`.

## Required Search Terms

Before marking done, search the repo for:

- `model Trade`
- `model ProviderTrade`
- `TradeSchema`
- `ProviderTradeSchema`
- `tradeIds`
- `primaryTradeId`
- `providerTrade`
- `ProviderTrade`
- `.trades`
- `trades:`
- `Métiers`
- `métier`

Any remaining occurrences must be justified as historical docs or renamed.

## Required Commands

Run at minimum:

```bash
pnpm --filter @kayu/backend exec prisma format
pnpm --filter @kayu/backend exec prisma validate
pnpm --filter @kayu/backend exec prisma generate
pnpm --filter @kayu/schemas type-check
pnpm --filter @kayu/schemas build
pnpm --filter @kayu/api type-check
pnpm --filter @kayu/api build
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/backend test:onboarding
pnpm --filter @kayu/backend test:launch
pnpm --filter @kayu/web type-check
pnpm --filter @kayu/mobile type-check
```

If seeds are changed, also run the seed/reset flow appropriate for the local DB and record it.

## Acceptance Criteria

- `Trade` and `ProviderTrade` no longer exist in Prisma schema.
- Provider subcategory selections persist without `Trade`.
- Category hierarchy no longer returns nested trades.
- Provider detail/search still expose category/subcategory context.
- Onboarding still allows category + subcategory + skill selection.
- Provider search by category/subcategory still works.
- Seed data no longer creates trades.
- Web/mobile type-checks pass.
- Backend launch tests pass.
- Any DB push/reset/reseed command is recorded.

## Agent Prompt

```text
You are removing the Trade taxonomy layer from KAYOU v1.

Read:
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/00-product-contract.md
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/PROGRESS.md
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/09-remove-trade-taxonomy-plan.md

Goal:
Delete Trade and ProviderTrade immediately. Replace provider-to-trade assignment with direct provider-to-subcategory assignment. Update Prisma schema, seeds, backend services, shared schemas, web/mobile UI, and tests. The product taxonomy should be Category + Subcategory + provider Skills only.

Do not leave launch-facing UI depending on Trade or a third taxonomy level.

When done:
- update PROGRESS.md with changed files, migration/seed commands, tests, and any remaining compatibility notes.
- report any remaining `trade` references and why they remain.
```

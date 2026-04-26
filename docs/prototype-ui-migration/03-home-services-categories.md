# 03 - Home, Services, Categories

## Status

Ready after reading `00`.

## Goal

Apply prototype visual polish to discovery without changing the current discovery routes or API-backed data flow.

## Owns

- `apps/web/src/app/HomePageClient.tsx`
- `apps/web/src/app/services/ServicesPageContent.tsx`
- `apps/web/src/app/categories/[slug]/CategoryPageClient.tsx`
- `apps/web/src/components/providers/ProviderCard.tsx`
- `apps/web/src/components/services/ServiceCard.tsx`
- shared card components only if a small reusable change is needed

## Keep Current Flow

- Current route `/`
- Current route `/services`
- Current route `/categories/[slug]`
- Current provider profile route `/providers/[id]`
- Current category/subcategory filtering behavior
- Current launch flags

Do not rename routes to prototype `/pros`.

## Prototype Inputs

Borrow:

- Warm hero composition
- Proof cluster / trust signal rhythm
- Category tiles and strips
- Compact sticky search
- Provider card anatomy
- Desktop search: filters left, results center, optional map/right panel
- Mobile search: sticky search pill, horizontal categories, filter sheet

## Tasks

1. Remove legacy generic gradients and black image overlays from discovery surfaces unless they match the design system exception.
2. Normalize provider cards to KAYOU card anatomy.
3. Make category page stop reading like an old blue-gradient page.
4. Ensure money appears as `15 000 FC/h` or `À partir de 15 000 FC/h`.
5. Ensure search works at 320-390px width.
6. Keep map/distance claims truthful. If data is fake or unavailable, hide the claim.

## Do Not

- Do not add job request creation from search.
- Do not add quote comparison.
- Do not introduce protected payment copy.
- Do not add fake map/provider coordinate data.

## Validation

Run:

```bash
pnpm --filter @kayu/web type-check
pnpm --filter @kayu/web build
```

Manual routes:

- `/`
- `/services`
- `/services?category=plomberie`
- `/categories/plomberie`
- mobile viewport 390px


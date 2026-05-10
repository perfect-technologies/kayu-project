# Remove Service Catalog Table Plan

## Goal

Delete the `Service` catalog table for v1 and keep the product taxonomy limited to:

- `Category`
- `Subcategory`
- provider free-form `Skill`

The app can still use the word "service" in the product and UI, but it should not depend on a database catalog row named `Service`.

## Product Decision

For v1, a provider should not be matched, priced, or booked through a fixed service catalog item.

Current product direction:

- Providers choose categories and subcategories.
- Providers set their own fixed starting price.
- Concrete work details are agreed in chat.
- The final offer documents the agreed title, description, price, and timing.

That means `Service.basePrice` and `Service.duration` are not reliable source-of-truth fields anymore. They can accidentally bring back catalog pricing, which conflicts with the fixed "starting from" provider-price model.

## Current Problem

`Service` currently acts as a fourth taxonomy layer:

```text
Category -> Subcategory -> Service
```

The schema currently allows:

```text
Booking.serviceId -> Service.id
```

Seed data also uses services to:

- derive provider categories and subcategories,
- choose demo booking titles and prices,
- create fixed catalog base prices and durations.

For v1, this is too much structure. It duplicates the new simplified model and creates confusion with provider-specific pricing.

## Target Model

Keep structured taxonomy here:

```text
Category -> Subcategory
```

Keep provider-specific capability here:

```text
Provider -> Skill
Provider -> ProviderCategory
Provider -> ProviderSubcategory
Provider.hourlyRate
```

Note: `Provider.hourlyRate` is already being treated as fixed starting price for v1. Do not reintroduce hourly semantics while removing `Service`.

Keep booking-specific work context directly on booking/final offer:

```text
Booking.title
Booking.description
Booking.duration
Booking.price
FinalOffer.title
FinalOffer.description
FinalOffer.price
```

Optional: if reporting/filtering needs structured booking taxonomy, add nullable `categoryId` and/or `subcategoryId` to `Booking`. Do this only if existing flows need it. Otherwise, keep bookings tied to provider + title/description for v1.

## Required Data Model Change

Remove from Prisma:

- `model Service`
- `Category.services`
- `Subcategory.services`
- `Booking.serviceId`
- `Booking.service`
- any relation from `Service` to `Booking`

Do not remove similarly named Nest/React service classes. This plan is only about the Prisma `Service` catalog model.

Do not remove:

- `ServiceZone`
- `BookingsService`
- `CategoriesService`
- `ProvidersService`
- any normal application service class

## Backend Scope

Update these areas:

- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/seed-categories.ts`
- `apps/backend/prisma/seed-demo.ts`
- `apps/backend/prisma/seed.ts`
- `apps/backend/src/modules/bookings/bookings.service.ts`
- `apps/backend/src/modules/dashboard/dashboard.service.ts`
- `apps/backend/src/modules/reviews/reviews.service.ts`
- `apps/backend/src/modules/earnings/earnings.service.ts`
- `apps/backend/src/modules/quotes/quotes.service.ts`
- `apps/backend/src/modules/admin/admin.service.ts`
- `apps/backend/src/test/launch/launch-critical.harness.spec.ts`
- related backend specs that create or assert `serviceId`

### Booking Mapping

Current behavior may include:

```text
booking.serviceId
booking.service.name
```

Target behavior:

```text
booking.title
booking.description
booking.duration
booking.price
```

If a response currently needs a display label, use:

1. `booking.title`
2. final offer title, if applicable and available
3. provider profession as fallback

Do not replace `Service` with another catalog table for v1.

### Reviews, Dashboard, Earnings, Admin

Anywhere a query includes:

```ts
service: {
  select: { id: true, name: true }
}
```

remove that include and map labels from booking fields instead.

Dashboard cards and review cards should not need `service.name`; `booking.title` is enough.

### Quotes

Quote-related code may copy `booking.serviceId` into quote/final-offer context. Remove this dependency. For v1, quote/final-offer context should be title, description, price, and booking id.

## Schema/API Scope

Update `packages/schemas/src/*`:

- Remove `ServiceSchema`.
- Remove `BookingSchema.serviceId`.
- Remove `BookingSchema.service`.
- Remove DTO fields that accept or return `serviceId`.
- Ensure booking/final-offer schemas expose enough title/description/price fields for the UI.

Update `packages/api` only if generated or endpoint types break.

## Seed Data Scope

Revise seed data so it creates:

- categories
- subcategories
- provider categories
- provider subcategories
- provider skills
- bookings with direct title, description, duration, and price

Remove:

- service catalog arrays under subcategories,
- `prisma.service.create`,
- `prisma.service.findMany`,
- `prisma.service.deleteMany`,
- demo provider `serviceSlugs`,
- booking `serviceId`,
- booking prices derived from `service.basePrice`,
- booking duration derived from `service.duration`.

If a service name is useful as demo copy, move it to one of these:

- `Subcategory.description`
- provider `Skill.name`
- static onboarding skill suggestions
- demo `Booking.title`

Example seed conversion:

```text
Old:
Subcategory: Plomberie
Service: Reparation fuite, basePrice 25000

New:
Subcategory: Plomberie
Provider skill: Reparation fuite
Provider starting price: 25000
Booking title: Reparation fuite
Booking price: agreed demo price
```

## UI Scope

Do not remove the `/services` route just because the `Service` table is deleted. In the app, `/services` means "find providers/services" and can stay.

Remove UI assumptions that a user chooses a database `Service` row.

Likely files:

- `apps/web/src/app/services/ServicesPageContent.tsx`
- `apps/web/src/app/book/[providerId]/BookingFlowClient.tsx`
- `apps/web/src/components/provider-profile/BookingForm.tsx`
- `apps/web/src/components/bookings/FinalOfferDialog.tsx`
- `apps/mobile/src/screens/booking/BookingScreen.tsx`
- `apps/mobile/src/components/bookings/FinalOfferFormCard.tsx`
- `apps/mobile/src/screens/messages/ChatScreen.tsx`
- shared booking/request/provider adapters

Target UI behavior:

- Client can describe the requested work in free text.
- Provider profile/search is organized by category, subcategory, skills, and starting price.
- Final offer uses a free-form title and description, not a catalog service id.
- Booking cards display booking title or final offer title.

Avoid:

- required service catalog dropdowns backed by `Service.id`,
- `serviceId` in request payloads,
- catalog base prices as authoritative prices.

## Suggested Implementation Order

1. Update Prisma schema:
   - remove `Service`
   - remove `Category.services`
   - remove `Subcategory.services`
   - remove `Booking.serviceId` and `Booking.service`
2. Run Prisma format/validate/generate.
3. Update shared schemas and DTOs.
4. Update backend booking/dashboard/review/admin/earnings/quote mappings.
5. Update seed category data to stop creating services.
6. Update demo seed providers/bookings to use subcategories, skills, and direct booking fields.
7. Update web/mobile payloads and display labels.
8. Update backend tests and launch harness fixtures.
9. Run full checks.

## Migration/Persistence Note

This is a destructive schema change.

If preserving existing booking display data matters, keep the human-readable service name before dropping:

```text
Booking.service.name -> Booking.title, only where Booking.title is empty or generic
```

For the current local/dev seed-first workflow, acceptable path is:

1. change schema,
2. update seeds,
3. run `prisma db push` or reset local DB if needed,
4. reseed.

Record the exact command used in `PROGRESS.md`.

## Required Search Terms

Use scoped searches so normal application service classes do not create noise.

Prisma/catalog searches:

- `model Service`
- `prisma.service`
- `serviceId`
- `ServiceSchema`
- `BookingSchema.*service`
- `services:`
- `.services`

Important false positives to keep:

- `ServiceZone`
- `BookingsService`
- `CategoriesService`
- `ProvidersService`
- route/path `/services`
- user-facing generic word "service"

Any remaining `serviceId` should be justified. Ideally none remain in product API payloads after this work.

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

- `Service` no longer exists in Prisma schema.
- `Booking` no longer has `serviceId` or `service`.
- Seed data no longer creates, reads, deletes, or counts services.
- Provider seed data uses subcategories and skills instead of service slugs.
- Booking seed data uses direct title, description, duration, and price.
- API schemas no longer expose `ServiceSchema`, `booking.serviceId`, or `booking.service`.
- Backend booking/dashboard/review/admin responses still have a usable display title.
- Web/mobile flows do not require a service catalog id.
- The `/services` route still works as provider discovery.
- Web/mobile type-checks pass.
- Backend launch tests pass.
- Any DB push/reset/reseed command is recorded.

## Agent Prompt

Implement the v1 removal of the Prisma `Service` catalog table using this plan. Keep the public product language "service" and the `/services` route where appropriate, but delete the database-backed service catalog model and all `serviceId` API dependencies. Do not delete `ServiceZone` or application service classes such as `BookingsService`. Revise seed data so providers are assigned through categories/subcategories/skills and bookings carry direct title, description, duration, and price. Update shared schemas, backend mappings, UI payloads/display labels, tests, and launch harness fixtures. Run the required checks and record any DB reset/reseed command in `docs/v1-launch-alignment/PROGRESS.md`.

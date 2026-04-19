# Client Flow Audit

## Client Signup And Login

Expected:

1. User selects client signup.
2. User verifies phone OTP.
3. App stores session token.
4. App creates/loads local user.
5. App sets role to `CLIENT`.
6. App collects name/city.
7. User lands in client tabs.

Current issues:

- New local users default to `CLIENT`, so the app treats "role exists" as "role was chosen". This is survivable for client signup, but it breaks provider signup.
- `completeProfile` mobile payload still includes `role`, but backend validation omits role. This is harmless due to the cast, but misleading.
- Phone validation assumes 9 digits for both RDC and Congo-Brazzaville. Congo-B numbers in examples may include leading `06`, which can be 9 digits after country code depending on format, but this needs real telecom validation.
- No explicit profile-completion gate in navigation. Returning clients missing names are handled in auth flow, but profile-complete state is not a global route guard.

Fixes:

- Treat role selection as explicit state, not inferred from backend default.
- Add a `roleSelectedAt` or default backend role of `null` if product allows it, or always call `setRole` during signup.
- Add E2E tests for new client OTP signup and returning client login.

## Home And Discovery

Expected:

1. Client sees categories and featured/top providers.
2. Client can filter by category, city/zone, availability, verified status, rating, price, and distance.
3. Client can switch to map and see providers geographically.

Current issues:

- Search only sends category to backend in `SearchScreen`; availability/verified/topRated are client-side refinements over the current page only.
- Expert and distance filters are placeholders.
- Map view is a placeholder with "Carte bientot disponible".
- Search query text and sort UI are not wired to backend.
- City is hardcoded in the query caption as Kinshasa.
- Backend provider search loads all matching providers then filters/sorts/paginates in memory, which will not scale.

Fixes:

- Wire search text, city, verified, available, min/max price, min rating to backend query params.
- Implement distance filtering with user location and provider/service zone coordinates or remove it from launch UI.
- Implement a real map or hide the map toggle before launch.
- Move provider search sorting/pagination into database queries where possible.

## Provider Profile

Expected:

1. Client sees reliable provider identity, verification, skills, zones, portfolio, reviews, availability, price.
2. Client can favorite, message, or book.
3. Hidden fields respect provider privacy settings.

Current issues:

- Provider profile can navigate to chat without an existing `conversationId`; sending works server-side but the UI does not show the first message.
- Booking CTA starts direct booking but success screen points to review instead of booking detail.
- Certification/profile trust display depends on fields that may be missing for newly published providers.
- Portfolio upload/management is absent for providers, so live providers cannot build the profile richness shown in seed data.
- Phone button in booking detail/profile areas is mostly visual; direct contact settings are not enforced.

Fixes:

- After first message send, store returned conversation id and refetch/render messages.
- Booking success should go to booking detail or bookings list, not review.
- Add provider profile completeness UI for providers to manage portfolio/certifications before relying on these sections for clients.

## Direct Booking Creation

Expected:

1. Client selects service, duration, date/time, address, note.
2. Backend creates `PENDING` booking.
3. Client sees confirmation and booking detail.
4. Provider is notified and can accept/decline.

Current bugs:

- Mobile expects `result.id`, but backend returns `result.booking.id`.
- Booking success calls `onViewBooking` but actually navigates to `Review` with `createdBookingId`.
- Review cannot succeed because booking is `PENDING`, not `COMPLETED`.
- Booking date picker uses fixed day numbers and static availability; no provider availability or current month handling.
- Address has no geocoding or map confirmation.
- Price uses hourly rate * duration, but UI displays extra fee/grand total while backend stores only base provider price. Client sees a different total than the saved booking price.

Fixes:

- Use `result.booking.id`.
- Success CTA should navigate to `Bookings -> BookingDetail`.
- Add `View request` and `Message provider`, not review.
- Store the same total the client confirmed, including platform/service fee if applicable, or clearly separate estimate vs fee.
- Add validation for future scheduled date, address, and provider availability.

## Client Booking Management

Expected:

1. Client sees pending/upcoming/active/completed/cancelled bookings.
2. Client can message provider.
3. Client can cancel within policy.
4. Client can review after completion.
5. Client can see quote/invoice/payment state accurately.

Current issues:

- Pending and confirmed bookings are both shown as "upcoming"; this is okay visually, but the user cannot see whether provider accepted unless detail status/timeline is clear.
- Detail timeline labels say "Devis accepte" even direct bookings may not have quotes.
- Detail quote section shows fake fallback line items when no quote exists.
- `reviewed` is not returned by backend; mobile checks `booking.reviewed`, so review state is wrong.
- There is no client payment confirmation or receipt.
- Booking detail message target is provider for clients, which is correct, but missing conversation bootstrap still affects first message.

Fixes:

- Add explicit pending/accepted labels.
- Hide quote breakdown when no quote exists; show saved booking estimate instead.
- Use `booking.review` to derive reviewed state or add a backend `reviewed` boolean.
- Add payment method/status UI only after payment flow exists.

## Client Job Request And Quote Flow

Expected for a Thumbtack-style marketplace:

1. Client describes the job once.
2. Providers compete with quotes.
3. Client compares quotes.
4. Client accepts one quote.
5. Booking is created automatically.

Current state:

- Backend supports client job request creation and quote acceptance APIs.
- Mobile has no client screen to create job requests.
- Mobile has no client screen to list quotes for a request.
- Mobile has no client quote detail or accept/decline CTA.

Launch choice:

- Either implement this client flow fully, or hide provider Requests/Quote features and launch with direct provider booking only.

## Client Review Flow

Expected:

1. Review CTA appears only for completed own bookings without review.
2. User rates dimensions, adds tags/comment/photos.
3. Backend stores structured tags/photos or UI hides unsupported features.
4. After submit, booking detail/list reflect reviewed state.

Current issues:

- Review CTA can appear incorrectly because mobile checks missing `reviewed`.
- Tags are appended into comment text instead of `satisfactionTags`.
- Photo count is appended into comment; there is no upload/storage/model support.
- After review success, navigation returns home, not booking detail; this can be okay but should be a deliberate flow.

Fixes:

- Add `reviewed` boolean or use `booking.review`.
- Add structured tags field to DTO/mobile or remove tags.
- Remove photos from review UI until upload/storage exists.


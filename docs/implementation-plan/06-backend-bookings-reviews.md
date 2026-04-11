# 06 — Backend: Bookings, Reviews & Trust

## Goal

Migrate the booking lifecycle, review system (bidirectional: client→provider and provider→client), and trust scoring/badge system from Next.js API routes to NestJS modules.

## Why It Matters

Bookings are the core transaction of the marketplace — a client requests a service, the provider confirms, delivers, and the client reviews. The trust system (scores + badges) is what differentiates reliable providers and builds marketplace credibility. These features are tightly coupled: reviews can only be left after completed bookings, and trust scores are calculated from review data.

## Scope

### In Scope
- `BookingsModule` with controller and service
- `ReviewsModule` with controller and service
- Endpoints:
  - `GET /api/bookings` — list bookings (role-aware: client sees their bookings, provider sees theirs)
  - `POST /api/bookings` — create a new booking
  - `GET /api/bookings/:id` — booking detail
  - `PATCH /api/bookings/:id` — update booking status (confirm, start, complete, cancel)
  - `DELETE /api/bookings/:id` — cancel a booking
  - `GET /api/reviews` — list reviews (public, filterable by provider)
  - `POST /api/reviews` — create a review (client→provider, after completed booking)
- Booking status lifecycle: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED / CANCELLED
- Review creation triggers provider stats update (rating, totalReviews)
- Notification creation on booking status changes and new reviews
- Trust score recalculation on review creation (rating averages)
- Badge assignment based on provider performance

### Out Of Scope
- Client reviews (provider→client) — the model exists but the current API doesn't actively use it
- Payment processing
- Real-time notifications (polling is acceptable)
- Booking calendar/scheduling conflicts

## API Endpoints

### `GET /api/bookings`

**Auth required**

**Query params:**
- `status` — filter by booking status
- `role` — `client` or `provider` (determines which bookings to show)
- `page` / `limit` — pagination

**Response:**
```
{
  success: true,
  bookings: BookingSchema[],
  pagination: { page, limit, total, totalPages }
}
```

**Logic:**
1. If role=client or user is CLIENT: filter by `clientId = currentUser.id`
2. If role=provider or user is PROVIDER: filter by `providerId = currentUser.provider.id`
3. If ADMIN: show all
4. Include client and provider user info
5. Apply status filter and pagination

### `POST /api/bookings`

**Auth required (CLIENT)**

**Request body** (validated with `CreateBookingDto`):
```
{
  providerId: string
  title: string
  description?: string
  address?: string
  city?: string
  scheduledDate?: string (ISO date)
  duration?: number (minutes)
  price?: number
  clientNotes?: string
}
```

**Response:** `{ success: true, booking: BookingSchema }`

**Logic:**
1. Validate provider exists and is available
2. Create booking with status PENDING
3. Create notification for the provider (type: BOOKING_NEW)
4. Return booking

### `GET /api/bookings/:id`

**Auth required (booking owner, provider, or admin)**

**Response:** Full booking detail with service info, review if exists.

### `PATCH /api/bookings/:id`

**Auth required**

**Request body** (validated with `UpdateBookingDto`):
```
{
  status?: BookingStatus
  cancelReason?: string
  providerNotes?: string
}
```

**Logic:**
1. Validate status transition is valid:
   - Provider can: PENDING → CONFIRMED, CONFIRMED → IN_PROGRESS, IN_PROGRESS → COMPLETED
   - Both can: PENDING/CONFIRMED → CANCELLED
2. Update booking with appropriate timestamps (confirmedAt, startedAt, completedAt, cancelledAt)
3. If COMPLETED: increment provider's `totalJobs`
4. Create notification for the other party
5. Return updated booking

### `DELETE /api/bookings/:id`

**Auth required (booking owner or admin)**

Sets status to CANCELLED. Only allowed for PENDING or CONFIRMED bookings.

### `GET /api/reviews`

**Public (no auth required)**

**Query params:**
- `providerId` — filter by provider (required for public access)
- `page` / `limit` — pagination
- `sortBy` — `recent`, `highest`, `lowest`

**Response:**
```
{
  success: true,
  reviews: ReviewSchema[],
  pagination: { page, limit, total, totalPages }
}
```

### `POST /api/reviews`

**Auth required (CLIENT)**

**Request body** (validated with `CreateReviewDto`):
```
{
  bookingId: string
  providerId: string
  rating: number (1-5)
  punctuality: number (1-5)
  quality: number (1-5)
  communication: number (1-5)
  value: number (1-5)
  comment?: string
  isPublic?: boolean (default true)
}
```

**Logic:**
1. Validate booking exists, is COMPLETED, and belongs to the current user
2. Validate no duplicate review for this booking
3. Calculate `overallScore` = average of (punctuality, quality, communication, value)
4. Create review
5. Update provider stats: recalculate `rating` (average of all review overallScores), increment `totalReviews`
6. Create notification for provider (type: NEW_REVIEW)
7. Optionally update trust score

## Booking Status Lifecycle

```
PENDING ──→ CONFIRMED ──→ IN_PROGRESS ──→ COMPLETED
   │            │                              ↓
   └──→ CANCELLED ←──┘                    (review possible)
```

Valid transitions:
- `PENDING → CONFIRMED` (provider confirms)
- `CONFIRMED → IN_PROGRESS` (provider starts work)
- `IN_PROGRESS → COMPLETED` (provider finishes)
- `PENDING → CANCELLED` (either party)
- `CONFIRMED → CANCELLED` (either party)

## Trust Score Calculation

When a review is created:
1. Fetch all reviews for the provider
2. Calculate averages: reliability (punctuality avg), quality avg, communication avg, professionalism (value avg)
3. Calculate `overallScore` = weighted average (0-100 scale)
4. Determine `trustLevel` based on overallScore and completedJobs:
   - NEWCOMER: < 5 jobs
   - ESTABLISHED: 5+ jobs, score ≥ 50
   - TRUSTED: 15+ jobs, score ≥ 70
   - EXPERT: 30+ jobs, score ≥ 80
   - TOP_RATED: 50+ jobs, score ≥ 90

## Badge Assignment

After trust score update, check for badge eligibility:
- `PUNCTUAL`: avg punctuality ≥ 4.5 with 10+ reviews
- `QUALITY_WORK`: avg quality ≥ 4.5 with 10+ reviews
- `GREAT_COMMUNICATOR`: avg communication ≥ 4.5 with 10+ reviews
- `FAST_RESPONSE`: avg responseTime ≤ 30 minutes
- `CLIENT_FAVORITE`: 5+ favorites
- `REPEAT_CLIENTS`: 3+ repeat clients

## Module Structure

```
apps/backend/src/modules/
├── bookings/
│   ├── bookings.module.ts
│   ├── bookings.controller.ts
│   └── bookings.service.ts
└── reviews/
    ├── reviews.module.ts
    ├── reviews.controller.ts
    └── reviews.service.ts
```

## Dependencies

- **Depends on:** Chunk 02 (schemas), Chunk 03 (Prisma, guards), Chunk 04 (auth), Chunk 05 (providers must exist)
- **Required by:** Chunk 08 (admin review moderation), Chunk 10 (web booking/review UI), Chunk 12 (mobile booking flow)

## Acceptance Criteria

1. Booking CRUD works with proper status lifecycle
2. Invalid status transitions are rejected (e.g., COMPLETED → PENDING)
3. Only the booking's client/provider can access it (plus admin)
4. Reviews can only be created for completed bookings by the booking's client
5. Duplicate reviews for the same booking are rejected
6. Provider rating is recalculated when a review is created
7. Provider totalJobs incremented on booking completion
8. Notifications created for status changes and new reviews
9. Trust scores and badges updated after review creation

## Suggested Implementation Steps

1. Create `modules/bookings/bookings.service.ts` with `create`, `findAll`, `findById`, `updateStatus`, `cancel` methods
2. Create `modules/bookings/bookings.controller.ts` with all endpoints
3. Create `modules/reviews/reviews.service.ts` with `create`, `findByProvider`, `updateProviderStats`, `updateTrustScore` methods
4. Create `modules/reviews/reviews.controller.ts` with GET and POST endpoints
5. Implement notification creation as a helper method (reused across services)
6. Wire up modules
7. Test booking creation and status lifecycle
8. Test review creation and verify provider stats update
9. Test trust score calculation

## QA / Validation Checklist

- [ ] `POST /api/bookings` creates a booking with status PENDING
- [ ] `PATCH /api/bookings/:id` with `{ status: 'CONFIRMED' }` works for provider
- [ ] `PATCH /api/bookings/:id` with invalid transition (COMPLETED → PENDING) returns error
- [ ] `DELETE /api/bookings/:id` cancels PENDING booking
- [ ] `GET /api/bookings` shows client's bookings when role=client
- [ ] `GET /api/bookings` shows provider's bookings when role=provider
- [ ] `POST /api/reviews` creates review and updates provider rating
- [ ] `POST /api/reviews` rejects duplicate review for same booking
- [ ] `POST /api/reviews` rejects review for non-completed booking
- [ ] `GET /api/reviews?providerId=X` returns public reviews for provider
- [ ] Provider `totalJobs` increments on booking completion
- [ ] Notification created for provider on new booking
- [ ] Notification created for client on booking confirmation

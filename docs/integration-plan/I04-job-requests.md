# I04 — Job Requests module

## Goal

Introduce the `JobRequest` domain on the backend (model + module + endpoints), add Zod schemas + API client, wire the pro's JobRequests screen to real data, and emit client-created bookings as job requests so pros can see them.

## Why it matters

Today, every booking created by a client goes straight to a specific pro. There's no intermediate "open-to-all-matching-pros request" state. The v2 design introduces `JobRequest` as the marketplace discovery layer: clients can post a request, matching pros see it, whoever wants to submit a quote does. The accepted quote creates a booking.

This chunk ships the **job-request** side. Quotes are I05.

## Scope

### In scope
- New Prisma models: `JobRequest`, `JobRequestMatch`
- New enum: `JobRequestStatus` (OPEN | MATCHED | EXPIRED | CANCELLED)
- New backend module: `JobRequestsModule` with controller + service + repository
- Endpoints:
  - `POST /job-requests` (client) — create an open request
  - `GET /job-requests/mine` (client) — client sees their own submitted requests
  - `GET /pro/requests` (pro) — inbox of matching open requests for this pro
  - `GET /pro/requests/:id` (pro) — detail view
  - `POST /pro/requests/:id/dismiss` (pro) — pro marks a request as not-interested (optional: dedupes future matches)
  - `POST /job-requests/:id/cancel` (client) — client cancels
- Matcher: a simple service that, on JobRequest creation, picks top N pros matching (category + within radius + availability + not already dismissed) and creates `JobRequestMatch` rows. Order of sophistication: nearest-neighbor + highest-rated first.
- Zod schemas in `@kayu/schemas`
- API client endpoints + query keys in `@kayu/api`
- Wire pro JobRequests screen (web + mobile)
- Wire pro Dashboard "Nouvelles demandes" section (from I03) to consume the same feed (top 3 here)

### Out of scope
- Quote composition (I05)
- Notification to the pro on new match (notifications domain exists; this chunk emits the event but the UI bell/list is future)
- Advanced matching (ML, propensity scoring) — out
- Real-time matching — polling only for MVP

## Prisma migration

```prisma
enum JobRequestStatus {
  OPEN
  MATCHED     // a quote has been accepted
  EXPIRED
  CANCELLED
}

model JobRequest {
  id              String @id @default(cuid())
  clientId        String
  client          User @relation("ClientJobRequests", fields: [clientId], references: [id])

  categoryId      String?
  category        Category? @relation(fields: [categoryId], references: [id])
  subcategoryId   String?
  subcategory     Subcategory? @relation(fields: [subcategoryId], references: [id])

  service         String          // short label
  description     String          // full free-text
  address         String
  city            String
  commune         String?
  latitude        Float?
  longitude       Float?

  whenPref        String          // "asap" | "today" | "tomorrow" | "this_week" | ISO date
  estimatedHours  Float?
  budget          Int?            // FC
  photoCount      Int             @default(0)

  status          JobRequestStatus @default(OPEN)
  urgent          Boolean         @default(false)
  competingCount  Int             @default(0)     // denormalized: number of matches
  expiresAt       DateTime?

  matches         JobRequestMatch[]
  // quotes         Quote[]  ← added in I05

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([status, categoryId])
  @@index([clientId, status])
}

model JobRequestMatch {
  id            String @id @default(cuid())
  jobRequestId  String
  jobRequest    JobRequest @relation(fields: [jobRequestId], references: [id], onDelete: Cascade)
  providerId    String
  provider      Provider @relation(fields: [providerId], references: [id])
  matchScore    Int                            // 0-100
  notifiedAt    DateTime @default(now())
  dismissedAt   DateTime?
  viewedAt      DateTime?

  @@unique([jobRequestId, providerId])
  @@index([providerId, dismissedAt])
}
```

Apply with `prisma migrate dev --name add-job-requests`.

## Zod schemas — `@kayu/schemas`

```ts
export const JobRequestStatus = z.enum(["OPEN", "MATCHED", "EXPIRED", "CANCELLED"])

export const JobRequestSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  client: UserSummarySchema,
  category: CategorySummarySchema.nullable(),
  service: z.string(),
  description: z.string(),
  address: z.string(),
  city: z.string(),
  commune: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  whenPref: z.string(),
  estimatedHours: z.number().nullable(),
  budget: z.number().nullable(),
  photoCount: z.number(),
  status: JobRequestStatus,
  urgent: z.boolean(),
  competingCount: z.number(),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
})

export const JobRequestForProSchema = JobRequestSchema.extend({
  matchScore: z.number(),
  notifiedAt: z.string().datetime(),
  // client info with newClient flag, rating, jobs count
  client: UserSummarySchema.extend({
    newClient: z.boolean(),
    rating: z.number().nullable(),
    jobs: z.number(),
  }),
})

export const CreateJobRequestDto = z.object({
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  service: z.string().min(3),
  description: z.string().min(10),
  address: z.string().min(3),
  city: z.string(),
  commune: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  whenPref: z.string(),
  estimatedHours: z.number().positive().optional(),
  budget: z.number().int().positive().optional(),
  urgent: z.boolean().default(false),
})
```

## API client + query keys

```ts
export const jobRequestsApi = (client: ApiClient) => ({
  // Client side
  create: (data: CreateJobRequestDtoType) =>
    client.post<{ request: JobRequestType }>("/job-requests", data),
  mine: () =>
    client.get<{ requests: JobRequestType[] }>("/job-requests/mine"),
  cancel: (id: string) =>
    client.post<{ success: true }>(`/job-requests/${id}/cancel`),

  // Pro side
  inbox: () =>
    client.get<{ requests: JobRequestForProType[] }>("/pro/requests"),
  getById: (id: string) =>
    client.get<{ request: JobRequestForProType }>(`/pro/requests/${id}`),
  dismiss: (id: string) =>
    client.post<{ success: true }>(`/pro/requests/${id}/dismiss`),
})

queryKeys.jobRequests = {
  mine: ["jobRequests", "mine"],
  inboxForPro: ["jobRequests", "inboxForPro"],
  detail: (id: string) => ["jobRequests", "detail", id],
}
```

## Matcher service

```ts
// job-requests.service.ts
async create(actor: Actor, dto: CreateJobRequestDto) {
  return this.prisma.$transaction(async (tx) => {
    const req = await tx.jobRequest.create({ data: { ...dto, clientId: actor.id } })
    // find matching pros: category + within radius + available + verified
    const candidates = await tx.provider.findMany({
      where: {
        isAvailable: true,
        verificationStatus: "VERIFIED",
        categories: { some: { categoryId: dto.categoryId } },
        // crude distance filter using city; refine with lat/lng + haversine later
        user: { city: dto.city },
      },
      orderBy: [{ rating: "desc" }, { totalJobs: "desc" }],
      take: 10,
    })
    for (const [i, pro] of candidates.entries()) {
      const score = Math.round(100 - i * 8)   // crude: 100, 92, 84, ...
      await tx.jobRequestMatch.create({
        data: { jobRequestId: req.id, providerId: pro.id, matchScore: score },
      })
    }
    await tx.jobRequest.update({
      where: { id: req.id },
      data: { competingCount: candidates.length },
    })
    // emit notifications (non-blocking): "Nouvelle demande pour toi"
    this.notificationsService.broadcast(
      candidates.map((p) => p.userId),
      { type: "JOB_REQUEST_NEW", title: "Nouvelle demande", data: { requestId: req.id } }
    )
    return req
  })
}
```

`inbox(actor)`: fetch all `JobRequestMatch` for the pro where `dismissedAt IS NULL` and the request is `status = OPEN` and not expired. Join request + client info. Sort urgent-first, then by notifiedAt desc.

## Frontend wiring — pro inbox

Web: `/pro/requests` (`apps/web/src/app/pro/requests/page.tsx`)

```tsx
const { data, isLoading } = useQuery({
  queryKey: queryKeys.jobRequests.inboxForPro,
  queryFn: () => jobRequestsApi(apiClient).inbox(),
  refetchInterval: 30_000,
})

const dismissMut = useMutation({
  mutationFn: (id: string) => jobRequestsApi(apiClient).dismiss(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobRequests.inboxForPro }),
})
```

Delete `INCOMING_REQUESTS` and `PRO_ACTIVE_JOBS` fixtures.

`PRO_ACTIVE_JOBS` is replaced by calling the Bookings API:
```ts
bookingsApi(apiClient).getAll({ role: "provider", status: "IN_PROGRESS" })
bookingsApi(apiClient).getAll({ role: "provider", status: "CONFIRMED" })
```

Mobile: same pattern in `apps/mobile/src/screens/pro/JobRequestsScreen.tsx`.

## Frontend wiring — client-side creation

The homepage search + booking form on the client side already create Bookings directly. **Question:** do we keep the direct-to-pro booking path and layer JobRequest on top, or replace?

**Decision:** keep both. A client either:
- Taps a specific pro's "Réserver" (direct booking — existing flow)
- OR posts a JobRequest (new flow) from a "Trouvez un pro pour moi" CTA

For I04, add the second CTA but don't rework the first. The JobRequest form is effectively the same fields as a Booking form but without a `providerId`.

Add a simple "Trouvez un pro pour moi" entry point on the homepage OR on an empty search result ("Aucun pro disponible — postez une demande"). Links to `/request/new` form. Minimal UI, reuses booking form patterns.

## Dependencies
- No hard deps
- Blocks I05 (Quote requires a JobRequest to quote against)
- Feeds I03 (provider dashboard's newRequests section becomes richer)

## Acceptance criteria

1. Client creates a JobRequest; matches are generated for relevant pros
2. Pro sees matching requests in the inbox, sorted urgent-first
3. Pro can dismiss a request; it disappears from their inbox
4. Client can cancel a request
5. Provider dashboard's "Nouvelles demandes" section renders the same data (top 3)
6. `INCOMING_REQUESTS` fixture deleted from web + mobile
7. Schema-first: `@kayu/schemas` defines the shape; backend returns the shape; frontend consumes typed

## QA checklist
- [ ] `grep -r "INCOMING_REQUESTS" apps/` returns nothing
- [ ] Create a JobRequest as client → at least 1 match row created for a matching pro
- [ ] Pro inbox shows the new request within 30s (polling)
- [ ] Pro dashboard's Nouvelles demandes shows top 3 matches
- [ ] Pro can dismiss → disappears from inbox + dashboard
- [ ] Urgent requests appear before non-urgent in the inbox
- [ ] Empty inbox → EmptyState renders with actionable CTA
- [ ] Match score is a plausible 0-100 integer
- [ ] Client's own requests list (`GET /job-requests/mine`) returns their own
- [ ] Cancelled request: status = CANCELLED and matches are soft-ignored (no unassign, just filter at read time)
- [ ] Expiry: a request beyond `expiresAt` returns status EXPIRED in future polls (if not, cron is a future task — flag)
- [ ] Notifications: a pro gets a notification entry when matched (unread count bumps)

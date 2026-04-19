# I05 — Quote / Devis module

## Goal

Introduce the `Quote` + `QuoteLineItem` domain on the backend, wire QuoteCompose on web + mobile to it, and on quote acceptance create a Booking atomically. Commission (10%) is computed server-side, displayed to the pro, and stored on the quote.

## Why it matters

The quote is the marketplace's commercial instrument. Without it, pros can't formally respond to a JobRequest with a priced offer the client can accept. The commission breakdown also establishes the financial contract: pros see their payout up-front, clients see the full price.

## Scope

### In scope
- Prisma: `Quote` + `QuoteLineItem` models, `QuoteStatus` enum
- Backend module: `QuotesModule` with controller + service
- Endpoints:
  - `POST /pro/quotes` (pro) — draft a quote (lines, message, validity, start-date, against a JobRequest)
  - `PATCH /pro/quotes/:id` (pro) — update a draft
  - `POST /pro/quotes/:id/send` (pro) — transition DRAFT → SENT, notify client
  - `GET /pro/quotes` (pro) — list their quotes
  - `GET /pro/quotes/:id` (pro) — detail
  - `GET /quotes/:id` (client — received quote via JobRequest link) — detail with client-safe fields
  - `POST /quotes/:id/accept` (client) — transition SENT → ACCEPTED, creates a Booking in a transaction, marks JobRequest as MATCHED
  - `POST /quotes/:id/decline` (client) — transition SENT → DECLINED
- Server-side computation of subtotal, discount, total, commission (10%), payout
- Client view: see all quotes received for a JobRequest
- Commission rate stored on the quote (for historical correctness)
- Quote expiry: scheduled EXPIRED transition after `validityDays`
- Wire QuoteCompose on web (`/pro/devis/new`) + mobile
- Wire client-side received-quotes view (can be on JobRequest detail page or a lightweight modal; minimal UI for now)

### Out of scope
- PDF generation of quotes
- Emailing quotes (Supabase email could do it later)
- Counter-offers / revisions
- Multi-quote bidding UI on the client side (scope: show received quotes, accept one)
- Escrow / payment holds — those are tied to Earnings in I06

## Prisma migration

```prisma
enum QuoteStatus {
  DRAFT
  SENT
  ACCEPTED
  DECLINED
  EXPIRED
}

model Quote {
  id              String @id @default(cuid())
  jobRequestId    String?
  jobRequest      JobRequest? @relation(fields: [jobRequestId], references: [id])

  providerId      String
  provider        Provider @relation(fields: [providerId], references: [id])
  clientId        String
  client          User @relation("ClientQuotes", fields: [clientId], references: [id])

  message         String                      // free-text to the client
  validityDays    Int     @default(7)
  startDateKind   String                      // "today" | "tomorrow" | "this_week" | ISO
  discountPct     Int     @default(0)

  // Server-computed totals (cached for audit/historical)
  subtotal        Int
  discountAmt     Int
  total           Int
  commissionPct   Int     @default(10)
  commissionAmt   Int
  payoutAmt       Int

  status          QuoteStatus @default(DRAFT)
  sentAt          DateTime?
  acceptedAt      DateTime?
  declinedAt      DateTime?
  expiresAt       DateTime?

  lines           QuoteLineItem[]
  bookingId       String?  @unique
  booking         Booking? @relation("BookingFromQuote", fields: [bookingId], references: [id])

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([providerId, status])
  @@index([clientId, status])
  @@index([jobRequestId])
}

model QuoteLineItem {
  id         String @id @default(cuid())
  quoteId    String
  quote      Quote @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  label      String
  qty        Float  @default(1)
  unit       String                         // "Forfait" | "Heure" | "Pièce" | custom
  unitPrice  Int                            // in FC
  order      Int     @default(0)
}
```

Update `Booking` model to backref `Quote`:
```prisma
model Booking {
  ...
  quote Quote? @relation("BookingFromQuote")
}
```

Migration: `prisma migrate dev --name add-quotes`.

## Zod schemas — `@kayu/schemas`

```ts
export const QuoteStatus = z.enum(["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"])

export const QuoteLineItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  qty: z.number().positive(),
  unit: z.string(),
  unitPrice: z.number().int().nonnegative(),
  order: z.number().int().default(0),
})

export const QuoteSchema = z.object({
  id: z.string(),
  jobRequestId: z.string().nullable(),
  providerId: z.string(),
  clientId: z.string(),
  message: z.string(),
  validityDays: z.number().int().positive(),
  startDateKind: z.string(),
  discountPct: z.number().int().min(0).max(100),
  subtotal: z.number().int(),
  discountAmt: z.number().int(),
  total: z.number().int(),
  commissionPct: z.number().int(),
  commissionAmt: z.number().int(),
  payoutAmt: z.number().int(),
  status: QuoteStatus,
  sentAt: z.string().datetime().nullable(),
  acceptedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  lines: z.array(QuoteLineItemSchema),
  provider: ProviderSchema.optional(),       // populated for client view
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// Input DTOs
export const QuoteLineInput = z.object({
  label: z.string().min(1),
  qty: z.number().positive(),
  unit: z.string(),
  unitPrice: z.number().int().nonnegative(),
})

export const CreateQuoteDto = z.object({
  jobRequestId: z.string().optional(),
  lines: z.array(QuoteLineInput).min(1),
  message: z.string().min(1),
  validityDays: z.number().int().positive().max(60).default(7),
  startDateKind: z.string(),
  discountPct: z.number().int().min(0).max(100).default(0),
})

export const UpdateQuoteDto = CreateQuoteDto.partial()
```

## Server-side computation

Recompute on every CREATE / PATCH:

```ts
function computeTotals(lines: QuoteLineItem[], discountPct: number) {
  const subtotal = lines.reduce((s, l) => s + Math.round(l.qty * l.unitPrice), 0)
  const discountAmt = Math.round((subtotal * discountPct) / 100)
  const total = subtotal - discountAmt
  const commissionPct = 10   // read from config, not hardcoded — decision doc I05-a
  const commissionAmt = Math.round((total * commissionPct) / 100)
  const payoutAmt = total - commissionAmt
  return { subtotal, discountAmt, total, commissionPct, commissionAmt, payoutAmt }
}
```

Never trust the client's totals. Always recompute.

## API client + query keys

```ts
export const quotesApi = (client: ApiClient) => ({
  // Pro
  listMine: () => client.get<{ quotes: QuoteType[] }>("/pro/quotes"),
  create: (data: CreateQuoteDtoType) => client.post<{ quote: QuoteType }>("/pro/quotes", data),
  update: (id: string, data: UpdateQuoteDtoType) =>
    client.patch<{ quote: QuoteType }>(`/pro/quotes/${id}`, data),
  send: (id: string) => client.post<{ quote: QuoteType }>(`/pro/quotes/${id}/send`),
  getByIdForPro: (id: string) => client.get<{ quote: QuoteType }>(`/pro/quotes/${id}`),

  // Client
  getByIdForClient: (id: string) => client.get<{ quote: QuoteType }>(`/quotes/${id}`),
  accept: (id: string) => client.post<{ quote: QuoteType, booking: BookingType }>(`/quotes/${id}/accept`),
  decline: (id: string) => client.post<{ quote: QuoteType }>(`/quotes/${id}/decline`),
})

queryKeys.quotes = {
  mine: ["quotes", "mine"],
  detail: (id: string) => ["quotes", "detail", id],
  forRequest: (jobRequestId: string) => ["quotes", "forRequest", jobRequestId],
}
```

## Accept → Booking atomic creation

```ts
async acceptQuote(actor: Actor, quoteId: string) {
  return this.prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUniqueOrThrow({ where: { id: quoteId }, include: { lines: true, jobRequest: true } })
    if (quote.clientId !== actor.id) throw new ForbiddenException()
    if (quote.status !== "SENT") throw new BadRequestException("Quote is not acceptable")

    // Create Booking from quote data
    const booking = await tx.booking.create({
      data: {
        clientId: quote.clientId,
        providerId: quote.providerId,
        title: quote.jobRequest?.service ?? "Mission",
        description: quote.message,
        address: quote.jobRequest?.address ?? "",
        city: quote.jobRequest?.city ?? "",
        scheduledDate: computeScheduledDate(quote.startDateKind),
        duration: Math.round(quote.lines.find((l) => l.unit === "Heure")?.qty ?? 2) * 60,
        price: quote.total,
        status: "CONFIRMED",
      },
    })
    const updated = await tx.quote.update({
      where: { id: quoteId },
      data: { status: "ACCEPTED", acceptedAt: new Date(), bookingId: booking.id },
    })
    if (quote.jobRequestId) {
      await tx.jobRequest.update({
        where: { id: quote.jobRequestId },
        data: { status: "MATCHED" },
      })
    }
    // Notify pro
    this.notificationsService.create({
      userId: (await this.getProviderUserId(tx, quote.providerId)),
      type: "QUOTE_ACCEPTED",
      title: "Devis accepté !",
      data: { quoteId, bookingId: booking.id },
    })
    return { quote: updated, booking }
  })
}
```

## Frontend wiring — pro (QuoteCompose)

Web: `/pro/devis/new?requestId=...` + `/pro/devis/:id/edit`

Current: uses fixtures for presets + request lookup. `PRESET_LINE_ITEMS` stays as a static catalog (decision in 00-overview); the request lookup becomes a real fetch:

```tsx
const { data: reqData } = useQuery({
  queryKey: queryKeys.jobRequests.detail(requestId),
  queryFn: () => jobRequestsApi(apiClient).getById(requestId),
  enabled: !!requestId,
})
```

Form submission:

```tsx
const createMut = useMutation({
  mutationFn: (dto: CreateQuoteDtoType) => quotesApi(apiClient).create(dto),
})

const sendMut = useMutation({
  mutationFn: (id: string) => quotesApi(apiClient).send(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.quotes.mine })
    router.replace("/pro/requests?sent=1") // soft success
  },
})

// On "Envoyer le devis":
const q = await createMut.mutateAsync({ jobRequestId, lines, message, validityDays, startDateKind, discountPct })
await sendMut.mutateAsync(q.quote.id)
```

The totals shown in the right sidebar come from `q.quote.total / commissionAmt / payoutAmt` (the backend returns computed values), not from client-side math. During composition, debounce a preview call to `POST /pro/quotes/preview` that recomputes without persisting (optional — or compute client-side and show with a "estimation" caveat). **Decision:** compute client-side for live preview, submit triggers backend re-compute which is the source of truth.

Mobile: same pattern in `apps/mobile/src/screens/pro/QuoteComposeScreen.tsx`.

## Frontend wiring — client-side quote view

Minimal UI. When a client receives a quote (notification landed):
- `/job-requests/:id` (client view) shows received quotes as cards
- Each card: pro avatar, total FC, validity, "Voir le devis" → `/quotes/:id` detail page
- Detail page: pro info + lines breakdown + total + "Accepter" / "Décliner"
- Accept → Booking is created; navigate to the new `/bookings/:id`

This view is **net-new** but simple — leverages existing `BookingDetail` layouts.

## Fixtures to delete

- Web: `INCOMING_REQUESTS` (gone in I04) + quote-compose request lookup helpers
- Mobile: same

## Dependencies
- Depends on I04 (JobRequest must exist for `jobRequestId` FK; standalone quotes are allowed but I04 is the primary flow)
- Blocks I06 (Earnings records an `EARNING` transaction on accepted quote → completed booking)
- Blocks I10

## Acceptance criteria

1. Pro creates a quote as a DRAFT, can edit, can send
2. Sent quote is visible to the client in their request detail view
3. Client accepts a quote → a Booking is created atomically and JobRequest becomes MATCHED
4. All totals (subtotal, discount, total, commission, payout) are server-computed; client form shows an "estimation" until submit
5. Declined or expired quotes can't be accepted
6. Pro can see all their sent quotes and their statuses

## QA checklist
- [ ] `POST /pro/quotes` with valid data returns a DRAFT quote with correct totals
- [ ] `PATCH /pro/quotes/:id` on another pro's quote returns 403
- [ ] `POST /pro/quotes/:id/send` transitions DRAFT → SENT; second call returns error
- [ ] Client receives notification on quote send
- [ ] Client `GET /quotes/:id` returns the quote with the provider's public fields
- [ ] Client accept → Booking created with `status = CONFIRMED`, price matches `quote.total`
- [ ] JobRequest linked to accepted quote → status = MATCHED
- [ ] Decline sets status = DECLINED; subsequent accept fails
- [ ] Expiry: quote with `expiresAt < now` is marked EXPIRED on read (or via scheduled job — deferred)
- [ ] Fixture removal: no `getPresets()`/`findRequest()` helpers against fixtures remain
- [ ] Commission is exactly 10% (or matches the config value) of `total`
- [ ] Payout = total - commissionAmt
- [ ] Client-side live preview matches server-computed totals on submit

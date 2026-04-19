# I06 — Earnings + Mobile Money payouts

## Goal

Introduce `Transaction` and `Payout` models, compute pro earnings from completed bookings, expose a weekly summary + transaction list + payout request endpoints, and wire the Earnings screen on web + mobile. Mobile Money operator selection is real UI; the actual PSP call is **stubbed** at the backend boundary (creates a Payout record with status PENDING, no real money moves).

## Why it matters

Earnings is the pro's most trusted page — it's where they see money in their account and request it out. Shipping this with fake data makes the entire product feel untrustworthy. Making it real (read side) establishes credibility; the write side (payout execution) is stubbed but the contract is in place for when a real PSP wires in.

## Scope

### In scope
- Prisma: `Transaction`, `Payout` models, related enums
- Backend module: `EarningsModule` with controller + service
- Endpoints:
  - `GET /pro/earnings/summary` — balance, pending, lifetime, weekly sparkline, 4-stat row values
  - `GET /pro/earnings/transactions` — paginated list
  - `POST /pro/earnings/payouts` — create a payout request (stub: records to DB, no PSP call)
  - `GET /pro/earnings/payouts` — list pro's payouts with status
- Transaction generation: when a Booking transitions to COMPLETED, generate an `EARNING` transaction; when client marks paid (or status COMPLETED + paymentMethod set), update transaction status to COMPLETED
- Bonus transactions (e.g. "10 missions ★4.9+") — scaffold the model and API but data is driven by future logic; for now, manual admin insert
- Zod schemas, API client, query keys
- Wire Earnings on web + mobile (delete fixtures)
- Masked phone display (+243 810 *** 742)

### Out of scope
- Real PSP integration — Payout records are created but no SMS / MoMo API call
- Tax / invoice PDF generation
- Custom date range picker ("Ce mois / Personnalisé") beyond this-week / this-month presets
- Export to CSV (placeholder button)
- Two-factor confirmation of a payout (future)

## Prisma migration

```prisma
enum TransactionType {
  EARNING
  PAYOUT
  BONUS
  REFUND
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
}

enum PayoutOperator {
  MPESA
  AIRTEL
  ORANGE
  MTN
}

enum PayoutStatus {
  READY
  PENDING
  COMPLETED
  FAILED
  ON_HOLD
}

model Transaction {
  id              String @id @default(cuid())
  providerId      String
  provider        Provider @relation(fields: [providerId], references: [id])
  type            TransactionType
  bookingId       String?
  booking         Booking? @relation(fields: [bookingId], references: [id])
  payoutId        String?  @unique
  payout          Payout? @relation(fields: [payoutId], references: [id])

  amount          Int                          // signed: + earnings/bonus, − payouts
  feeAmt          Int     @default(0)
  netAmt          Int
  paymentMethod   String?                       // "cash" | "mpesa" | "airtel" | "orange" | "mtn"
  status          TransactionStatus  @default(PENDING)
  reference       String?                       // PSP ref for payouts
  note            String?
  occurredAt      DateTime @default(now())
  createdAt       DateTime @default(now())

  @@index([providerId, occurredAt])
}

model Payout {
  id              String @id @default(cuid())
  providerId      String
  provider        Provider @relation(fields: [providerId], references: [id])

  operator        PayoutOperator
  phoneMasked     String
  phoneFull       String                        // stored for future PSP call
  amount          Int
  feeAmt          Int
  netAmt          Int
  status          PayoutStatus  @default(PENDING)
  reference       String?
  holdReason      String?

  requestedAt     DateTime @default(now())
  completedAt     DateTime?
  transaction     Transaction?

  @@index([providerId, status])
  @@index([status, requestedAt])
}
```

Update Provider:
```prisma
model Provider {
  ...
  transactions     Transaction[]
  payouts          Payout[]
}
```

Migration: `prisma migrate dev --name add-earnings-payouts`.

## Transaction generation on booking completion

Add to `BookingsService.updateStatus` when transitioning to COMPLETED:

```ts
await tx.transaction.create({
  data: {
    providerId: booking.providerId,
    type: "EARNING",
    bookingId: booking.id,
    amount: booking.price,
    feeAmt: Math.round(booking.price * 0.10),    // must match quote.commissionPct if booking came from quote
    netAmt: booking.price - Math.round(booking.price * 0.10),
    paymentMethod: booking.paymentMethod ?? "cash",
    status: booking.isPaid ? "COMPLETED" : "PENDING",
    occurredAt: new Date(),
  },
})
```

If the booking came from a Quote, use the quote's commissionAmt and payoutAmt verbatim — don't recompute. Quote values are the contract.

## Summary endpoint

```ts
// GET /pro/earnings/summary
async summary(actor: Actor) {
  const providerId = await this.getProviderIdByUserId(actor.id)
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })

  const [weekEarnings, lastWeekEarnings, pending, lifetime, monthlyStats] = await Promise.all([
    this.aggregate(providerId, weekStart, now, "EARNING"),
    this.aggregate(providerId, subDays(weekStart, 7), weekStart, "EARNING"),
    this.balance(providerId, { status: "PENDING" }),
    this.aggregate(providerId, new Date(0), now, "EARNING"),
    this.monthlyBreakdown(providerId),
  ])

  const available = await this.balance(providerId, { status: "COMPLETED" })

  return {
    balance: available,
    pending,
    lifetime,
    weekly: {
      days: this.weeklyDailyBars(providerId, weekStart),      // [{ day: "Lun", amount, isToday, isFuture }, ...]
      total: weekEarnings,
      lastWeekTotal: lastWeekEarnings,
      deltaPct: ((weekEarnings - lastWeekEarnings) / Math.max(1, lastWeekEarnings)) * 100,
    },
  }
}
```

## Transactions endpoint

`GET /pro/earnings/transactions?type=EARNING&page=1&limit=20`

Returns paginated list with the `Transaction` shape plus a humanized label (e.g. "Réparation fuite · Famille Mutombo" pulled from the related booking's title + client name).

## Payouts endpoint

```ts
// POST /pro/earnings/payouts
// Body: { operator: "MPESA" | ..., amount: number, phone: string }
async createPayout(actor: Actor, dto: CreatePayoutDto) {
  const providerId = await this.getProviderIdByUserId(actor.id)
  const available = await this.balance(providerId, { status: "COMPLETED" })
  if (dto.amount > available) throw new BadRequestException("Insufficient balance")

  const feeAmt = Math.round(dto.amount * 0.01)   // 1% fee
  const netAmt = dto.amount - feeAmt

  return this.prisma.$transaction(async (tx) => {
    const payout = await tx.payout.create({
      data: {
        providerId,
        operator: dto.operator,
        phoneFull: dto.phone,
        phoneMasked: maskPhone(dto.phone),
        amount: dto.amount,
        feeAmt,
        netAmt,
        status: "PENDING",
      },
    })
    // Linked transaction (negative amount)
    const transaction = await tx.transaction.create({
      data: {
        providerId,
        type: "PAYOUT",
        payoutId: payout.id,
        amount: -dto.amount,
        feeAmt,
        netAmt: -netAmt,
        paymentMethod: dto.operator.toLowerCase(),
        status: "PENDING",
        occurredAt: new Date(),
      },
    })
    // TODO: call PSP here — for now, stub
    // await this.pspClient.requestDisbursement({ operator, phone: dto.phone, amount: netAmt })
    return { payout, transaction }
  })
}
```

The `TODO: call PSP` is the integration point for the real Mobile Money wiring. For now, payouts stay in PENDING forever unless an admin manually resolves (I09).

## Zod schemas + API client

```ts
// @kayu/schemas
export const TransactionType = z.enum(["EARNING", "PAYOUT", "BONUS", "REFUND"])
export const TransactionStatus = z.enum(["PENDING", "COMPLETED", "FAILED"])
export const PayoutOperator = z.enum(["MPESA", "AIRTEL", "ORANGE", "MTN"])
export const PayoutStatus = z.enum(["READY", "PENDING", "COMPLETED", "FAILED", "ON_HOLD"])

export const TransactionSchema = z.object({
  id: z.string(),
  type: TransactionType,
  bookingId: z.string().nullable(),
  amount: z.number().int(),
  feeAmt: z.number().int(),
  netAmt: z.number().int(),
  paymentMethod: z.string().nullable(),
  status: TransactionStatus,
  reference: z.string().nullable(),
  label: z.string(),   // humanized display
  occurredAt: z.string().datetime(),
})

export const WeekDaySchema = z.object({
  day: z.string(),
  amount: z.number().int(),
  isToday: z.boolean().optional(),
  isFuture: z.boolean().optional(),
})

export const EarningsSummarySchema = z.object({
  balance: z.number().int(),
  pending: z.number().int(),
  lifetime: z.number().int(),
  weekly: z.object({
    days: z.array(WeekDaySchema),
    total: z.number().int(),
    lastWeekTotal: z.number().int(),
    deltaPct: z.number(),
  }),
})

export const CreatePayoutDto = z.object({
  operator: PayoutOperator,
  amount: z.number().int().positive(),
  phone: z.string().min(10),
})

// @kayu/api
export const earningsApi = (client: ApiClient) => ({
  summary: () => client.get<{ summary: EarningsSummaryType }>("/pro/earnings/summary"),
  transactions: (params?: { type?, page?, limit? }) =>
    client.get<{ transactions: TransactionType[], pagination }>("/pro/earnings/transactions", params),
  createPayout: (data: CreatePayoutDtoType) =>
    client.post<{ payout: PayoutType }>("/pro/earnings/payouts", data),
  payouts: () =>
    client.get<{ payouts: PayoutType[] }>("/pro/earnings/payouts"),
})

queryKeys.earnings = {
  summary: ["earnings", "summary"],
  transactions: (params) => ["earnings", "transactions", params ?? {}],
  payouts: ["earnings", "payouts"],
}
```

## Frontend wiring

Web: `apps/web/src/app/pro/earnings/page.tsx`

```tsx
const { data: summary } = useQuery({ queryKey: queryKeys.earnings.summary, queryFn: () => earningsApi(apiClient).summary() })
const { data: txData } = useQuery({ queryKey: queryKeys.earnings.transactions({ type: filter }), queryFn: () => earningsApi(apiClient).transactions({ type: filter }) })
const payoutMut = useMutation({ mutationFn: (dto: CreatePayoutDtoType) => earningsApi(apiClient).createPayout(dto) })
```

The MoneyChart consumes `summary.weekly.days` (backend provides the `isToday`/`isFuture` flags so the UI doesn't compute dates). The 4 stat tiles consume `summary.balance`, `summary.pending`, `summary.lifetime`, `summary.weekly.deltaPct`.

Payout sheet:
- Operator tiles select `operator`
- Phone input prefilled from the pro's `phone` field (then masked on display)
- Amount input bounded to `summary.balance`
- Fee preview computed client-side: `amount * 0.01`
- Submit → `payoutMut.mutate({ operator, amount, phone })` → show success with ref code
- On success → refetch summary (balance decreases) and payouts list

Mobile: same pattern in `apps/mobile/src/screens/pro/EarningsScreen.tsx`.

## Fixtures to delete

- Web: `EARNINGS_WEEKLY`, `TRANSACTIONS`, `BALANCES`
- Mobile: same

## Dependencies
- Depends on I05 (Quote accepted → Booking COMPLETED → Transaction EARNING). Without I05, Transactions only arrive from direct bookings.
- Can partially land before I05 — the model + endpoints ship, but Transactions won't populate until real bookings complete.
- Blocks I09 (admin payouts queue reads this data)
- Blocks I10

## Acceptance criteria

1. Pro with completed bookings sees real earnings in the summary
2. Weekly chart bars match the day-by-day totals
3. Delta % vs last week is accurate
4. Transaction list paginates and filters by type
5. Creating a payout decreases `balance`, creates a Transaction of type PAYOUT, and the Payout shows in PENDING status
6. Fixtures deleted
7. No runtime errors when a pro has zero completed bookings (chart renders all zeros with future-dim styling)

## QA checklist
- [ ] `grep -r "EARNINGS_WEEKLY\|TRANSACTIONS\|BALANCES" apps/` returns nothing (except maybe a type export)
- [ ] Complete a booking with status COMPLETED → a Transaction of type EARNING with correct netAmt appears
- [ ] Cash-paid booking: transaction starts PENDING (needs manual clearance)
- [ ] MoMo-paid booking: transaction starts COMPLETED (if the booking has paymentMethod + isPaid)
- [ ] Summary: `balance` = sum of EARNING+BONUS COMPLETED - sum of PAYOUT COMPLETED - sum of PAYOUT PENDING
- [ ] Create payout → amount validated ≤ balance
- [ ] Weekly chart today bar has the ring-shadow style; other days the softer gradient; future days dim
- [ ] Transaction row icons: green trending-up for EARNING, blue send for PAYOUT, amber sparkles for BONUS
- [ ] Amount sign: + for earnings/bonus, − for payouts
- [ ] Net label shows under earnings, reference code under payouts
- [ ] Masked phone stored correctly: last 3 digits visible, rest stars
- [ ] Payout action button labels "Valider le paiement" — success returns an optimistic reference code ("Simulé-PSP-ABC" for stub)
- [ ] Filter chips (Tout / Gains / Paiements / Bonus) filter correctly

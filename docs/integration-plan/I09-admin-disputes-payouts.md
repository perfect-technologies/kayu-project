# I09 — Admin disputes + payouts (deferred / optional)

## Goal

Build the admin-side resolution tools for the two riskiest backend domains: disputes and Mobile Money payouts. Dispute workbench for ops to side with client / side with pro / partial refund / escalate. Payout queue for batch-approving Mobile Money settlements.

## Why it's deferred

The user explicitly said admin can wait. I09 is scoped so it can ship whenever the business team is ready to operate it. No other chunk depends on I09 landing — it's purely additive.

## Scope

### In scope
- Extend `AdminModule` with dispute + payout endpoints
- Endpoints:
  - `GET /admin/disputes?status=X&severity=Y&country=Z&page=N` — list
  - `GET /admin/disputes/:id` — detail with full timeline + evidences
  - `POST /admin/disputes/:id/resolve` — resolve (siding or partial refund)
  - `POST /admin/disputes/:id/investigate` — move to INVESTIGATING
  - `POST /admin/disputes/:id/escalate` — move to ESCALATED
  - `GET /admin/payouts?status=X&operator=Y` — list
  - `POST /admin/payouts/batch-complete` — batch-mark N payouts as COMPLETED with a ref code
  - `POST /admin/payouts/:id/hold` — put on hold with reason
  - `POST /admin/payouts/:id/release` — release hold
- Zod schemas, API client
- Wire AdminOps screen's disputes and payouts sections (design already exists in DS10)
- Note: verification review is already part of the existing `/admin/providers` endpoint (status filter + update) — no new work needed there

### Out of scope
- Real PSP integration for payouts (I06 stubs it; I09 doesn't wire either)
- Automated dispute escalation / SLA enforcement
- Email templates for dispute updates
- Multi-admin coordination / assignment queue
- Admin activity audit trail beyond `ActivityLog`

## Backend tasks

No new Prisma models — `Dispute`, `DisputeEvidence`, `Payout`, `Transaction` all exist from I08 and I06.

### Admin dispute service

```ts
async listDisputes(filter: AdminDisputeFilter) { ... }

async getDispute(id: string) {
  return this.prisma.dispute.findUniqueOrThrow({
    where: { id },
    include: {
      booking: { include: { provider: { include: { user: true } }, client: true } },
      evidences: true,
    },
  })
}

async resolveDispute(adminId: string, id: string, dto: ResolveDisputeDto) {
  return this.prisma.$transaction(async (tx) => {
    const dispute = await tx.dispute.findUniqueOrThrow({ where: { id }, include: { booking: true } })
    await tx.dispute.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolution: dto.resolution,
        resolutionPct: dto.refundPct,
        resolvedAt: new Date(),
      },
    })
    // If partial refund, create a REFUND transaction
    if (dto.refundPct && dto.refundPct > 0) {
      const refundAmt = Math.round((dispute.booking.price ?? 0) * dto.refundPct / 100)
      await tx.transaction.create({
        data: {
          providerId: dispute.booking.providerId,
          type: "REFUND",
          bookingId: dispute.booking.id,
          amount: -refundAmt,
          feeAmt: 0,
          netAmt: -refundAmt,
          status: "COMPLETED",
          note: `Refund due to dispute ${id}: ${dto.resolution}`,
        },
      })
    }
    await this.activityLog.record(adminId, "DISPUTE_RESOLVED", { disputeId: id })
    return { dispute }
  })
}
```

### Admin payout service

```ts
async listPayouts(filter) { ... }

async batchComplete(adminId: string, ids: string[]) {
  return this.prisma.$transaction(async (tx) => {
    for (const id of ids) {
      const payout = await tx.payout.findUniqueOrThrow({ where: { id } })
      if (payout.status !== "PENDING") throw new BadRequestException(`Payout ${id} not PENDING`)
      await tx.payout.update({
        where: { id },
        data: { status: "COMPLETED", reference: `ADM-${id.slice(0, 6)}`, completedAt: new Date() },
      })
      await tx.transaction.updateMany({
        where: { payoutId: id },
        data: { status: "COMPLETED" },
      })
    }
    await this.activityLog.record(adminId, "PAYOUT_BATCH_COMPLETED", { ids })
  })
}

async hold(adminId: string, id: string, reason: string) { ... }
async release(adminId: string, id: string) { ... }
```

## Zod schemas

```ts
export const ResolveDisputeDto = z.object({
  resolution: z.string().min(10),                    // free text note
  refundPct: z.number().int().min(0).max(100).optional(),
  side: z.enum(["CLIENT", "PROVIDER", "NONE"]),      // who we sided with (for audit)
})

export const AdminDisputeFilterParams = z.object({
  status: DisputeStatus.optional(),
  severity: DisputeSeverity.optional(),
  country: z.enum(["CD", "CG"]).optional(),
  page: z.number().int().default(1),
  limit: z.number().int().default(20),
})

export const AdminPayoutFilterParams = z.object({
  status: PayoutStatus.optional(),
  operator: PayoutOperator.optional(),
  page: z.number().int().default(1),
  limit: z.number().int().default(20),
})

export const BatchCompletePayoutsDto = z.object({
  ids: z.array(z.string()).min(1),
})
```

## API client

```ts
export const adminApi = (client: ApiClient) => ({
  ...existing,
  // Disputes
  listDisputes: (params) => client.get<...>("/admin/disputes", params),
  getDispute: (id) => client.get<...>(`/admin/disputes/${id}`),
  resolveDispute: (id, dto) => client.post<...>(`/admin/disputes/${id}/resolve`, dto),
  investigateDispute: (id) => client.post<...>(`/admin/disputes/${id}/investigate`),
  escalateDispute: (id) => client.post<...>(`/admin/disputes/${id}/escalate`),
  // Payouts
  listPayouts: (params) => client.get<...>("/admin/payouts", params),
  batchCompletePayouts: (dto) => client.post<...>("/admin/payouts/batch-complete", dto),
  holdPayout: (id, reason) => client.post<...>(`/admin/payouts/${id}/hold`, { reason }),
  releasePayout: (id) => client.post<...>(`/admin/payouts/${id}/release`),
})

queryKeys.admin = {
  ...existing,
  disputes: (params) => ["admin", "disputes", params ?? {}],
  disputeDetail: (id) => ["admin", "disputes", "detail", id],
  payouts: (params) => ["admin", "payouts", params ?? {}],
}
```

## Frontend wiring

File: `apps/web/src/app/admin/page.tsx` + its sectional components (already exist from DS10 design, may be scaffolded or not yet implemented).

### Disputes section

Two-pane:
- Left: list with filters (status chip buttons: New / PendingPro / Investigating / Escalated / Resolved; severity buttons; country CD/CG)
- Right: detail pane — dispute header with ref + countdown, both sides' statements, evidences grid (click to full-screen), internal ops-notes textarea (local state; doesn't persist for this chunk), resolution actions row

Resolution flow:
1. Admin types a resolution note, optionally sets refund %, picks a side
2. Clicks "Résoudre" → `resolveDispute.mutate(...)` → dispute moves to RESOLVED

### Payouts section

Table + batch selection:
- Header row: checkbox "all" + Pro / Opérateur / Numéro / Jobs / Période / Montant / Statut / Action
- Per-row checkbox; footer sticky bar: "X sélectionnés · Σ montant · [Envoyer les paiements →]"
- Batch-complete action calls `batchCompletePayouts({ ids })`
- Single-row "Hold" / "Release" actions

## Fixtures to delete

- `VERIFICATION_QUEUE` — replaced by existing `/admin/providers?verificationStatus=UNDER_REVIEW` query
- `DISPUTES` — replaced by real data
- `PAYOUT_QUEUE` — replaced by real data
- `ADMIN_KPIS` — partially replaceable from existing `/dashboard/admin` stats; some fields may need new metrics

## Dependencies
- Depends on I05 (bookings from quotes), I06 (Payout model), I08 (Dispute model)
- Deferred by user guidance; not on the critical path
- Blocks I10 only if we decide to wire the admin UI. If deferred indefinitely, I10 doesn't wait.

## Acceptance criteria

1. Admin can filter and page through disputes
2. Admin can resolve a dispute with a side + optional refund %
3. Refund creates a REFUND Transaction visible in the pro's earnings
4. Admin can batch-complete pending payouts; status → COMPLETED with a ref
5. Admin can hold / release a payout
6. Activity log records admin actions (dispute resolution, payout batch complete)

## QA checklist
- [ ] Non-admin hitting any `/admin/*` route returns 403
- [ ] Dispute resolution with `refundPct=50` creates a REFUND transaction for half the booking price
- [ ] Batch-complete 3 pending payouts → all three move to COMPLETED with distinct ref codes
- [ ] Holding a payout with a reason prevents it from being batch-completed
- [ ] Releasing a held payout returns it to PENDING
- [ ] ActivityLog entries visible in admin activity feed (if wired)
- [ ] Sidebar counts (disputes: N / payouts: N) refresh after actions
- [ ] Resolving a dispute updates the booking-detail page's "Garantie KAYOU" section for both parties

## If this chunk is skipped for MVP

No downstream code breaks. Specifically:
- Payouts stay in PENDING forever (pros see them as pending; real settlement is a TODO)
- Disputes sit in the DB unresolved
- Admin dashboard shows empty sections for disputes + payouts (or 404s)

Recommendation: at minimum ship the `resolveDispute` endpoint so internal ops can unblock pros via curl, even without the UI. The payout batch action can be a manual SQL update for early launch.

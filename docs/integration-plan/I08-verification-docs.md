# I08 — Verification documents + KYC state

## Goal

Ship the trust-loop plumbing: a `VerificationDoc` model for ID/selfie/address/cert uploads, transition logic for the 5 KYC states (not_started / in_progress / in_review / verified / rejected), and a minimal pro-side dispute view. Wire the ProVerification screen on web + mobile.

## Why it matters

Verified pros are KAYOU's differentiator. Until docs are uploaded and reviewed, the "Vérifié" badge is fiction. This chunk creates the data plane for real verification — the admin review UI (I09) is deferred; for now, state transitions are triggered manually by a backend admin flag (or an automatic stub that moves anything in `in_review` to `verified` after 2 hours, configurable).

## Scope

### In scope
- Prisma: `VerificationDoc`, `Dispute`, `DisputeEvidence` models, related enums
- Backend module: `VerificationModule`
- Endpoints:
  - `GET /pro/verification/state` — current state + progress + uploaded docs + missing docs
  - `POST /pro/verification/documents` — upload a doc (URL of a pre-signed upload, placeholder)
  - `DELETE /pro/verification/documents/:id` — remove an uploaded doc
  - `POST /pro/verification/submit` — transition `in_progress` → `in_review`
  - `GET /pro/verification/dispute` — returns any pending dispute involving this pro
  - `POST /pro/verification/dispute/:id/respond` — pro submits their response
- Placeholder upload: `POST /pro/verification/documents` accepts a string URL (as if returned by a cloud storage pre-signed upload). For DS08 we're not wiring S3/Cloudinary; the URL is stored and rendered back.
- State transitions on backend (not just client-side `useState`)
- Evidence upload on dispute response (same URL placeholder pattern)

### Out of scope
- Cloud storage integration (S3 / Cloudinary / Supabase Storage) — backend accepts URL strings for now; real upload wiring is a future ticket
- Admin review UI to approve/reject documents (that's I09)
- KYC provider integration (Smile Identity / Veriff) — manual review only
- Dispute resolution by admin (I09)
- Automatic camera capture on mobile (uses file picker placeholder)

## Prisma migration

```prisma
enum VerificationDocKind {
  ID_FRONT
  ID_BACK
  SELFIE
  ADDRESS
  CERT_OPTIONAL
}

enum VerificationDecision {
  APPROVED
  REJECTED
}

model VerificationDoc {
  id               String @id @default(cuid())
  providerId       String
  provider         Provider @relation(fields: [providerId], references: [id])
  kind             VerificationDocKind
  url              String                          // pre-signed cloud URL (placeholder for now)
  fileName         String?
  fileSize         Int?
  mimeType         String?
  uploadedAt       DateTime @default(now())
  reviewedAt       DateTime?
  reviewedBy       String?                          // admin userId
  decision         VerificationDecision?
  rejectionReason  String?

  @@index([providerId, kind])
}

enum DisputeStatus {
  NEW
  PENDING_PRO
  PENDING_CLIENT
  INVESTIGATING
  ESCALATED
  RESOLVED
}

enum DisputeSeverity {
  LOW
  MEDIUM
  HIGH
}

enum DisputeOrigin {
  CLIENT
  PROVIDER
}

model Dispute {
  id              String @id @default(cuid())
  bookingId       String
  booking         Booking @relation(fields: [bookingId], references: [id])
  origin          DisputeOrigin
  openedById      String                              // User who opened
  reason          String                              // short label, from a preset or free text
  clientStatement String?
  proStatement    String?
  status          DisputeStatus @default(NEW)
  severity        DisputeSeverity @default(MEDIUM)
  resolution      String?
  resolutionPct   Int?                                // 0-100 if partial refund
  resolvedAt      DateTime?
  deadlineAt      DateTime?                            // e.g. pro has 24h to respond

  evidences       DisputeEvidence[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([bookingId])
  @@index([status, deadlineAt])
}

model DisputeEvidence {
  id          String @id @default(cuid())
  disputeId   String
  dispute     Dispute @relation(fields: [disputeId], references: [id], onDelete: Cascade)
  uploadedById String                                 // User who uploaded
  url         String
  note        String?
  uploadedAt  DateTime @default(now())
}
```

Add to Provider:
```prisma
model Provider {
  ...
  verificationDocs VerificationDoc[]
}
```

Migration: `prisma migrate dev --name add-verification-disputes`.

## State machine

Derive from data:

```ts
function getState(provider, docs): VerificationState {
  if (docs.length === 0) return "NOT_STARTED"
  if (provider.verificationStatus === "VERIFIED") return "VERIFIED"
  if (provider.verificationStatus === "REJECTED") return "REJECTED"
  if (provider.verificationStatus === "UNDER_REVIEW") return "IN_REVIEW"
  return "IN_PROGRESS" // docs uploaded but not submitted
}
```

The `provider.verificationStatus` column already exists (from v1). Extend it if the enum is missing `UNDER_REVIEW`.

Transitions:
- NOT_STARTED → IN_PROGRESS: first doc uploaded
- IN_PROGRESS → IN_REVIEW: `POST /pro/verification/submit` called and all required docs present
- IN_REVIEW → VERIFIED: admin approves (or stub: auto-transition after N hours — optional)
- IN_REVIEW → REJECTED: admin rejects (with reason)
- VERIFIED → IN_REVIEW: if admin revokes and re-queues
- REJECTED → IN_PROGRESS: pro re-uploads (after re-reading rejection reason)

## Zod schemas

```ts
export const VerificationDocKind = z.enum(["ID_FRONT", "ID_BACK", "SELFIE", "ADDRESS", "CERT_OPTIONAL"])
export const VerificationState = z.enum(["NOT_STARTED", "IN_PROGRESS", "IN_REVIEW", "VERIFIED", "REJECTED"])

export const VerificationDocSchema = z.object({
  id: z.string(),
  kind: VerificationDocKind,
  url: z.string().url(),
  fileName: z.string().nullable(),
  uploadedAt: z.string().datetime(),
  decision: z.enum(["APPROVED", "REJECTED"]).nullable(),
  rejectionReason: z.string().nullable(),
})

export const VerificationStateResponseSchema = z.object({
  state: VerificationState,
  progress: z.number().int().min(0).max(100),        // % complete
  docs: z.array(VerificationDocSchema),
  missingKinds: z.array(VerificationDocKind),
  rejectionReason: z.string().nullable(),
  submittedAt: z.string().datetime().nullable(),
  reviewedAt: z.string().datetime().nullable(),
})

export const UploadVerificationDocDto = z.object({
  kind: VerificationDocKind,
  url: z.string().url(),
  fileName: z.string().optional(),
  fileSize: z.number().int().optional(),
  mimeType: z.string().optional(),
})

export const DisputeStatus = z.enum(["NEW", "PENDING_PRO", "PENDING_CLIENT", "INVESTIGATING", "ESCALATED", "RESOLVED"])
export const DisputeSeverity = z.enum(["LOW", "MEDIUM", "HIGH"])

export const DisputeSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  reason: z.string(),
  clientStatement: z.string().nullable(),
  proStatement: z.string().nullable(),
  status: DisputeStatus,
  severity: DisputeSeverity,
  deadlineAt: z.string().datetime().nullable(),
  evidences: z.array(z.object({
    id: z.string(),
    url: z.string().url(),
    note: z.string().nullable(),
    uploadedAt: z.string().datetime(),
    uploadedBy: z.enum(["client", "pro", "ops"]),
  })),
})

export const RespondDisputeDto = z.object({
  statement: z.string().min(10),
  evidenceUrls: z.array(z.string().url()).max(5),
})
```

## API client

```ts
export const verificationApi = (client: ApiClient) => ({
  getState: () => client.get<VerificationStateResponseType>("/pro/verification/state"),
  uploadDoc: (data: UploadVerificationDocDtoType) =>
    client.post<{ doc: VerificationDocType }>("/pro/verification/documents", data),
  removeDoc: (id: string) => client.delete<{ success: true }>(`/pro/verification/documents/${id}`),
  submit: () => client.post<VerificationStateResponseType>("/pro/verification/submit"),
  getDispute: () => client.get<{ dispute: DisputeType | null }>("/pro/verification/dispute"),
  respondDispute: (id: string, data: RespondDisputeDtoType) =>
    client.post<{ dispute: DisputeType }>(`/pro/verification/dispute/${id}/respond`, data),
})

queryKeys.verification = {
  state: ["verification", "state"],
  dispute: ["verification", "dispute"],
}
```

## Frontend wiring

Web: `apps/web/src/app/pro/verify/page.tsx`

Replace the fixture-driven state machine with real queries:

```tsx
const { data: state } = useQuery({
  queryKey: queryKeys.verification.state,
  queryFn: () => verificationApi(apiClient).getState(),
})

const { data: dispute } = useQuery({
  queryKey: queryKeys.verification.dispute,
  queryFn: () => verificationApi(apiClient).getDispute(),
})

const uploadMut = useMutation({
  mutationFn: (data: UploadVerificationDocDtoType) => verificationApi(apiClient).uploadDoc(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.verification.state }),
})

const submitMut = useMutation({
  mutationFn: () => verificationApi(apiClient).submit(),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.verification.state }),
})
```

VerifyStatus component reads `state.state` and renders the correct color/icon/title/CTA from the existing config.

VerifyWizard: each step's "Prendre une photo" / "Téléverser" button:
1. Opens a native file picker (or a placeholder "pretend upload" that generates a stub URL)
2. Calls `uploadMut.mutate({ kind: "ID_FRONT", url: stubUrl, fileName, fileSize, mimeType })`
3. On success, the doc appears in the thumbnail preview

On wizard completion, calls `submitMut.mutate()` → state transitions to `in_review`.

DisputeView: reads `dispute`; renders both statements; composer posts via `respondDisputeMut`.

Mobile: same pattern in `apps/mobile/src/screens/pro/ProVerificationScreen.tsx`.

## Stub upload URL

Until cloud storage is wired, the "upload" flow on the frontend:

```tsx
const pretendUpload = async (file: File): Promise<string> => {
  // Return a placeholder URL. The file never actually leaves the device.
  // In dev: we store a data URL locally. In real: this is replaced by S3 pre-signed PUT + get URL.
  await new Promise((r) => setTimeout(r, 800))
  return `https://placeholder.kayou.cd/verification/${file.name}`
}
```

Backend accepts whatever URL string comes in. Admin (I09) will reject docs with suspicious URLs if we ever see them in production.

## Auto-verify stub (optional)

For dev / testing: a cron or a manual admin call can transition IN_REVIEW → VERIFIED after N hours. Not mandatory for I08, but useful so pros aren't stuck forever.

```ts
// cron or manual admin endpoint
async autoVerifyEligible() {
  const cutoff = subHours(new Date(), 2)
  const providers = await this.prisma.provider.findMany({
    where: { verificationStatus: "UNDER_REVIEW", updatedAt: { lt: cutoff } },
  })
  for (const p of providers) {
    await this.prisma.provider.update({
      where: { id: p.id },
      data: { verificationStatus: "VERIFIED" },
    })
  }
}
```

## Fixtures to delete

- `VerifyState` (client-side state constant in the prototype)
- `PRO_DISPUTE` (hardcoded dispute object)
- Wizard step state defaults

## Dependencies
- Depends on I07 (Provider row must exist to attach docs) — technically not a hard dep since VerificationDocs can be attached to any Provider row, but UX-wise the pro should finish onboarding first
- Blocks I09 (admin review of docs + disputes)
- Blocks I10

## Acceptance criteria

1. Pro opens `/pro/verify` without any prior docs → state is NOT_STARTED
2. Pro uploads the 3 required docs (ID_FRONT, ID_BACK, SELFIE, ADDRESS) → state transitions to IN_PROGRESS → IN_REVIEW after submit
3. Admin approves (manual DB update for now) → state transitions to VERIFIED on next query
4. Pro with a pending dispute sees the DisputeView with the client's statement and deadline
5. Pro submits a response → dispute status becomes PENDING_CLIENT (or moves to INVESTIGATING)
6. Fixtures removed

## QA checklist
- [ ] `grep -r "VerifyState\|PRO_DISPUTE" apps/` returns nothing
- [ ] Upload a doc → a VerificationDoc row created with correct kind
- [ ] Submit w/ missing required kind → error "Il manque: …"
- [ ] Submit w/ all required → state = IN_REVIEW
- [ ] Admin sets provider.verificationStatus = VERIFIED → `/pro/verify` shows success state on refetch
- [ ] Rejection with reason → UI shows the rejection reason + "Renvoyer les documents" CTA
- [ ] Dispute response submission stores `proStatement`
- [ ] Evidence URLs stored on DisputeEvidence rows
- [ ] Pro without a dispute: `getDispute()` returns `{ dispute: null }` and UI hides the dispute banner
- [ ] 2-device test: upload on device 1, check state on device 2 — should reflect immediately
- [ ] Placeholder URL is accepted (no strict URL validation against a known host)

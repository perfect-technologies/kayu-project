# KAYOU Integration Plan — Agent Handoffs

Copy-paste prompts for handing off each integration chunk to an implementation agent.

---

## Reusable prompt template

```
You are implementing integration chunk [IXX] of the KAYOU backend-wiring plan.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/integration-plan/00-overview.md
2. /Users/alainmk/startups/kayu-project/docs/integration-plan/PROGRESS.md
3. /Users/alainmk/startups/kayu-project/docs/integration-plan/[IXX-chunk-file].md
4. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md (for visual patterns when editing screens)

REFERENCE:
- Existing monorepo plan: /Users/alainmk/startups/kayu-project/docs/implementation-plan/
- Design plans v1 + v2 (for screen anatomy): /Users/alainmk/startups/kayu-project/docs/design-plan{,-v2}/
- Shared packages: /Users/alainmk/startups/kayu-project/packages/{api,schemas,ui}
- Prototype reference: /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/components/

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

HARD CONSTRAINTS:
- Zod schemas live in packages/schemas/src — define them FIRST, then backend uses them via ZodValidationPipe, then API client returns inferred types
- No `unknown` return types in packages/api — every endpoint function has a typed response
- Every new/wired screen has loading + empty + error states from @kayu/ui
- Delete fixtures as you wire their replacements
- Backend migrations land before frontend consumers
- Run `pnpm turbo run type-check` and `pnpm turbo run lint` before declaring done
- Update PROGRESS with: status, schema decisions, evidence (curl transcripts, screenshots)

WHEN DONE:
- List endpoints added + fixtures deleted
- Any schema decisions that affect downstream chunks (log in Decisions)
- Evidence: curl of the new endpoints returning 200 with real data; UI screenshot of the wired screen
```

---

## Ready-to-send prompts

### I01 — Messages wiring
```
You are implementing I01 of the KAYOU integration plan — swap DEMO_THREADS for the real /messages backend.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/integration-plan/00-overview.md
2. /Users/alainmk/startups/kayu-project/docs/integration-plan/PROGRESS.md
3. /Users/alainmk/startups/kayu-project/docs/integration-plan/I01-messages-wiring.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS04-messages.md (for visual intent)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Backend (messaging module) + @kayu/schemas + @kayu/api already exist. This chunk is a pure frontend swap: replace DEMO_THREADS with useQuery(messagesApi), replace send with useMutation, add loading/empty/error states, delete fixtures on both web and mobile. Keep SUGGESTED_REPLIES and COUNTRIES (static config).
```

### I02 — Auth OTP finalization
```
You are implementing I02 of the KAYOU integration plan — finalize Supabase SMS OTP.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/integration-plan/00-overview.md
2. /Users/alainmk/startups/kayu-project/docs/integration-plan/PROGRESS.md
3. /Users/alainmk/startups/kayu-project/docs/integration-plan/I02-auth-otp-finalize.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS02-auth.md

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Replace the mock step advancement in Auth screens with real supabase.auth.signInWithOtp + verifyOtp calls. If the returned user has a role, skip DoneStep. If not, DoneStep calls PATCH /me/role. Remove DEMO_ACCOUNTS dev panel from both web and mobile. Confirm Supabase project SMS provider is configured for CD (+243) and CG (+242).
```

### I03 — Provider Dashboard data
```
You are implementing I03 of the KAYOU integration plan — expand GET /dashboard/provider and wire both platforms.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/integration-plan/00-overview.md
2. /Users/alainmk/startups/kayu-project/docs/integration-plan/PROGRESS.md
3. /Users/alainmk/startups/kayu-project/docs/integration-plan/I03-provider-dashboard-data.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS06-provider-dashboard.md

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Expand the backend response (today's schedule + new requests + stats with sparklines + availability). Add Zod schemas. Replace TODAY_JOBS / NEW_REQUESTS / STATS fixtures with useQuery(queryKeys.dashboard.provider). Wire availability toggle mutation. The newRequests section can return an empty array until I04 ships.
```

### I04 — Job Requests module
```
You are implementing I04 of the KAYOU integration plan — new JobRequest domain.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/integration-plan/00-overview.md
2. /Users/alainmk/startups/kayu-project/docs/integration-plan/PROGRESS.md
3. /Users/alainmk/startups/kayu-project/docs/integration-plan/I04-job-requests.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS07-requests-quote.md

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Ship new Prisma models (JobRequest, JobRequestMatch), NestJS module, endpoints for both client (create/mine/cancel) and pro (inbox/detail/dismiss). Build a simple matching service that fans out to top-N matching pros on creation. Update provider dashboard to populate newRequests from the match data. Delete INCOMING_REQUESTS + PRO_ACTIVE_JOBS fixtures (active jobs come from bookings, not a separate fixture).
```

### I05 — Quote / Devis module
```
You are implementing I05 of the KAYOU integration plan — Quote + QuoteLineItem domain.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/integration-plan/00-overview.md
2. /Users/alainmk/startups/kayu-project/docs/integration-plan/PROGRESS.md
3. /Users/alainmk/startups/kayu-project/docs/integration-plan/I05-quote-devis.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS07-requests-quote.md

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Prisma: Quote + QuoteLineItem + QuoteStatus. Server-side total/commission computation (10%, stored on quote). Pro endpoints: create/update/send/list/detail. Client endpoints: detail/accept/decline. Accept creates Booking in a transaction + marks JobRequest as MATCHED. Wire QuoteCompose (web + mobile) to the backend; PRESET_LINE_ITEMS stays as static catalog. Build minimal client-side quote view on job-request detail page.
```

### I06 — Earnings + Mobile Money payouts
```
You are implementing I06 of the KAYOU integration plan — Transaction + Payout domain.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/integration-plan/00-overview.md
2. /Users/alainmk/startups/kayu-project/docs/integration-plan/PROGRESS.md
3. /Users/alainmk/startups/kayu-project/docs/integration-plan/I06-earnings-payouts.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS08-earnings.md

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Prisma: Transaction + Payout + TransactionType + PayoutOperator + PayoutStatus. When a Booking transitions to COMPLETED, auto-create an EARNING transaction. GET /pro/earnings/summary returns weekly chart data + balance/pending/lifetime. GET /pro/earnings/transactions paginates. POST /pro/earnings/payouts STUBS the PSP call (creates Payout in PENDING, no real money moves) — this is explicit, document the TODO. Delete EARNINGS_WEEKLY + TRANSACTIONS + BALANCES fixtures.
```

### I07 — Provider Onboarding draft + publish
```
You are implementing I07 of the KAYOU integration plan — server-persist the onboarding draft.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/integration-plan/00-overview.md
2. /Users/alainmk/startups/kayu-project/docs/integration-plan/PROGRESS.md
3. /Users/alainmk/startups/kayu-project/docs/integration-plan/I07-onboarding-persist.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS09-onboarding-verification.md

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Add User.onboardingStep + Provider.onboardingCompleteAt. Endpoints: GET /me/provider-draft, PATCH (partial merge), POST /me/provider-publish (validates + creates full Provider record atomically). Frontend: debounced 600ms PATCH on field change. Resume at the saved step on mount. Delete INITIAL_DATA fixture. Keep localStorage as optimistic cache.
```

### I08 — Verification documents + KYC state
```
You are implementing I08 of the KAYOU integration plan — VerificationDoc + Dispute domain.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/integration-plan/00-overview.md
2. /Users/alainmk/startups/kayu-project/docs/integration-plan/PROGRESS.md
3. /Users/alainmk/startups/kayu-project/docs/integration-plan/I08-verification-docs.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS09-onboarding-verification.md

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Prisma: VerificationDoc, Dispute, DisputeEvidence + enums. Endpoints: GET /pro/verification/state (derives state from data), POST documents (accepts URL string — cloud storage is out of scope, placeholder URL OK), POST submit (→ IN_REVIEW). Dispute endpoints for pro response. Wire ProVerification screen on both platforms. Delete VerifyState + PRO_DISPUTE fixtures.
```

### I09 — Admin disputes + payouts (deferred/optional)
```
You are implementing I09 of the KAYOU integration plan — admin dispute + payout operations.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/integration-plan/00-overview.md
2. /Users/alainmk/startups/kayu-project/docs/integration-plan/PROGRESS.md
3. /Users/alainmk/startups/kayu-project/docs/integration-plan/I09-admin-disputes-payouts.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS10-admin-ops.md

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Backend-only for this chunk (admin UI is DS10 scope). Endpoints: list/detail/resolve/investigate/escalate disputes; list/batch-complete/hold/release payouts. Dispute resolution can create a REFUND transaction. Wire AdminOps sections (DS10 screen) if time permits, else leave the endpoints and note in PROGRESS that UI wiring is future work.
```

### I10 — Fixture sweep + E2E audit
```
You are implementing I10 of the KAYOU integration plan — the cleanup chunk.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/integration-plan/00-overview.md
2. /Users/alainmk/startups/kayu-project/docs/integration-plan/PROGRESS.md
3. /Users/alainmk/startups/kayu-project/docs/integration-plan/I10-fixture-sweep-audit.md

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This is audit + cleanup, not new build. Run the fixture grep (data constants must be zero), verify every wired screen has loading/empty/error, walk the full client + pro E2E smoke tests against a dev backend, update DEVELOPER_GUIDE with the current domain list, and close PROGRESS with done statuses + open TODOs (real PSP, cloud storage, admin UI, WebSockets, automated tests).
```

---

## Parallelization recipe

**Week 1 — Easy wins + infrastructure**
- Agent A: I01 (Messages wiring)
- Agent B: I02 (Auth OTP)
- Agent C: I07 (Onboarding persist)

**Week 2 — Pro surface data**
- Agent A: I03 (Dashboard expansion)
- Agent B: I04 (Job Requests) — critical for I05
- Agent C: I06 (Earnings) — parallel with I04

**Week 3 — Remaining pro + trust**
- Agent A: I05 (Quote) — waits for I04
- Agent B: I08 (Verification docs)

**Week 4 — Cleanup**
- Agent A: I10 (sweep + audit)

**Later, when business is ready**
- Agent X: I09 (admin disputes + payouts)

## Working agreement

1. **Zod-first contract.** `@kayu/schemas` before backend DTO before API client. No reverse order.
2. **No fixture stays alive as a "safety net".** If a wired screen breaks without its fixture, fix the wire, don't leave the fixture.
3. **Every new endpoint has a curl transcript** in the agent's handoff report (as evidence).
4. **Loading, empty, error on every wired screen.** No exceptions.
5. **Schema migrations land before frontend consumers.** CI should fail if you reference a type that doesn't exist in @kayu/schemas.
6. **Role-gated endpoints ship with tests** that confirm the 403.
7. **Mobile Money payout + cloud storage + KYC provider** are all explicit stubs until their respective tickets wire real providers.

# Phase 2: Actions and memory

Reference: `../RFC-001-agent-concierge.md`, builds on `phase-1-foundation.md`

## Goal

The client books without leaving the conversation, with an approval card before anything is written. The agent knows the client's history and opens with it. Cost is capped and observable.

## Scope

In:

- Write tools with approval: `create_booking`, `create_job_request`.
- Read tool `get_my_activity`.
- Approval cards, status card, address card.
- Profile block (RFC §9) and personal chips.
- Caps and daily limits (RFC §11), usage dashboard numbers.
- Rolling summary compaction.

Out (Phase 3): mobile, agent notes, evals.

## Tasks

### 1. Write tools

- In `agent.tools.ts`, add `create_booking` and `create_job_request`. Inputs reuse the existing create DTOs from `packages/schemas`, narrowed to the fields the agent fills. `execute` calls `BookingsService.create(actor, body)` and `JobRequestsService.create(actor, input)`.
- In `runTurn`, pass `toolApproval: { create_booking: () => 'user-approval', create_job_request: () => 'user-approval' }` to `streamText`. Approval is a call-level policy in AI SDK 7, so read tools stay unlisted and a later agent can reuse the same tool set with a different policy.
- `toModelOutput` returns id and status only.
- Add `get_my_activity` returning open bookings and job requests for the actor with status and provider name.
- Server-side rule in `runTurn`: the request body may contain only a new user message or approval responses. Any other client-supplied part is rejected with 400. History always comes from the database.

### 2. Approval UI

- `useChat` gets `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses`.
- `packages/ui/src/web/agent/ApprovalCard` renders parts in state `approval-requested` for the two write tools. It shows every argument in plain French (prestataire, service, adresse, date, notes). Buttons "Confirmer" and "Annuler" call `addToolApprovalResponse` with the approval id.
- After execution, the same part in its output state renders as a `StatusCard` with a link to `/bookings/[id]` or the client requests page.
- `AddressCard` renders the client's recent addresses as choices when the agent asks for one; picking sends the address text and metadata.

### 3. Profile block

- `agent.profile.ts` builds the block from: identity (first name, default city), recent addresses (top 3), last three completed bookings with provider, subcategory, date, rating, favorites (top 5), open bookings and job requests.
- Rendered as a second system message after the frozen prompt, with its own cache marker.
- Personal chips: `GET /agents/suggestions` returns up to three French chips derived from the same data ("Rappeler {provider} pour {subcategory}", "{subcategory} à {commune} comme la dernière fois"). Web merges them ahead of generic chips.

### 4. Prompt updates

- Add the rules for actions: propose before booking, confirm commune and date before calling `create_booking`, offer `create_job_request` when search returns fewer than one usable provider, say "demande envoyée, le prestataire doit confirmer" after a booking.
- Add the fallback wording and the honesty rule from RFC §4.3.

### 5. Caps and compaction

- `SystemSetting` keys: `agent.maxStepsPerTurn` (8), `agent.maxMessagesPerConversation` (60), `agent.maxTurnsPerUserPerDay` (30). Read once per turn.
- Turn cap exceeded: 429 with a French message the composer shows.
- Conversation cap reached: the turn still runs, the response metadata flags `conversationFull`, the web offers "Nouvelle conversation" and archives the old one on click.
- Compaction: when stored messages exceed 40, summarize the oldest 20 into `summary` with a low-effort call in a separate job after the turn, then mark those messages as compacted (a `compactedAt` column added in this phase). `runTurn` sends summary plus the uncompacted tail.

### 6. Observability

- Per assistant message metadata: model, input, output, cached tokens, steps, tools with durations, latency, finish reason.
- Admin dashboard: conversations per day, bookings created via agent, job requests created via agent, fallback rate, average tokens per conversation. Backed by a `StatsService` query, tested with the existing fake pattern.

### 7. Tests

- Tools: write tools reject when the actor is not a client, pass the actor through, and never read a user id from input.
- `runTurn` rejects client-supplied tool parts.
- Profile builder: deterministic output for a fixed fake dataset, empty sections omitted.
- Caps: turn cap and daily cap return the right errors.
- Compaction: after the threshold, the model receives summary plus tail, and stored messages are untouched.

## Acceptance criteria

- A booking created through the agent is indistinguishable in the database from one created on `/book/[providerId]`.
- Denying an approval leads to the agent asking what to change, with no write.
- A client with one completed booking sees a personal chip naming that provider.
- The daily cap blocks the 31st turn with a French message.
- Dashboard numbers match a manual count on seeded data.

## Verification checklist

- Book a provider end-to-end on mobile width; confirm the provider sees the pending booking in their dashboard.
- Trigger the fallback in a commune with no providers; confirm a job request appears in `/pro/requests` for a matching provider.
- Force a compaction and read the stored summary for accuracy.

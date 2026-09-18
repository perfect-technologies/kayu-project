# Phase 2: Actions and memory

Reference: `../RFC-001-agent-concierge.md` (revision 2), builds on `phase-1-foundation.md`

## Goal

The client messages or books without leaving the conversation, with an approval card before anything is written. The agent knows the client's history and opens with it. Cost is capped and observable.

## Owns

- Everything Phase 1 owns.
- `apps/backend/src/modules/admin/**` for the overview block only; `apps/web/src/app/(shell)/admin/**` for the matching tile.

## Must not touch

- Bookings, messaging, addresses service logic. The tools call them as they are.
- `apps/mobile`. Out of scope.

## Scope

In:

- Write tools with approval: `create_booking`, `send_message`. Read tool `get_my_activity`.
- Approval cards, status card, address card.
- Profile block (RFC §9) and personal chips.
- Caps and daily limits (RFC §11), admin overview numbers.
- Rolling summary compaction.
- Reviews the client wrote, in the profile block (RFC §17).

Out (Phase 3): the conversation list, starting a conversation on demand, archiving, deleting. Out (Phase 4): evals, model selection, agent notes, promotion.

## Tasks

### 1. Write tools

- `create_booking`: input is the existing `CreateBookingDto`. `execute` calls `BookingsService.create(actor, input)`. `clientPhone` defaults to the actor's phone; the prompt asks only when absent. Address: `addressId` from the address book, or `placeId` + `addressLine` + coordinates for a new one.
- `send_message`: input `providerId`, `body`, `subject?`. `execute` calls `MessagingService.start(actor, input)`.
- `get_my_activity`: open bookings with status and slot label, last conversations, saved addresses.
- In `runTurn`, pass `toolApproval: { create_booking: () => 'user-approval', send_message: () => 'user-approval' }`. When `feat_booking` is off, omit `create_booking` from the tool set for the turn and state it in the turn facts.
- Tool errors: 409 `SLOT_TAKEN` and 403 blocked return as tool errors with their French message; the prompt tells the model to refetch availability on 409.
- Server rule: the request body may contain only a new user message or approval responses. Anything else is 400. History always comes from the database.

### 2. Approval UI

- `useChat` gets `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses`.
- `BookingApprovalCard`: provider, date and time in the provider timezone, phone, address (saved label with place chain, or the new line), notes. "Confirmer" gold pill, "Annuler" outline. Calls `addToolApprovalResponse`.
- `MessageApprovalCard`: provider and the message text in an editable textarea (4000 chars, counter). Editing sends a new user message with the revised text and denies the pending call, so the model re-emits with the new body. "Envoyer" and "Annuler".
- After execution the part renders as `StatusCard`: booking status pill and link to `/reservation/[id]`, or "Message envoyé" with a link to `/messagerie?c=[id]`.
- `AddressCard`: saved addresses as pill choices when the agent asks for one; "Nouvelle adresse" opens `AddressAutocomplete` and `LocationFields` from the public components, creating the address through the existing addresses endpoint. When the client answered the Phase 1 location question with a place and has no address, the card offers to save it as the default address so the agent never asks again.

### 3. Profile block

- `agent.profile.ts` builds the block from identity, address book, last three completed bookings with provider, category, date and the rating given, open bookings, last three conversations, reviews written.
- Second cached system message after the frozen prompt.
- `GET /assistant/suggestions` returns up to three personal French chips ("Recontacter {provider}", "Réserver à nouveau : {category}", "Comme la dernière fois à {place}"). The web merges them ahead of generic chips.

### 4. Prompt updates

- Location: the default location from the turn facts is also the default booking address when it comes from the address book; confirm it in the approval card rather than asking again.
- Actions: propose before booking, confirm place, date and time before `create_booking`, offer `send_message` when contacts are locked or the client hesitates, say "demande envoyée, le prestataire doit confirmer" after a booking, never "il arrive".
- Do not recommend a provider the client rated 2 or below without saying so.

### 5. Caps and compaction

- `SystemSetting` keys `agent.maxStepsPerTurn` (8), `agent.maxMessagesPerConversation` (60), `agent.maxTurnsPerUserPerDay` (30), seeded in `seed-settings.ts`.
- Daily cap: 429 with a French message the composer shows.
- Conversation cap: the turn runs, metadata flags `conversationFull`, the web offers "Nouvelle conversation" and archives the old one.
- Compaction: past 40 stored messages, summarize the oldest 20 into `summary` with a low-effort call after the turn, set `compactedAt` on them (column added in this phase). `runTurn` sends summary plus the uncompacted tail.

### 6. Observability

- Metadata per assistant message: model, tokens, steps, tools with durations, latency, finish reason.
- Admin overview: conversations today, messages sent and bookings created through the agent, fallback rate. Backed by a query in the admin service, tested with the fake pattern, rendered as one tile on `/admin`.

### 7. Tests

- Write tools: role check through the service, actor passed through, no user id from input, phone defaulted from the actor.
- `runTurn` rejects client-supplied tool parts and omits `create_booking` when the flag is off.
- Profile builder: deterministic output for a fixed fake dataset, empty sections omitted, low ratings surfaced.
- Caps: turn and daily caps return the right errors.
- Compaction: after the threshold the model receives summary plus tail, stored messages untouched.

## Acceptance criteria

- A booking created through the agent is identical in the database to one created by the profile page's booking form, including snapshots.
- A message sent through the agent appears in `/messagerie` for both parties with a `NEW_MESSAGE` notification for the provider.
- Booking a slot another client took in parallel produces the 409 path: the agent shows fresh slots.
- Denying an approval leads to the agent asking what to change, with no write.
- A client with one completed booking sees a personal chip naming that provider.
- The daily cap blocks the 31st turn with a French message.
- Admin tile numbers match a manual count on seeded data.

## Verification checklist

- Book and message end to end at 390 px; confirm the provider sees the pending booking on `/mon-espace` and the message in `/messagerie`.
- Trigger the fallback ladder in a quartier with no providers and read each step's sentence.
- Force a compaction and read the stored summary for accuracy.
- Screenshots under `docs/ai-agents/screenshots/02/`.

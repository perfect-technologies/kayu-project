# RFC-001: Agent concierge

- Status: Draft, revision 2
- Date: 2026-09-17 (revision 1 on 2026-09-15)
- Author: Alain MK
- Scope: web `/assistant`, backend `agent` module. Mobile deferred (see §2).

## 0. What changed in revision 2

The K-YOU UX refactor (`docs/kyou-ux-refactor/`, merged to `main` on 2026-09-17) replaced the product model, the schema, the routes, and the design system. Revision 1 of this RFC was written against the old marketplace. Revision 2 re-plans the agent on the new contract. The differences that matter:

| Area | Revision 1 | Revision 2 |
|---|---|---|
| Product flow | Search, book, or broadcast a job request for quotes | Contact-first: search, open profile, message or call, book a slot, provider confirms |
| Fallback when nothing matches | Create a job request | Widen the place, then the category, then hand off to search. Job requests no longer exist |
| Location | Free-text city and commune | `Place` tree (country, province, city, commune, quartier) with ids and aliases |
| Taxonomy | Two levels | Three levels, provider stores the deepest node |
| Booking | Free date, price, duration | A slot from the provider's real schedule, phone required, address from the address book, 409 on a taken slot |
| Memory sources | Bookings, favorites, recent addresses | Bookings, address book, conversations. Favorites are gone |
| Messaging | Not a tool | `send_message` is a write tool, since contact is the primary action |
| Route | `/agents` | `/assistant`, French like every other route |
| UI | Shared components in `packages/ui`, old design direction | Components under `apps/web/src/components/assistant/`, K-YOU tokens and hard rules from the product contract |
| Mobile | Phase 3 Expo screen | Out of scope. `apps/mobile` is frozen and must first be migrated to the new system in its own workstream. The web is the mobile experience |
| Model access | Direct provider package | Vercel AI Gateway: one key, model chosen by id string |
| Existing code | None | `feat/agent-concierge-phase-1` (commit `6bb6dca`) holds a Phase 1 built on the old contract. It is a reference, not a base to rebase |

Everything below is the current design. Revision 1 is in git history.

## 1. Summary

Today a client finds a provider by searching, filtering, and opening profiles. The agent concierge gives them a second door: they say what they need ("un plombier pour une fuite sous l'évier, à Gombe, demain matin"), and the platform answers with matching providers as interactive cards, checks real slots, and, on the client's confirmation, sends a message or books.

The agent is a front door over capabilities the backend already has after the refactor: provider search over the place tree, public profiles with contact gating, availability from the schedule, bookings with slot locking, conversations, addresses, notifications. It introduces a model-driven loop that decides which of those services to call, and a UI that renders results as cards instead of pages. It introduces no new marketplace mechanics.

## 2. Goals and non-goals

Goals:

- A client goes from "what I need" to a sent message or a pending booking without leaving the conversation.
- The agent proposes, the client decides. Every action with side effects requires explicit confirmation in the UI.
- The agent knows the client: past providers, addresses, open bookings, recent conversations. It suggests before it asks.
- When nothing matches, the agent widens the search itself before giving up, and never invents supply.
- Same backend and stream for the future mobile screen.

Non-goals for v1:

- Guest access. Authenticated clients only.
- Provider-side agent.
- Proactive messages from the agent.
- Voice, images of the problem, payment. Nothing is paid on the platform anyway.
- Learned or vector memory (§9).
- MCP or any external tool exposure (§14).
- Mobile, entirely. `apps/mobile` is frozen against the pre-refactor API and must be migrated to the new system before any agent work touches it. Nothing in these documents plans, specifies, or estimates a mobile screen. The backend endpoints and stream are designed so a future mobile client can use them unchanged.

## 3. Product decisions

| Decision | Choice |
|---|---|
| Placement | `/assistant` beside the marketplace home. A navbar pill for clients and a text link under the home search bar in Phase 1. Promotion (a dock tab, a hero action) is decided in Phase 3 from funnel numbers. |
| Access | Authenticated `CLIENT` role only. Providers are redirected to `/mon-espace` like other client-only screens. |
| Language | French only, like the rest of the app. Lingala and mixed input tolerated. Copy in `apps/web/src/copy/assistant.ts`. |
| Loop location | Backend (NestJS). Web is a thin client. |
| SDK | Vercel AI SDK v7 (`ai` 7.x, `@ai-sdk/react` 4.x). Models are reached through the Vercel AI Gateway (`createGateway`, one `AI_GATEWAY_API_KEY`), never through per-vendor provider packages. Switching models is a change of id string, as the old branch already did. |
| Model | `anthropic/claude-opus-5` on the gateway for the build. Production model chosen by the Phase 3 eval (§11). |
| Feature flags | `feat_booking` off removes the booking tool for the turn and the agent says so. `contacts_require_premium` is respected through the profile service, never bypassed. |
| Existing branch | Phase 1 is rebuilt on `main`, using the branch for the loop, persistence, streaming, and spec patterns. The branch is deleted after Phase 1 merges. |

## 4. User experience

### 4.1 Entry

`/assistant` renders inside the shell (navbar, dock, no footer). It opens on a greeting, a pill composer like the home search bar (gold circle submit), and a row of chips:

- Personal chips from the profile block (§9): "Recontacter Jean K.", "Réserver à nouveau : Plomberie", "Comme la dernière fois à Gombe".
- Generic chips from the top categories: "Un plombier pour une fuite", "Un électricien", "Ménage cette semaine".

Tapping a chip sends it as the first message. Free text is always available.

### 4.2 Turn shape

The agent answers with one or two short sentences plus cards. It is not a chatbot that explains itself. A first answer is one sentence and up to three provider cards. Card actions send a structured message back into the conversation, so tapping "Choisir" equals typing "je choisis ce prestataire".

Cards for v1:

| Card | Rendered from | Actions |
|---|---|---|
| Provider list | `search_providers` | Choose, open `/prestataire/[id]` |
| Provider detail | `get_provider` | Message, see slots, open profile. Contact buttons only when the DTO has contacts |
| Availability | `get_provider_availability` | Pick a slot |
| Address | profile block or `get_my_activity` | Pick a saved address, or type a new one |
| Message approval | `send_message` approval request | Edit text, send, cancel |
| Booking approval | `create_booking` approval request | Confirm, cancel |
| Status | booking or conversation state | Open `/reservation/[id]` or `/messagerie?c=` |

The provider card is the search `ProviderCard` from the public screens with a select action, not a new design. Every list has the contract's dashed empty state. While a tool runs, the card area shows `ProviderCardSkeleton` tiles. Skeletons, never spinners.

### 4.3 Default location

"Je veux un plombier" is the normal message. The client should not have to say where. The agent assumes the client's own location and says so in passing ("à Gombe, près de chez vous"), and only asks when it knows nothing.

Resolution order, computed server-side before every turn and injected as a turn fact:

1. The default address in the address book: its place chain (city, commune, quartier) and label.
2. Otherwise `User.placeId` and its chain.
3. Otherwise nothing is known.

Rules:

- Known location: search there without asking. Use the deepest known node; the fallback ladder widens if needed. Mention the assumption in the answer so the client can correct it.
- Client names a place in the message: that place wins for this request, resolved through `find_place`. It does not overwrite the stored location.
- Client corrects ("non, c'est pour ma mère à Limete"): use the corrected place for the rest of the conversation.
- Nothing known: ask once, in one short question. Phase 1 keeps the answer for the conversation. Phase 2 offers to save it as the default address through the address card, so the question never repeats.

Registration does not collect a place today. That is the real fix for "everyone has an address" and belongs to the account screens, outside this RFC. The agent must work either way.

### 4.4 Honesty about state

Booking through the agent creates a `PENDING` booking exactly as the profile page's booking form does. The provider still confirms or cancels. The agent says "demande envoyée, le prestataire doit confirmer" and never "il arrive". A message sent through the agent lands in the same conversation the messaging screen shows. Status changes reach the client through existing notifications, and the status card reflects the real state when the conversation is reopened.

### 4.5 Fallback ladder

When search returns nothing usable, the agent tries, in order, saying one sentence each time:

1. Widen the place to its parent (quartier to commune, commune to city) using the place ancestors.
2. Drop from the subcategory to its category.
3. Propose messaging the nearest match with a note that it is outside the requested area.
4. Hand off to `/rechercher` with the criteria in the URL.

It never fabricates a provider and never suggests a service KAYOU does not list.

### 4.6 Contact gating

The profile service already hides phone, WhatsApp and email when `contacts_require_premium` is on and the provider is on the free tier. The model never receives contact fields at all; only the UI card gets them, from the same DTO the profile page uses. When contacts are locked, the agent says so in one line and points to `/premium`, and offers in-app messaging, which is always available.

## 5. Architecture

```
web /assistant (useChat) ──► POST /api/assistant/conversations/:id/messages  (SSE UI message stream)
                                        │
                                        ▼
                    AgentService.runTurn(actor, conversation, newMessage)
                                        │
        ┌───────────────┬───────────────┼───────────────┬───────────────┐
        ▼               ▼               ▼               ▼               ▼
  PlacesService  ProvidersService  Availability   BookingsService  MessagingService
        │               │               │               │               │
        └───────────────┴───────── Prisma / Postgres ───┴───────────────┘
```

- The client sends only the new user message or approval responses. History comes from the database. The server appends, runs the loop, streams, and persists the assistant message when the stream finishes.
- The loop is `streamText` with tools and `stopWhen: stepCountIs(N)`. The result stream is wrapped with `toUIMessageStream` (carrying `originalMessages` and `onFinish`) and piped with `pipeUIMessageStreamToResponse`.
- Tools are thin wrappers over the services listed above. They receive the authenticated actor through closure, never from model input. Every call passes the actor as the viewer, so blocks, hidden providers, suspended users, and contact gating apply exactly as on the REST routes.
- AI SDK 7 is ESM-only and needs Node 22 or newer. The backend is CommonJS on Node 24. The old branch solved the interop; Phase 1 re-verifies its solution on `main` before feature code.
- Model access goes through the AI Gateway. `agent.model.ts` is the only file that creates the gateway and names a model id; cache markers and thinking options live there too and are passed as Anthropic provider options through the gateway.

Why the backend and not a Next.js route handler: tools call services directly with the actor already resolved by `SupabaseGuard` and `ActorGuard`, persistence sits next to Prisma, and the future mobile client does not depend on the web app.

## 6. Data model

Added on top of the `0_init` baseline as its own migration.

```prisma
enum AgentConversationStatus { ACTIVE ARCHIVED }
enum AgentMessageRole { USER ASSISTANT SYSTEM }

model AgentConversation {
  id            String  @id @default(cuid())
  userId        String
  user          User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  status        AgentConversationStatus @default(ACTIVE)
  title         String?
  summary       String?          // rolling summary of trimmed turns (§8)
  stepCount     Int      @default(0)
  lastMessageAt DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  messages      AgentMessage[]

  @@index([userId, lastMessageAt])
}

model AgentMessage {
  id             String   @id          // UIMessage id
  conversationId String
  conversation   AgentConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           AgentMessageRole
  parts          Json                  // UIMessage.parts as emitted by the SDK
  metadata       Json?                 // usage, steps, tools called, latency (§12)
  createdAt      DateTime @default(now())

  @@index([conversationId, createdAt])
}
```

`User` gains `agentConversations AgentConversation[]`. Account deletion (`DELETE /me`) cascades through the relation. Messages are stored as the SDK's `UIMessage` shape so the client rehydrates without transformation. Tool parts keep the full output for rendering; the model sees the compact form (§8).

Phase 2 adds `AgentMessage.compactedAt`. Phase 3 adds `AgentMemoryNote` (§9).

## 7. Tools

Seven tools. Read tools run automatically. Write tools require approval through the `toolApproval` setting on the generation call (AI SDK 7), not on the tool definition.

| Tool | Kind | Wraps | Input (Zod) | Model sees |
|---|---|---|---|---|
| `find_place` | read | `PlacesService.list({ q, kind? })` plus `ancestors` | `q`, `kind?` | up to 5 places: id, label, kind, chain of labels |
| `search_providers` | read | `ProvidersService.search(query, actor)` | `placeId`, `subcategoryId?`, `categoryId?`, `q?`, `minRating?`, `verifiedOnly?`, `sort?`, `limit ≤ 6` | id, display name, category chain, place labels, rating, review count, tier, verified, indicative price |
| `get_provider` | read | `ProvidersService.getPublicProfile(id, actor)` | `providerId` | description excerpt, skills, languages, modes, price, schedule summary, `contactsLocked`, review count. Never phone, WhatsApp, email, or exact coordinates |
| `get_provider_availability` | read | `ProvidersAvailabilityService.computeForDate` per date | `providerId`, `dates[] ≤ 7` (YYYY-MM-DD) | timezone, slot duration, slots per date |
| `get_my_activity` | read | `BookingsService.list`, `MessagingService.list`, `AddressesService.list` | none | open bookings with status and slot label, last conversations with provider names, saved addresses with labels |
| `create_booking` | write, approval | `BookingsService.create(actor, input)` | the existing `CreateBookingDto` (`providerId`, `date`, `time`, `clientPhone`, `clientNotes?`, `addressId?` or `placeId` + `addressLine` + coordinates) | booking id, status, slot label |
| `send_message` | write, approval | `MessagingService.start(actor, { providerId, subject?, body })` | `providerId`, `body`, `subject?` | conversation id |

Rules:

- The taxonomy (19 categories, their subcategories and level-3 nodes, names and ids) is injected into the cached system prompt (§8). The model maps intent to the deepest node it can justify. Places are not injected; they are curated and grow, so `find_place` resolves them with aliases.
- Every tool validates input with the same Zod DTOs the REST controllers use, then calls the service. Service rules (role, ownership, blocks, feature flags, slot locking, self-booking) apply unchanged.
- `create_booking` returning 409 `SLOT_TAKEN` is a tool error the model receives. The prompt tells it to refetch availability and offer the next slots.
- `clientPhone` is prefilled from the actor's phone. The agent asks only when the account has none.
- Each tool defines `toModelOutput` returning the compact summary. The UI receives the full output through the tool part.
- Tool descriptions are in French.

## 8. Context management

Per request, the model receives, in this order, stable first for cache hits:

1. System prompt: role, tone, rules, the taxonomy, the card contract, the fallback ladder. Frozen text, cached.
2. Profile block (§9). Changes rarely, cached separately.
3. Turn facts: today's date in Africa/Kinshasa, the client's default location (§4.3) as place ids and labels, feature flags. Small and volatile, after the cache markers.
4. Conversation: the rolling summary if any, then the last N messages with tool parts in compact form.
5. The new user message or approval response.

Trimming: past a message budget, the oldest turns are summarized into `AgentConversation.summary` by a separate low-effort call after the turn, and only the tail is resent.

Caching: system prompt and profile block carry Anthropic cache markers through provider options. The Phase 1 acceptance test checks `cache_read_input_tokens` is non-zero on the second turn.

## 9. Memory

v1 memory is deterministic and explainable. At the start of every turn the profile block is rebuilt from the database:

- First name, phone present or not.
- Default location (§4.3): the default address's place chain or the user's place, with ids so the model can search without a `find_place` call.
- Address book: labels, lines, place chains, which one is default.
- Last three completed bookings: provider id and name, category, date, rating given.
- Open bookings with status.
- Last three conversations: provider id and name, last message date.

This is what lets the agent open with "Jean K. vous a fait la plomberie en juillet, vous voulez le recontacter ?" and generates the personal chips. No model output is stored as memory in v1 and v2.

Phase 3 adds `AgentMemoryNote`: short notes the agent writes through a `remember` tool ("préfère le matin"), visible and deletable by the client on `/compte`, and appended to the profile block. Vector memory is not planned.

## 10. Human in the loop

- `streamText` is called with a `toolApproval` map returning `'user-approval'` for `create_booking` and `send_message`. The model emits the call, the stream carries an approval request, and the UI renders an approval card with every argument in plain French: provider, date and time in the provider's timezone, phone, address, notes; or provider and message text, editable before sending.
- The client answers through the hook's approval response. The next request carries it, and only then does `execute` run.
- The server trusts nothing from the client except the new message and approval responses. History comes from the database. A client cannot fabricate a tool result claiming a booking exists.
- Approvals are bound to a tool call id. Changed arguments mean a new call and a new approval.
- Deny is a first-class outcome: the model receives it and asks what to change.

Read tools run without approval because they have no side effects and their results are visible.

## 11. Model, prompting, and cost

- Build model: `anthropic/claude-opus-5` through the AI Gateway. It is the strongest published option on agentic tool use and prompt-injection resistance, which removes model weakness as a variable while prompt and tools are being built.
- Production model: decided by the Phase 3 eval. Candidates and list prices as of 2026-09-15 (input / output / cached input, $ per million tokens):

  | Candidate | Tier | Price |
  |---|---|---|
  | Claude Opus 5 | top | 5.00 / 25.00 / 0.50 |
  | GPT-5.6 Sol | top | 4.00 / 20.00 / 0.40 (promotional rate committed through 2026-11-21) |
  | Claude Sonnet 5 | mid | 2.00 / 10.00 / 0.20 |
  | GPT-5.6 Terra | mid | 2.00 / 12.00 / 0.20 |

  Selection rule: run the eval on all four, keep candidates with no regressed criterion against the Opus 5 baseline, pick the lowest cost per completed booking or sent message. Rough estimate at three model steps per turn and six turns per conversation: about $0.35 per conversation on a top-tier model, about $0.20 on a mid-tier one.
- Switching models is one id string in `agent.model.ts`. The gateway holds the single key, so no vendor package or extra secret is added per candidate. Candidate ids are taken from the gateway's model catalog when the eval is set up.
- Thinking: adaptive. Effort tuned after transcripts exist.
- Prompt language: French. The prompt states that the client may write in French, Lingala, or a mix, and that answers are in French.
- Caps, configurable through `SystemSetting` keys `agent.maxStepsPerTurn` (8), `agent.maxMessagesPerConversation` (60), `agent.maxTurnsPerUserPerDay` (30).
- Every turn logs usage into `AgentMessage.metadata`.

## 12. Observability

Per assistant message: model id, input, output, cached token counts, step count, tools called with durations, latency, finish reason. Tool errors go back to the model as tool errors and are logged with the conversation id. No transcript leaves the database. The admin overview gains an "Assistant" block: conversations per day, messages sent and bookings created through the agent, fallback rate.

## 13. Auth and safety

- Endpoints sit behind `SupabaseGuard` and `ActorGuard` with `@Roles("CLIENT")`. Suspended users already get 403 from the guard.
- Conversations are owned; every read and write checks `userId`.
- Tools never take a user id from the model. The actor is bound in the tool factory and passed as viewer to every service.
- Prompt injection surface: the client's own text and provider profile text returned by search. The prompt instructs the model to treat provider descriptions as data. Write tools are approval-gated, so the worst case is a bad proposal, never a booking or a message.
- Contact fields never enter the model context (§4.5).
- Refusal stop reasons surface as a neutral "je ne peux pas aider avec ça".

## 14. Why no MCP

MCP exposes tools to external agents over a protocol. The agent's tools are in-process wrappers over KAYOU's own services. A protocol layer adds latency and a second auth model for no consumer. It becomes relevant if a third-party assistant (a WhatsApp bot, a partner app) should book on KAYOU. Separate RFC.

## 15. Risks

| Risk | Mitigation |
|---|---|
| Sparse supply in a commune | Fallback ladder (§4.4). The agent widens before it apologizes and never fabricates |
| Place name not recognized ("Gombé", "Kin") | `find_place` searches aliases; unresolved places get a one-line question, not a guess |
| Client has no stored location | Ask once; Phase 2 saves the answer as the default address so it is never asked again. Registration collecting a place is recommended separately |
| Slot taken between proposal and confirmation | 409 is a tool error; the model refetches and offers the next slots |
| Contact details leaking through the model | Contact fields are stripped in `toModelOutput` and never in the prompt; the UI card reads the gated DTO |
| Latency of a top-tier model per turn | Streaming, short answers, compact tool outputs, cache hits, effort tuning |
| CJS backend vs ESM-only SDK 7 | Old branch's interop re-verified on `main` in Phase 1 task 1 |
| Gateway not forwarding Anthropic cache markers | Phase 1 acceptance checks `cache_read_input_tokens` on the second turn; if zero through the gateway, raise it with the owner before Phase 2 |
| Next.js rewrite buffering SSE | Verified in Phase 1; fallback is the backend URL with CORS |
| Cost runaway | Caps in §11, daily limit, usage alerts |
| Prompt drift | Phase 3 eval; every prompt change is measured |

## 16. Phasing

1. Foundation: backend loop rebuilt on `main`, four read tools, persisted conversations, `/assistant` with chips, provider cards, detail and availability cards, hand-off to the profile page for booking and messaging. Nothing writes.
2. Actions and memory: approval-gated booking and message tools, approval and status cards, profile block, personal chips, caps, compaction, observability.
3. Evals and promotion: eval set and grader, model selection, agent notes, home and navigation promotion from funnel data. Mobile is out of scope.

Each phase has its own execution document under `execution/`. Progress and decisions are logged in `PROGRESS.md`.

## 17. Open questions

- Should the agent see reviews the client wrote, to avoid recommending a provider they rated badly? Proposed: yes, in the profile block, Phase 2.
- Dock tab for the assistant on mobile? The dock already has five client tabs. Proposed: decide in Phase 3 from funnel numbers, not before.
- Auto-archive conversations after 30 days of inactivity? Proposed: yes.

## 18. Decision log

- 2026-09-15: Placement beside home, authenticated only, French-first, backend-owned loop, AI SDK v7, no MCP, deterministic memory first.
- 2026-09-15: Claude Opus 5 is the build model, not the decided production model. Production model chosen by the Phase 3 eval among Opus 5, GPT-5.6 Sol, Sonnet 5, and Terra. Re-check Sol's price after 2026-11-21.
- 2026-09-17: Revision 2 for the K-YOU contract. Route becomes `/assistant`. Job request fallback replaced by the fallback ladder. `send_message` added as a write tool. Mobile out of scope until it is migrated to the new system. Phase 1 rebuilt on `main` from the old branch as reference.
- 2026-09-17: Models are reached through the Vercel AI Gateway with one key, as the old branch did. No per-vendor provider packages. Model choice is an id string.
- 2026-09-17: The client's own location is the default for every search (§4.3). The agent asks for a place only when none is stored and none is named. Applied as a Phase 1 amendment.

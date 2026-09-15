# RFC-001: Agent concierge

- Status: Draft
- Date: 2026-09-15
- Author: Alain MK
- Scope: web `/agents`, mobile agent screen, backend `agent` module

## 1. Summary

Today a client finds a provider by browsing categories, filtering, and comparing profiles. The agent concierge replaces that with a conversation: the client says what they need ("un plombier pour une fuite sous l'évier, à Gombe, demain matin"), and the platform answers with the best matching providers as interactive cards, checks availability, and books on the client's confirmation.

The agent is a new front door over capabilities that already exist in the backend (provider search, availability, job requests with matching, bookings, quotes, messaging, notifications). It does not introduce new marketplace mechanics. It introduces a model-driven loop that decides which existing services to call and a UI that renders their results as cards instead of pages.

## 2. Goals and non-goals

Goals:

- A client can go from "what I need" to a pending booking without leaving the conversation.
- The agent proposes, the client decides. Every action with side effects requires explicit confirmation in the UI.
- The agent knows the client: past providers, addresses, favorites, open bookings. It suggests before it asks.
- When no provider matches, the agent falls back to a broadcast job request so providers quote, instead of a dead end.
- Same experience on web and mobile, from one backend.

Non-goals for v1:

- Guest access. Only authenticated clients use the agent.
- Provider-side agent (answering requests, drafting quotes).
- Proactive messages from the agent (it never starts a conversation).
- Voice input, image understanding of the problem, payment.
- Learned or vector memory. See §9.
- Exposing tools to third parties (MCP). See §14.

## 3. Product decisions already made

| Decision | Choice |
|---|---|
| Placement | `/agents` beside the marketplace home. Promote to the primary entry once transcripts show it converts. |
| Access | Authenticated clients only in v1. Guest search may come later. |
| Language | French-first prompts, chips, and answers. Lingala and mixed input tolerated. |
| Loop location | Backend (NestJS), not Next.js. Web and mobile are thin clients. |
| SDK | Vercel AI SDK v7 (`ai` 7.x, `@ai-sdk/anthropic` 4.x, `@ai-sdk/react` 4.x) for the loop, streaming protocol, and UI hooks. |
| Model | Claude Opus 5 for the build (Phases 1 and 2). The production model is chosen by the Phase 3 eval among Claude Opus 5, GPT-5.6 Sol, Claude Sonnet 5, and GPT-5.6 Terra (§11). |
| Model cost | Capped per turn and per conversation (§11). Tuned after real transcripts, not before. |

## 4. User experience

### 4.1 Entry

The `/agents` page opens on a composer with a greeting and a row of chips. Chips come from two sources, merged and deduplicated:

- Personal chips, derived from the profile block (§9): "Rappeler Jean pour la plomberie", "Ménage à Gombe comme la dernière fois".
- Generic chips, a fixed French list rotated per session: "Un plombier pour une fuite", "Installer l'électricité", "Ménage cette semaine", "Réparer une porte".

Tapping a chip sends it as the first message. Free text is always available.

### 4.2 Turn shape

The agent answers with short text plus cards. It is not a chatbot that explains itself. A typical first answer is one sentence and a list of three providers. Each card carries an action. Card actions send a structured message back into the conversation, so tapping "Choisir" is equivalent to typing "je choisis ce prestataire". The agent then continues with the same context.

Cards for v1:

| Card | Rendered from | Actions |
|---|---|---|
| Provider list | `search_providers` result | Choose one, see profile (opens `/providers/[id]`) |
| Availability | `get_provider_availability` result | Pick a slot |
| Address | client's recent addresses or a new one | Confirm, edit |
| Booking approval | `create_booking` approval request | Confirm, cancel |
| Job request approval | `create_job_request` approval request | Confirm, cancel |
| Status | booking or job request state | Open the booking, message the provider |

The provider card follows the design-direction rules (no gradients, monochrome categories, plain-text counts). It is the existing provider card with a select action, not a new design.

### 4.3 Honesty about state

"Booking" through the agent creates a pending booking exactly as the `/book/[providerId]` page does. The provider still accepts or declines. The agent says "demande envoyée, Jean doit confirmer" and never "Jean arrive". Status changes reach the client through existing notifications, and the status card reflects the real booking state when the conversation is reopened.

### 4.4 Fallback

When search returns nothing usable in the client's commune, the agent explains in one sentence and proposes a job request. On confirmation it creates the request and the existing matching flow notifies providers. The conversation then shows a status card for the request.

### 4.5 Platforms

Web is mobile-first (the web app is the mobile experience until the Expo app ships). The mobile screen in Phase 3 uses the same hook, the same stream, and mobile implementations of the same cards.

## 5. Architecture

```
web /agents (useChat) ─┐
                       ├─► POST /api/agents/conversations/:id/messages  (SSE UI message stream)
mobile AgentScreen ────┘            │
                                    ▼
                          AgentService.runTurn(actor, conversation, newMessage)
                                    │
                    ┌───────────────┼─────────────────┐
                    ▼               ▼                 ▼
             ProvidersService  BookingsService  JobRequestsService ...
                    │               │                 │
                    └───────── Prisma / Postgres ─────┘
```

- The client sends only the new user message (or an approval response). It never sends history. The server loads history from the database, appends the new message, runs the loop, and persists the assistant message when the stream finishes.
- The loop is `streamText` with tools and `stopWhen: stepCountIs(N)`. The result stream is wrapped with `toUIMessageStream` (which carries `originalMessages` and `onFinish` for persistence) and piped to the HTTP response with `pipeUIMessageStreamToResponse`, the SDK's Node server helper.
- Tools are thin wrappers over existing services. They receive the authenticated actor through closure, never from model input.
- AI SDK 7 is ESM-only and requires Node 22 or newer. The backend is CommonJS on Node 24, which can `require()` ESM packages that have no top-level await. Phase 1 verifies that first thing; the fallback is the same dynamic-import pattern already used for `@kayu/schemas`.

Why the backend and not a Next.js route handler: tools call services directly with the actor already resolved by the existing guards, persistence sits next to Prisma, and mobile does not depend on the web app being up.

## 6. Data model

```prisma
enum AgentConversationStatus { ACTIVE ARCHIVED }
enum AgentMessageRole { USER ASSISTANT SYSTEM }

model AgentConversation {
  id            String  @id @default(cuid())
  userId        String
  user          User    @relation(fields: [userId], references: [id])
  status        AgentConversationStatus @default(ACTIVE)
  title         String?
  summary       String?          // rolling summary of trimmed turns (§8)
  stepCount     Int      @default(0)   // total model steps, for the cap (§11)
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

Messages are stored as the SDK's `UIMessage` shape so the client can rehydrate a conversation without transformation. Tool parts keep the full output for rendering; the model sees the compact form (§8).

Phase 3 adds `AgentMemoryNote` (§9).

## 7. Tools

Six tools. Read tools run automatically. Write tools require approval, declared on the generation call through the `toolApproval` setting (AI SDK 7), not on the tool definition.

| Tool | Kind | Wraps | Input (Zod) | Model sees |
|---|---|---|---|---|
| `search_providers` | read | `ProvidersService.search` | `subcategoryId?`, `categoryId?`, `city`, `commune?`, `q?`, `maxPrice?`, `verifiedOnly?`, `limit ≤ 6` | id, name, profession, rating, review count, starting price, zones, verified, strength |
| `get_provider_availability` | read | `ProvidersAvailabilityService.computeRange` | `providerId`, `from`, `to` (≤ 14 days) | free slots grouped by day |
| `geocode_address` | read | geo module | `address`, `city` | lat, lng, commune |
| `create_booking` | write, approval | `BookingsService.create` | the existing `CreateBookingDto` fields the agent can fill | booking id, status |
| `create_job_request` | write, approval | `JobRequestsService.create` | the existing create input | request id, matched count |
| `get_my_activity` | read | bookings + job requests for the actor | none | open bookings and requests with status |

Rules:

- The taxonomy (categories and subcategories, names and ids) is injected into the cached system prompt (§8). The model maps intent to a subcategory id directly. A taxonomy search tool is added only if the tree grows past a few hundred entries.
- Every tool validates input with the same Zod DTOs the REST controllers use, then calls the service. Service-level rules (role checks, ownership, availability conflicts) apply unchanged.
- Each tool defines `toModelOutput` returning a compact summary. The UI receives the full output through the tool part.
- Tool descriptions are in French, matching the prompt language.

## 8. Context management

Per request, the model receives, in this order (stable first, for cache hits):

1. System prompt: role, tone, rules, the taxonomy, the card contract. Frozen text, cached.
2. Profile block: the client's memory (§9). Changes rarely, cached separately.
3. Conversation: the rolling summary (if any) followed by the last N messages, with tool parts converted to their compact form.
4. The new user message or approval response.

Trimming: when a conversation exceeds a message budget, the oldest turns are summarized into `AgentConversation.summary` by a separate low-effort call, and only the tail is resent. Compaction happens outside the user-facing turn.

Caching: system prompt and profile block carry Anthropic cache-control markers through the provider options. The Phase 1 acceptance test checks `cache_read_input_tokens` is non-zero on the second turn.

## 9. Memory

v1 memory is deterministic and explainable. At the start of every turn the profile block is rebuilt from the database:

- First name, default city.
- Recent addresses (top 3, from the existing recent-addresses service).
- Last three completed bookings: provider id and name, subcategory, date, rating the client gave.
- Favorites (top 5).
- Open bookings and job requests with status.

This block is what lets the agent open with "Jean vous a fait la plomberie en juillet, vous voulez le rappeler ?" and generates the personal chips. No model output is stored as memory in v1 and v2.

Phase 3 adds `AgentMemoryNote`: short notes the agent writes through a `remember` tool ("préfère les interventions le matin"), visible and deletable by the client in settings, and appended to the profile block. Vector memory is not planned.

## 10. Human in the loop

Approval is a property of the tool, enforced by the SDK and by the server:

- `streamText` is called with a `toolApproval` map that returns `'user-approval'` for `create_booking` and `create_job_request`. The model emits the call, the stream carries an approval request, and the UI renders an approval card showing the exact arguments in plain French. Keeping the policy on the call rather than the tool means a future admin or provider agent can reuse the same tools with a different policy.
- The client answers through the hook's approval response. The next request carries that response, and only then does the tool's `execute` run.
- The server trusts nothing from the client except the new message and approval responses. History comes from the database. A client cannot fabricate a tool result that claims a booking exists.
- Approvals are bound to a specific tool call id. Changing arguments requires a new call and a new approval.
- Deny is a first-class outcome: the model receives it and asks what to change.

Read tools run without approval because they have no side effects and the results are visible.

## 11. Model, prompting, and cost

- Build model: `claude-opus-5` through the AI SDK Anthropic provider, one model for the loop. It is the strongest published option on agentic tool use and prompt-injection resistance, which removes model weakness as a variable while the prompt and tools are being built.
- Production model: decided by the Phase 3 eval, not by this document. Candidates and list prices as of 2026-09-15 (input / output / cached input, $ per million tokens):

  | Candidate | Tier | Price |
  |---|---|---|
  | Claude Opus 5 | top | 5.00 / 25.00 / 0.50 |
  | GPT-5.6 Sol | top | 4.00 / 20.00 / 0.40 (promotional rate committed through 2026-11-21) |
  | Claude Sonnet 5 | mid | 2.00 / 10.00 / 0.20 |
  | GPT-5.6 Terra | mid | 2.00 / 12.00 / 0.20 |

  Selection rule: run the eval set on all four, keep only candidates with no regressed criterion against the Opus 5 baseline, then pick the lowest cost per completed booking. Public benchmarks put Opus 5 and Sol within a small margin of each other on agentic tasks, with Opus 5 ahead on tool-use lanes and Sol ahead on terminal-heavy coding, neither of which is this workload. Rough estimate at three model steps per turn and six turns per conversation: about $0.35 per conversation on a top-tier model, about $0.20 on a mid-tier one.
- Switching providers is one line in the loop plus an API key. The provider-specific pieces (cache markers, thinking options) live in one place, `agent.model.ts`, so a swap touches nothing else.
- Thinking: adaptive (the provider default on Opus 5). Effort tuned per route after transcripts exist; start at the default.
- Prompt language: French. The system prompt states that the client may write in French, Lingala, or a mix, and that answers are in French.
- Caps, all configurable through `SystemSetting`:
  - `stopWhen: stepCountIs(8)` per turn.
  - 60 messages per conversation, then the UI offers a new conversation and the old one is archived.
  - 30 turns per client per day.
- Every turn logs usage into `AgentMessage.metadata`. A weekly query gives cost per conversation and per booking created, which is the denominator of the selection rule above.

## 12. Observability

Per assistant message, store: model id, input, output, and cached token counts, step count, tools called with durations, total latency, finish reason. Errors from tools are returned to the model as tool errors and logged with the conversation id. No transcript leaves the database. Admin dashboard shows count of conversations, bookings created through the agent, and fallback rate to job requests.

## 13. Auth and safety

- Endpoints sit behind the existing `SupabaseGuard` and `ActorGuard`. Role must be `CLIENT`.
- Conversations are owned; every read and write checks `userId`.
- Tools never take a user id from the model. The actor is bound in the tool factory.
- Prompt injection surface is the client's own text and provider profile text returned by search. The system prompt instructs the model to treat provider descriptions as data. Write tools are approval-gated, so the worst case of a successful injection is a bad proposal, never a booking.
- Refusal stop reasons from the provider are surfaced as a neutral "je ne peux pas aider avec ça" message.

## 14. Why no MCP

MCP exposes tools to external agents over a protocol. The agent's tools are in-process wrappers over KAYOU's own services and never leave the backend. Adding a protocol layer would add latency and a second auth model for no consumer. MCP becomes relevant if a third-party assistant (a WhatsApp bot, a partner app) should book on KAYOU. That is a separate RFC.

## 15. Risks

| Risk | Mitigation |
|---|---|
| Sparse supply at launch: no provider in the commune | Job request fallback is a first-class path (§4.4), not an apology |
| Latency of an Opus-tier model on every turn | Streaming, short answers, compact tool outputs, cache hits; effort tuned down where quality holds |
| Model books the wrong thing | Approval card shows every argument; the service layer validates the same DTO as the REST path |
| CJS backend vs ESM-only SDK 7 | Node 24 `require(esm)` verified in the first task of Phase 1, with the dynamic-import fallback |
| Next.js rewrite buffers the SSE stream | Phase 1 tests streaming through the rewrite; fallback is calling the backend URL directly from the browser with CORS |
| Cost runaway from long conversations | Caps in §11, daily turn limit, alerts on usage |
| Prompt drifts as it is edited | Phase 3 eval set built from real transcripts; every prompt change is measured |

## 16. Phasing

1. Foundation: backend loop, three read tools, persisted conversations, web `/agents` with chips and provider cards, hand-off to the existing booking page. Nothing can go wrong because nothing writes.
2. Actions and memory: approval-gated booking and job request tools, approval and status cards, profile block, caps, observability.
3. Mobile and evals: Expo screen, agent notes, eval set and grader, promotion of the entry point on the home page.

Each phase has its own execution document under `execution/`.

## 17. Open questions

- Should the agent see quotes and final offers in v1, or only bookings and job requests? Proposed: not in v1.
- Where does the daily turn cap surface in the UI? Proposed: a quiet notice in the composer, no hard block until the cap.
- Do we archive conversations automatically after 30 days of inactivity? Proposed: yes.

## 18. Decision log

- 2026-09-15: Placement beside home, authenticated only, French-first, backend-owned loop, AI SDK v7, no MCP, deterministic memory first.
- 2026-09-15: Claude Opus 5 is the build model, not the decided production model. Production model chosen by the Phase 3 eval among Opus 5, GPT-5.6 Sol, Sonnet 5, and Terra, on score first and cost per completed booking second. Re-check Sol's price after 2026-11-21.

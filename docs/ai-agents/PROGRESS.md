# Agent concierge — progress

## Status

| Phase | Status | Owner, date | Notes |
| --- | --- | --- | --- |
| 1 — Foundation | Built on `agent/01-foundation`, awaiting review (2026-09-17) | Claude, 2026-09-17 | Rebuilt on `main` from the revision-1 branch (`6bb6dca`) as reference; see the Phase 1 evidence below |
| 2 — Actions and memory | Built on `agent/02-actions`, awaiting review (2026-09-17) | Claude, 2026-09-17 | See the Phase 2 evidence below |
| 3 — Conversations and control | Not started | — | Inserted 2026-09-18; the list, starting a conversation on demand, renaming, archiving, deleting, auto-archive |
| 4 — Evals and promotion | Not started | — | Was Phase 3 until 2026-09-18 |

## Decisions

| Date | Decision | Why |
| --- | --- | --- |
| 2026-09-15 | Beside home, authenticated only, French-first, backend-owned loop, AI SDK v7, no MCP, deterministic memory first | See RFC §18 |
| 2026-09-15 | Claude Opus 5 for the build; production model chosen by the Phase 4 eval | Score first, cost per completed action second |
| 2026-09-17 | RFC revision 2 for the K-YOU contract: route `/assistant`, fallback ladder instead of job requests, `send_message` as a write tool, Phase 1 rebuilt on `main` | The refactor replaced the product model, schema, routes and design system; the old branch cannot be rebased meaningfully |
| 2026-09-17 | Models through the Vercel AI Gateway with one key; no vendor provider packages | Model choice becomes an id string; one secret to manage |
| 2026-09-17 | Mobile out of scope for the agent | `apps/mobile` is frozen and must be migrated to the new system first |
| 2026-09-17 | (01) Backend `tsconfig` moves from `Node16` to `NodeNext`; the ESM-only `ai` package is imported statically and compiled to `require("ai")` | TypeScript 5.9 under `nodenext` allows `require()` of ESM and Node 24 executes it; verified under ts-node and the Nest build (task 1). No loader module needed |
| 2026-09-17 | (01) `AGENT_MODEL_ID` env override on top of the RFC default `anthropic/claude-opus-5`, still read in `agent.model.ts` only | The gateway answers 429 "No access to this model at this time" for Opus 5 on this account (credits are fine, Sonnet 5 and Haiku 4.5 answer). The acceptance run used `AGENT_MODEL_ID=anthropic/claude-sonnet-5`. Owner decides: unlock Opus 5 on the gateway or keep the override |
| 2026-09-17 | (01) Turn timeouts `firstChunkMs 45 s, chunkMs 45 s, totalMs 180 s` on `streamText` | One gateway stream stalled mid-sentence and held a turn open for 15 minutes (latency 914 682 ms, usage null) |
| 2026-09-17 | (01) Model output is filtered twice: compact shapes in `toModelOutput` plus a deep deny-list (`phone`, `whatsapp`, `email`, `addressLine`, `latitude`, `longitude`, `contacts`) | Belt and braces for RFC §4.5 and §13; a future field on the DTO cannot reach the model by accident |
| 2026-09-17 | (01) `find_place` retries `PlacesService.list` with accents stripped when the exact spelling matches nothing | `searchLabelWhere` is case-insensitive but accent-sensitive and aliases match exactly; "Gombé" must still resolve |
| 2026-09-17 | (01) A resent message id is a retry only when no later user message exists; otherwise 409 | A stale id would otherwise delete real turns (seen during manual testing when ids were reused out of order) |
| 2026-09-17 | (01) Web stall watchdog: after 90 s without a chunk the client stops the request and shows the error state; `onFinish` with `isDisconnect` or `isError` shows it at once | With the backend killed mid-stream, the Next proxy can keep the browser connection open and the SDK never reports an end; the composer must recover on its own |
| 2026-09-17 | (01, amendment) Default location per RFC §4.3: `resolveDefaultLocation` (default address chain, else `User.placeId` chain, else null) runs before every turn and feeds a second turn-facts line with the deepest id and the parent ids; the prompt rules replace "résous toujours le lieu" with the four rules of task 3b | "je veux un plombier" must search near the client without asking; parent ids let the fallback ladder widen without a `find_place` call |
| 2026-09-17 | (01, amendment) `GET /assistant/conversations/:id` returns `clientLocation: { placeId, label } \| null`; the web shows two "près de chez moi" chips when it is non-null | The browser has no other way to know whether a location is known; the resolution stays server-side |
| 2026-09-17 | (01) `get_provider_availability` calls `ProvidersService.getAvailability` (visibility check plus `computeForDate`), not the availability service directly | Same 404 rules as `GET /providers/:id/availability`; the actor is the viewer |
| 2026-09-17 | (02) The turn body is a strict union: `{ message }` with text parts only, or `{ approvals: [{ id, approved, reason? }] }`; anything else is 400. Approvals are matched to the `approval-requested` parts of the last stored assistant message and every pending one must be answered | RFC §10: the server trusts nothing but the new message and approval responses; history, tool calls and results always come from the database |
| 2026-09-17 | (02) A new user message while an approval is pending denies it server-side (`approval-responded`, `approved: false`, reason « Remplacé par un nouveau message du client ») before the turn runs | The "edit the message" flow sends the revised text as a user message; the model sees the denial and re-emits `send_message` with the new body, one request, no client-side race with `sendAutomaticallyWhen` |
| 2026-09-17 | (02) Write tools validate through the contract `CreateBookingDto` / `StartConversationDto` (the objects the REST controllers use) and call `BookingsService.create` / `MessagingService.start` unchanged; the model-facing input schema only makes `clientPhone` optional, filled from the actor before validation | A booking or message made through the agent is the same row, snapshots and notifications as one made from the profile page |
| 2026-09-17 | (02) Service `HttpException`s become `AgentToolError` (`CODE : message français`) so the model reads the code (409 `SLOT_TAKEN`) and the card shows the sentence; `toUIMessageStream.onError` passes those through and masks anything else | Phase 1 masked every stream error with a generic sentence, which would have hidden the slot-taken path from the model |
| 2026-09-17 | (02) `feat_booking` off: `buildTools` leaves `create_booking` out of the set and out of the approval map; the turn facts say « Réservation : désactivée » | The tool set changes per turn, the cached system prompt does not |
| 2026-09-17 | (02) The address request is a text marker `[[adresse]]` at the end of the answer, stripped by the web, which then renders `AddressCard` under the last message; the "save as default address" offer renders when no location is known and a `find_place` result exists | No eighth tool and no data part for a pure presentation hint; the marker is deterministic and cheap |
| 2026-09-17 | (02) Caps are read from `SystemSetting` on every turn (`agent.maxStepsPerTurn` 8, `agent.maxMessagesPerConversation` 60, `agent.maxTurnsPerUserPerDay` 30, invalid values fall back to the defaults). Daily cap counts the client's user messages since the Kinshasa midnight (429 `RATE_LIMITED`); the conversation cap flags `conversationFull` in the metadata and on the detail (`full`), and refuses with 409 `LIMIT_REACHED` only 6 messages past the cap; archived conversations refuse with 409 `INVALID_TRANSITION` | The web offers « Nouvelle conversation » (archive + create) without cutting a turn in progress |
| 2026-09-17 | (02) Answering an approval does not count against the daily cap and does not add a stored row: the assistant message is continued (same id). A replayed answer from an earlier round is accepted as a no-op; an unknown id, a contradicted verdict or an unanswered pending approval is 400 | The client is never stopped with a booking half-proposed, and a continued message legitimately carries the answers of earlier rounds (the SDK resends the last step, the server tolerates the rest) |
| 2026-09-17 | (02) The rolling summary rides as a user-role message prefixed « Résumé fourni par le système … (le client ne l'a pas écrit) » | Anthropic accepts system messages only at the start; the cached prefix must stay byte-stable |
| 2026-09-17 | (02) Compaction uses `generateText` with thinking disabled and at most 700 output tokens, after the turn, past 40 stored messages, 20 rows at a time, merging the previous summary | Low-effort, off the critical path; stored parts are never rewritten |
| 2026-09-17 | (02) Admin "Assistant" numbers come from jsonb containment on stored parts (`array_contains`), not from the metadata | The parts are the source of truth for what ran; fallback rate = assistant messages with an empty `search_providers` output over messages with a search |
| 2026-09-17 | (02) Compact tool outputs accept `Date` or ISO strings | Stored parts come back from JSON on later turns; `createdAt.toISOString()` on a string threw a 500 on the second turn after a sent message (found in the acceptance run, covered by a spec) |
| 2026-09-18 | A new Phase 3, Conversations and control, is inserted after Phase 2; the eval phase becomes Phase 4 | Phases 1 and 2 shipped a persisted conversation with no way to leave it: the client lands in yesterday's thread and cannot start, browse, archive or delete one. Sequential numbering rather than a "2B" so no phase reads as optional |
| 2026-09-18 | Automatic archiving lands in Phase 3, swept lazily on a list read | The app runs no scheduler and this phase does not add one. It was an open question until now |

## Shared-file changes (record before consumers merge)

| Date | File | Change | Phase |
| --- | --- | --- | --- |
| 2026-09-17 | `apps/backend/tsconfig.json` | `module` / `moduleResolution` `Node16` → `NodeNext` | 1 |
| 2026-09-17 | `apps/backend/src/modules/places/places.module.ts` | `PlacesService` added to the module exports (service untouched) | 1 |
| 2026-09-17 | `apps/backend/src/app.modules.ts` | `AgentModule` appended to `featureModules` | 1 |
| 2026-09-17 | `apps/backend/src/modules/addresses/addresses.module.ts` | `AddressesService` added to the module exports (service untouched) | 1 (amendment) |
| 2026-09-17 | `apps/backend/package.json` | `ai` dependency; the three agent specs added to `test:launch` | 1 |
| 2026-09-17 | `apps/backend/src/config/env.validation.ts`, `.env.example` | `AI_GATEWAY_API_KEY` (optional), `AGENT_MODEL_ID` (optional) | 1 |
| 2026-09-17 | `apps/backend/prisma/schema.prisma` | `AgentConversation`, `AgentMessage`, two enums, `User.agentConversations`; migration `20260917123650_agent_conversations` | 1 |
| 2026-09-17 | `packages/schemas/src/dto.ts` | Assistant section: conversation summary/detail, `AssistantUserMessageDto`, four tool input schemas | 1 |
| 2026-09-17 | `packages/api/src/{endpoints,index,query-keys}.ts` | `assistantApi`, `queryKeys.assistant` | 1 |
| 2026-09-17 | `apps/web/src/components/layout/Navbar.tsx` | "Assistant" pill for `CLIENT` (between Messages and Mes réservations) | 1 |
| 2026-09-17 | `apps/web/src/components/home/Hero.tsx` | Text link under the search bar for signed-in clients (`useAuth`) | 1 |
| 2026-09-17 | `apps/web/package.json` | `ai`, `@ai-sdk/react` | 1 |
| 2026-09-17 | `apps/web/e2e/assistant.screens.spec.ts` | Screenshot and guard spec (tags `@viewports`, `@flows`) | 1 |
| 2026-09-17 | `apps/backend/prisma/schema.prisma` | `AgentMessage.compactedAt DateTime?`; migration `20260917200000_agent_message_compacted_at` | 2 |
| 2026-09-17 | `apps/backend/prisma/seed-settings.ts` | Three `agent.*` cap rows (numeric values; the `value` type widened to `string \| boolean \| number`) | 2 |
| 2026-09-17 | `apps/backend/src/modules/admin/admin-system.service.ts` | `overview()` gains `assistant`; new `assistantOverview()` and `startOfKinshasaDay()` | 2 |
| 2026-09-17 | `apps/backend/package.json` | Three agent specs added to `test:launch` (settings, profile, compaction) | 2 |
| 2026-09-17 | `packages/schemas/src/dto.ts` | `AssistantTurnDto` (strict union), `AssistantApprovalsDto`, `AssistantSuggestionsResponseSchema`, three tool inputs, `full` on the detail, `AdminAssistantOverviewSchema` on the admin overview; `AssistantMessageMetadataSchema` gains `addressId`, `revisedFor` | 2 |
| 2026-09-17 | `packages/api/src/{endpoints,query-keys}.ts` | `assistantApi.archiveConversation`, `assistantApi.suggestions`, `queryKeys.assistant.suggestions` | 2 |
| 2026-09-17 | `apps/web/src/app/(shell)/admin/_sections/Overview.tsx`, `apps/web/src/copy/admin.ts` | One "Assistant" metric tile | 2 |
| 2026-09-17 | `apps/web/e2e/assistant.actions.spec.ts` | Phase 2 flows spec (tag `@flows`, serial, real model turns) | 2 |
| 2026-09-17 | `apps/web/src/app/(shell)/messagerie/MessagerieClient.tsx` | `grid-cols-1` on the list/thread grid: the mobile track was auto-sized, so a long last message overflowed the page at 390 px | 2 (bug found on the way) |

## Open questions for the owner

- Dock tab for the assistant on mobile (Phase 4, from funnel numbers).
- Opus 5 access on the AI Gateway account: the build model returns 429 "No access to this model at this time". Unlock it, or keep `AGENT_MODEL_ID=anthropic/claude-sonnet-5` in the environment (Phase 1 was accepted on Sonnet 5).
- "Écrire" from the detail card lands on `/prestataire/[id]`; auto-opening the message composer needs a query parameter handled in `ProviderProfileClient.tsx`, which Phase 1 does not own.
- The demo seed has no provider under Plomberie (Bâtiment & Construction › Plomberie has 0 rows), so "un plombier à Gombe" always runs the fallback ladder. Seed a few plumbers in Gombe if the demo should show plumber cards.
- « Réserver ce créneau » on the availability card still links to the profile page's booking form (Phase 1 behaviour); tapping a slot now books through the conversation. Keep the link as a fallback, or drop it?
- The admin tile counts messages that contain a successful `send_message` / `create_booking` part (one per message), all-time; "conversations today" counts conversations active today in Kinshasa time. Confirm the definitions before the Phase 4 dashboards.
- `Booking a slot another client took in parallel` was exercised with the REST route between the approval card and « Confirmer », not with two agents racing; the service lock is the same.

## Evidence

Per phase: commands run with output, manual checks at 320 / 390 / 1440 px, screenshots under `screenshots/0N/`.

### Phase 1 (2026-09-17, branch `agent/01-foundation`, not committed)

Files:

- Backend: `apps/backend/src/modules/agent/{agent.module,agent.controller,agent.service,agent.tools,agent.model,agent.prompt,agent.location}.ts` and the four specs; `prisma/migrations/20260917123650_agent_conversations/migration.sql`.
- Shared: `packages/schemas/src/dto.ts` (Assistant section), `packages/api/src/{endpoints,index,query-keys}.ts`.
- Web: `apps/web/src/app/(shell)/assistant/{page,AssistantClient}.tsx`, `apps/web/src/components/assistant/{types,AssistantComposer,SuggestionChips,ProviderPickList,ProviderDetailCard,AvailabilityCard,AssistantMessage}.tsx`, `apps/web/src/copy/assistant.ts`, `apps/web/e2e/assistant.screens.spec.ts`.

Task 1, interop and streaming:

- `node -r ts-node/register src/modules/agent/interop.spike.ts` (temporary file, deleted) under `NodeNext`: `{"moduleFormat":"cjs","node":"v24.13.0","streamText":"function",…,"gatewayModel":"anthropic/claude-opus-5"}`. The same file compiled by `nest build` emits `const ai_1 = require("ai")` and prints the same line. Static imports work; no loader module.
- Next.js `/api` rewrite and SSE: a 5-chunk `text/event-stream` server (700 ms apart) proxied by `next dev` arrived chunk by chunk with the same cadence. Production (`next build` + `next start` on 3100, rewrite baked to `http://localhost:3999`): a real turn streamed `start` at 15:40:03.9, tool outputs at :07.9 and :08.0, `text-start` at :09.5, `[DONE]` at :10.6, headers `content-type: text/event-stream`, `transfer-encoding: chunked`. No buffering; the CORS fallback is not needed. Note that the rewrite destination is fixed at build time from `BACKEND_URL`.

Commands run (all green unless stated):

- `pnpm --filter @kayu/schemas build`, `pnpm --filter @kayu/api build`.
- `apps/backend`: `npx tsc -p tsconfig.json --noEmit` (clean); `node --test -r ts-node/register` on the three agent specs: 27 tests, 27 pass; `pnpm test:launch`: 247 tests, 246 pass, 0 fail (one skip, pre-existing); `pnpm build`.
- `apps/web`: `npx tsc -p tsconfig.json --noEmit` (clean); `BACKEND_URL=http://localhost:3999 pnpm build` (compiled, `ƒ /assistant` listed).
- Migration: generated with `prisma migrate diff --from-migrations … --to-schema-datamodel … --shadow-database-url …`; the diff against `0_init` contains only the agent objects, so `main` was otherwise in sync. Applied with `createdb kayu_agent01` + `prisma migrate deploy` (both migrations) + `pnpm db:seed` with `SEED_SUPABASE_USERS=true` (seed completed, `AgentConversation: 0`, `AgentMessage: 0`). The launch-leads integrity spec passes inside `test:launch`.
- `pnpm db:reset` itself could not be run: `prisma migrate reset` refuses when it detects Claude Code as the caller. The equivalent path above (fresh database, deploy, seed) was run instead.

Acceptance run (backend on 3999 against `kayu_agent01`, `AGENT_MODEL_ID=anthropic/claude-sonnet-5`, client `paul.kabasele@email.cd`):

- "un plombier à Gombe": `find_place {q: "Gombe"}` → Gombe/COMMUNE, then `search_providers` on the Plomberie node (0), widened to Kinshasa (0), then to the category (9 results, three cards shown). Metadata: 6 steps, 59 184 input tokens, 45 895 cached reads, 9 179 cache write, 26.3 s, finish `stop`. The seed has no plumber anywhere, so the ladder ran as designed and the answer said so at each step.
- "Gombé demain matin" (fresh conversation, `annie.mutombo@email.cd`): no tool call, one question back ("De quel type de service avez-vous besoin à Gombe…"). That stream stalled after the first sentence for 15 minutes before closing (gateway side); the timeout decision above follows from it.
- Second turn cache: 9 179 `cachedInputTokens` on every follow-up turn (the cached system prompt); the gateway forwards the Anthropic cache markers. Not a blocker for Phase 2.
- "Je choisis Jean-Pierre Mukendi" with `metadata.providerId`: `get_provider` and `get_provider_availability` in one step, detail card plus slots (Friday has slots, Saturday none). Stored tool part holds the full DTO including `contacts` for the card; the compact model output has no `phone`, `whatsapp`, `email`, `addressLine`, `latitude`, `longitude` or `contacts` key (`agent.tools.spec.ts`, `agent.service.spec.ts` assert this on the serialized model messages).
- Guards: provider `POST /assistant/conversations` → 403; anonymous → 401; another client on the conversation → 403 `FORBIDDEN`; unknown id → 404 `NOT_FOUND`; non-user role or empty parts → 400 validation.
- Reload: `GET /assistant/conversations/:id` returns the stored `UIMessage[]`; the page renders the same cards from them.

Verified on screen (`apps/web/e2e/assistant.screens.spec.ts` against `next start` on 3100 → backend 3999, `E2E_SHOTS_DIR=docs/ai-agents/screenshots/01`):

- 17 of 17 checks pass across `mobile-320`, `mobile-390`, `desktop-1440` and `reduced-motion`: conversation with cards and no horizontal overflow, home link for a client, provider redirected to `/mon-espace`, anonymous visitor sent to `/login?returnTo=%2Fassistant`, and a fresh conversation (greeting, four chips, composer) through a real first turn at 390 px.
- Screenshots: `assistant-empty-390`, `assistant-thinking-390` (skeleton lines while the tool runs), `assistant-first-answer-390`, `assistant-conversation-{320,390,1440,reduced}` (full page: pick list, detail card, availability card), `assistant-top-{320,390,1440,390-reduced}`, `home-assistant-link-{320,390,1440,reduced}`, `assistant-error-390`.
- Backend killed mid-stream (temporary spec, not kept): the error card "La réponse a été interrompue." appeared immediately, the composer stayed enabled and "Envoyer" re-enabled after typing.
- Locked contacts (live, `contacts_require_premium` set to true through `PUT /admin/settings`, then restored): choosing the free-tier provider Cyprien Ekofo produced "Ses contacts sont verrouillés (l'offre Premium les débloquerait), mais vous pouvez lui écrire via la messagerie intégrée"; the stored `tool-get_provider` part has `contactsLocked: true`, `contacts: null`, and no `+243` anywhere in the row.
- Root `pnpm type-check`: 10 tasks successful; `pnpm --filter @kayu/web test`: 28 pass; `pnpm --filter @kayu/utils test`: 20 pass.

Not verified:

- Opus 5 itself (gateway 429 on this account); the run used Sonnet 5 through the override.
- `pnpm db:reset` as a command (Prisma refuses `migrate reset` from Claude Code); the same steps were run by hand on a fresh database.
- Provider-side or admin views: out of scope, nothing changed there.

Risks and open items:

- Opus 5 is not reachable on this gateway account today; the build model decision in RFC §3 is on hold until the owner unlocks it or accepts the override.
- Gateway streams can stall; the new timeouts turn that into a streamed error and the composer recovers, but the user waits up to 45 s for a silent step.
- Model steps go through `Promise.all` on availability dates (≤ 7 queries per call); fine for Phase 1 volumes.
- The retry path (`regenerate`) relies on the client resending the last user message id; a stale id is now a 409.

### Phase 1 amendment: default location (2026-09-17, same branch)

Files: `apps/backend/src/modules/agent/agent.location.ts` (+ `agent.location.spec.ts`), `agent.prompt.ts` (rules and `formatClientLocation`), `agent.service.ts` (resolution before each turn, `clientLocation` on the detail response), `agent.module.ts`, `packages/schemas/src/dto.ts` (`AssistantClientLocationSchema`), `apps/web/src/copy/assistant.ts` (`chipsNearMe`), `SuggestionChips.tsx`, `AssistantClient.tsx`, `page.tsx`.

Turn facts now read, for a known location: `Lieu du client : Gombe (commune), Kinshasa, Kinshasa, RDC — id cmu5il78z… (parents : Kinshasa id …, Kinshasa id …, RDC id …) ; adresse par défaut « WORK ».` and otherwise `Lieu du client : inconnu.` The system prompt is unchanged in structure, so the cached prefix is stable; only the small uncached turn-facts message grows.

Test fixtures on `kayu_agent01` (the seed has no client with a Gombe default address and none without a place): Paul Kabasele's `WORK` address in Gombe was made the default through `PATCH /addresses/:id`; Solange Ngoyi, who has no address, had `User.placeId` set to null by SQL.

Three real turns (Sonnet 5 through the gateway, backend on 3999):

- A. Paul, "je veux un plombier": no `find_place`, first call `search_providers` with Gombe's id straight from the turn facts, then the ladder (Kinshasa, then the category) because the seed has no plumber; three cards. Answer opened with "Aucun plombier disponible à Gombe pour l'instant, je regarde à l'échelle de Kinshasa." No question asked.
- B. Solange, "je veux un plombier": no tool call, one question: "Avec plaisir ! Dans quelle ville ou quartier avez-vous besoin d'un plombier ?"
- C. Paul, "un électricien à Limete": `find_place {q: "Limete", kind: "COMMUNE"}`, `search_providers` on Limete (0), widened to Kinshasa (2 cards, announced as outside Limete). `GET /addresses` afterwards still lists `WORK @ RDC › Kinshasa › Kinshasa › Gombe` as the default; nothing wrote to the address book.
- Detail endpoint: Paul `clientLocation: { placeId: <Gombe>, label: "Gombe, Kinshasa" }`, Solange `null`. In the browser (production build on 3100), Paul's fresh conversation shows two "près de chez moi" chips among the four, Solange's shows none; screenshot `assistant-empty-nearme-390.png`.

Commands: four agent specs 33 pass (prompt, location, tools, service); backend and web `tsc --noEmit` clean; `BACKEND_URL=http://localhost:3999 pnpm build` in `apps/web` compiled with `ƒ /assistant`. Gotcha met on the way: `packages/api` builds with `tsc -b` without project references, so a changed `@kayu/schemas` type needs `packages/api/dist` and its `tsconfig.tsbuildinfo` removed before the web type-check sees it.

### Phase 2 (2026-09-17, branch `agent/02-actions`, not committed)

Files:

- Backend: `apps/backend/src/modules/agent/{agent.settings,agent.profile,agent.compaction}.ts` (new, each with a spec), `agent.tools.ts` (three tools, `AgentToolError`, `approvalConfig`), `agent.prompt.ts` (action rules, `[[adresse]]`, turn facts for phone and booking flag, `addressId` in the location line), `agent.location.ts` (`addressId`), `agent.service.ts` (turn body union, approvals, caps, profile block, summary, compaction, archive, suggestions), `agent.controller.ts` (`GET /assistant/suggestions`, `POST /assistant/conversations/:id/archive`), `agent.module.ts`, `admin-system.service.ts` (+ spec), `prisma/migrations/20260917200000_agent_message_compacted_at`.
- Shared: `packages/schemas/src/dto.ts`, `packages/api/src/{endpoints,query-keys}.ts`.
- Web: `apps/web/src/components/assistant/{BookingApprovalCard,MessageApprovalCard,StatusCard,ActivityCard,AddressCard,useProviderName}.tsx`, `AssistantMessage.tsx`, `SuggestionChips.tsx` (personal chips first), `types.ts` (tool types, `pendingAnswers`, `knownProviders`, marker helpers), `AssistantClient.tsx` (approval body, `sendAutomaticallyWhen`, 429 and full-conversation states, « Nouvelle conversation »), `page.tsx`, `copy/assistant.ts`, `admin/_sections/Overview.tsx`, `copy/admin.ts`, `e2e/assistant.actions.spec.ts`.

Commands run (all green unless stated):

- `pnpm --filter @kayu/schemas build`, `pnpm --filter @kayu/api build` (after removing `packages/api/dist` and its `tsbuildinfo`, the Phase 1 gotcha).
- `apps/backend`: `npx tsc -p tsconfig.json --noEmit` (clean); the seven agent specs: prompt 8, location 3, settings 2, profile 4, compaction 3, tools 17, service 21, all pass; `admin-system.service.spec.ts` 5 pass; `pnpm test:launch`: 281 tests, 280 pass, 0 fail, 1 skipped (pre-existing); `pnpm build`.
- `apps/web`: `npx tsc -p tsconfig.json --noEmit` (clean); `BACKEND_URL=http://localhost:3999 pnpm build` (compiled, `ƒ /assistant`); `pnpm --filter @kayu/web test`: 28 pass.
- Root `pnpm type-check`: 10 tasks successful.
- Migration applied to `kayu_agent01` with `prisma migrate deploy` (`0_init`, `agent_conversations`, `agent_message_compacted_at`); the three `agent.*` settings inserted by SQL (a fresh `db:seed` creates them through `seed-settings.ts`).

API checks (backend on 3999 against `kayu_agent01`, `AGENT_MODEL_ID=anthropic/claude-sonnet-5`):

- `GET /assistant/suggestions` for Paul Kabasele: « Recontacter Josué Tshibangu », « Réserver à nouveau : Élagage », « Comme la dernière fois à Ngaliema », each with the provider id.
- Turn body: a text part plus a forged `tool-create_booking` part → 400; an extra top-level key → 400; `{ approvals }` with nothing pending → 400 « Aucune action n'attend votre accord. »; a turn on an archived conversation → 409 `INVALID_TRANSITION`.
- `GET /admin/overview` carries `assistant: { conversationsToday, messagesSent, bookingsCreated, fallbackRate }`. Hand-counted against the database after the runs: `33 / 6 / 7` and `12` empty searches over `13` searches, and the endpoint answered `{conversationsToday: 33, messagesSent: 6, bookingsCreated: 7, fallbackRate: 92}`. The rate is high because the seed has no plumber anywhere, so nearly every demo search widened.
- A message sent through the agent leaves the provider a `NEW_MESSAGE` notification ("Paul Kabasele vous a envoyé un message.", recipient `jeanpierre.mukendi@kayou.cd`), exactly as one sent from the profile page.
- A booking created through the agent is row-identical to one created by `POST /bookings`, snapshots included: same `durationMin` 60, `bufferMin` 15, `timezone` Africa/Kinshasa, a `subcategoryId`, `commissionPct` 10 with zeroed amounts, `isPaid` false, `confirmedAt` null, `status` PENDING and one `BOOKING_NEW` notification each. The agent row additionally carries the address snapshot (`placeId`, `addressLine`) because the approval used a saved address.
- Compaction, forced on a fresh conversation of Solange Ngoyi seeded with 41 text rows (SQL): after one real turn, 20 rows carry `compactedAt` and `summary` reads « Le client cherche à plusieurs reprises un électricien à Limete. L'assistant KAYOU a systématiquement proposé Jean-Pierre Mukendi (providerId cmu5il7z2018xrop1i2c8h1le), disponible, comme prestataire à Limete. Aucun créneau précis n'a été retenu, aucune réservation n'a été effectuée, et aucun refus explicite du client n'a été formulé concernant ce prestataire. » A second turn compacted 20 more (40 of 45); the only uncompacted rows then held no provider name, and « Quel est le providerId exact du prestataire que tu m'avais proposé au début ? » was answered with `cmu5il7z2018xrop1i2c8h1le`: the summary reaches the model.

Verified on screen (`apps/web/e2e/assistant.actions.spec.ts`, six flows, `mobile-390`, against `next start` on 3100 → backend 3999, `E2E_SHOTS_DIR=docs/ai-agents/screenshots/02`; Paul Kabasele as the client, Jean-Pierre Mukendi as the provider, Annie Mutombo as the rival client, Solange Ngoyi as the client with no stored place). Every turn is a real model turn; the spec asserts on cards and stored parts, not on sentences, and every click is scoped to its card because "Envoyer" also names the composer button:

- Personal chips: the fresh conversation opens with the three personal chips ahead of the generic ones (`assistant-personal-chips-390`).
- Booking, 51 s: "Montre-moi les créneaux de Jean-Pierre Mukendi sur les sept prochains jours" → availability card; tapping a free slot sends "Je préfère le … à …, réserve ce créneau", the agent confirms place, date and time in one sentence, and the approval card shows the provider, "Vendredi 18 septembre 2026 à 09:15", the provider timezone, the account phone and « Adresse enregistrée « Travail » Boulevard du 30 Juin … Kinshasa › Gombe » (`assistant-booking-approval-390`). Annie then takes that exact slot through `POST /bookings`; "Confirmer" → the tool answers `SLOT_TAKEN`, the card reads « Ce créneau vient d'être pris. L'assistant recharge les disponibilités. », the agent refetches availability (the spec asserts the refreshed output no longer lists that slot) and offers the next one (`assistant-booking-slot-taken-390`). Tapping a slot on the fresh card → new approval → "Confirmer" → status card « Demande envoyée » with the « En attente » pill, the slot label and « Voir la réservation », and the answer reads « Demande envoyée, le prestataire doit confirmer. » (`assistant-booking-sent-390`). The stored part holds `status: PENDING` and `GET /bookings?status=PENDING` lists that id.
- Message, 42 s: "Écris à Jean-Pierre Mukendi : la fuite est sous l'évier…" → approval card with the editable text, the subject the agent chose and the 4000-character counter (`assistant-message-approval-390`); a sentence is appended and « Envoyer le texte modifié » sends the revised text as a user message. The pending call is denied as superseded (the card reads « Remplacé par votre message suivant. ») and the agent re-emits `send_message` with the new body (`assistant-message-revised-390`); « Envoyer » → « Message envoyé » with « Ouvrir la conversation » (`assistant-message-sent-390`). `GET /conversations/:id/messages` shows the appended sentence in the last message the client sent. Then a second booking is prepared on a free slot and « Annuler » → « Annulé, rien n'a été envoyé. », the agent asks what to change, the pending-booking count is unchanged and the conversation holds exactly one executed `create_booking` (`assistant-booking-denied-390`).
- Provider side, signed in as Jean-Pierre Mukendi: `/mon-espace` lists Paul Kabasele's pending request, `/messagerie` opens the conversation with Paul and shows the revised message including the appended sentence (`provider-espace-pending-390`, `provider-messagerie-agent-message-390`).
- Admin: `/admin` shows the « Assistant · conversations aujourd'hui » tile with the messages, bookings and fallback-rate sub-line (`admin-assistant-tile-390`).
- Address card, 23 s: Solange has no `User.placeId` and no address, so the greeting offers no "près de chez moi" chip. "Je veux un plombier à Gombe." runs the whole fallback ladder, each step announced in one sentence ("Aucun plombier trouvé à Gombe pour l'instant, je vais élargir la recherche à toute la ville de Kinshasa.", then "Toujours rien à l'échelle de Kinshasa, j'élargis à la catégorie parente Bâtiment & Construction.", then three cards from that category with the sentence saying none is a plumber and offering the messaging route), and the card offers « Enregistrer Gombe, Kinshasa comme votre adresse ? » (`assistant-address-save-default-390`). Filling the line and confirming creates the address through `POST /addresses` with `isDefault: true`; the conversation detail then reports `clientLocation` in Gombe and the card is gone (`assistant-address-saved-390`).
- Daily cap: with `agent.maxTurnsPerUserPerDay` set to 1 by SQL, the next send shows « Vous avez atteint la limite de demandes pour aujourd'hui. » above the backend sentence naming the limit, and the setting is restored (`assistant-daily-cap-390`). The same path also fired for real during these runs: Paul reached 51 user messages in the Kinshasa day against the seeded limit of 30 and the turn answered `429 RATE_LIMITED` with the French message.
- No horizontal overflow at 390 px on any of the screens above; the Phase 1 viewport checks (`assistant.screens.spec.ts @viewports`) still pass at 320 and 1440 on the new renderer (8 of 8).

`feat_booking` off, live (the same two turns in each state, fresh conversation each time, flipped through `PUT /admin/settings`):

- Off: `get_provider_availability` runs, then « Je suis désolé, mais la réservation en ligne est momentanément indisponible pour cette conversation. Je peux en revanche envoyer un message à Jean-Pierre Mukendi pour lui demander ce créneau (18 septembre à 10:30, à votre adresse WORK à Gombe) — voulez-vous que je fasse ça ? » The stored parts hold no `tool-create_booking` at all.
- On: the same words produce `tool-create_booking:approval-requested` for the same slot. The flag was restored to true afterwards.

One bug found and fixed outside the agent code (`apps/web/src/app/(shell)/messagerie/MessagerieClient.tsx`, one class): at 390 px the conversation list and thread sit in a `grid` whose single mobile track had no `grid-cols-1`, so the implicit track was auto-sized to max-content and a long last message widened the whole page (`scrollWidth` 677 for a 390 px viewport, measured on `/messagerie` and `/messagerie?c=…`). Seeded previews are short, so nothing showed it before; an agent-written message is 120 characters of preview and does. `grid-cols-1` clamps the track to the container and both routes measure 390 again. The provider-side flow now guards it.

Not verified:

- Opus 5 (gateway 429 on this account, as in Phase 1); every turn above ran on Sonnet 5.
- Two agents racing for one slot: the race was staged with the REST route between the approval card and "Confirmer" (same service, same row lock).
- The « Nouvelle adresse » branch of the address card in pick mode, and the conversation cap's « Nouvelle conversation » button: both are covered by specs and by the detail's `full` flag, but no 60-message conversation was driven in the browser.
- `pnpm db:reset` (Prisma refuses `migrate reset` from Claude Code); the new migration was applied with `migrate deploy` on the Phase 1 database.

Note on the local environment: the owner's own backend on port 3001 stopped during this work, most likely because `nest build` replaced `apps/backend/dist` under the running process. It was restarted on the documented command (`PORT=3001 E2E_TEST_MODE=true E2E_SEED_PASSWORD=Password123! DATABASE_URL=…/kayu_10_e2e node dist/main.js`, health ok, `POST /api/test/session` answering) but it now serves this branch's build, not `main`'s. Rebuild from `main` to get the previous behaviour back. The Next dev server on 3000 was untouched. In `kayu_agent01` the three `agent.*` settings are back to their seeded values (8 / 60 / 30) and `feat_booking` is true.

Risks and open items:

- The approval card disappears once the tool ran: after `SLOT_TAKEN` the client sees the error card and the fresh slots, not the arguments they approved. Acceptable for now; a compact "vous aviez demandé …" line could be added.
- Message edits go through a user message (« Envoie plutôt ce message… »), so the bubble shows the revised text twice (bubble and card). Deliberate: one request, no client race.
- The web resolves provider names for approval cards from the conversation, else from `GET /providers/:id`; ids taken from the profile block (« Recontacter … ») hit that fallback.
- Slots are a finite test resource: a pending booking holds its slot, so the flows spec cancels the pending bookings it left behind before each run and reads a free slot off the card instead of naming a time.
- The daily cap is real during development: these runs needed `agent.maxTurnsPerUserPerDay` raised temporarily, and it is back to 30 in `kayu_agent01`.

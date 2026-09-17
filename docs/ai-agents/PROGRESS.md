# Agent concierge — progress

## Status

| Phase | Status | Owner, date | Notes |
| --- | --- | --- | --- |
| 1 — Foundation | Built on `agent/01-foundation`, awaiting review (2026-09-17) | Claude, 2026-09-17 | Rebuilt on `main` from the revision-1 branch (`6bb6dca`) as reference; see the Phase 1 evidence below |
| 2 — Actions and memory | Not started | — | |
| 3 — Evals and promotion | Not started | — | |

## Decisions

| Date | Decision | Why |
| --- | --- | --- |
| 2026-09-15 | Beside home, authenticated only, French-first, backend-owned loop, AI SDK v7, no MCP, deterministic memory first | See RFC §18 |
| 2026-09-15 | Claude Opus 5 for the build; production model chosen by the Phase 3 eval | Score first, cost per completed action second |
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

## Open questions for the owner

- Dock tab for the assistant on mobile (Phase 3, from funnel numbers).
- Opus 5 access on the AI Gateway account: the build model returns 429 "No access to this model at this time". Unlock it, or keep `AGENT_MODEL_ID=anthropic/claude-sonnet-5` in the environment (Phase 1 was accepted on Sonnet 5).
- "Écrire" from the detail card lands on `/prestataire/[id]`; auto-opening the message composer needs a query parameter handled in `ProviderProfileClient.tsx`, which Phase 1 does not own.
- The demo seed has no provider under Plomberie (Bâtiment & Construction › Plomberie has 0 rows), so "un plombier à Gombe" always runs the fallback ladder. Seed a few plumbers in Gombe if the demo should show plumber cards.
- Auto-archive conversations after 30 days of inactivity (proposed yes).

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

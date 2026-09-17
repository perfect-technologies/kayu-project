# Agent prompts per phase

Copy one block into a fresh Claude Code session at the repo root. Each prompt assumes the agent reads the RFC and its phase document before touching code. Work happens on a branch `agent/0N-short-name` from `main`, one commit per phase, PR to `main`.

## Phase 1

```
Implement Phase 1 of the KAYOU agent concierge on the post-refactor codebase.

Read first, in this order: CLAUDE.md, docs/kyou-ux-refactor/00-product-and-design-contract.md, docs/ai-agents/RFC-001-agent-concierge.md (revision 2), docs/ai-agents/execution/phase-1-foundation.md, docs/ai-agents/PROGRESS.md, docs/kyou-ux-refactor/handover/02-backend-contract.md and 05-web-public-screens.md.

Reference branch feat/agent-concierge-phase-1 (commit 6bb6dca) implements this phase against the old contract. Read it for the loop, persistence, streaming, interop and spec patterns. Re-type what you reuse on main; do not cherry-pick, and do not reuse its tools, model file, DTOs or UI.

Scope is exactly the tasks and acceptance criteria in the phase document: backend agent module with the AI SDK 7 loop, four read tools (find_place, search_providers, get_provider, get_provider_availability), the two Prisma models on top of 0_init, the /assistant page under the shell with chips, provider list, provider detail and availability cards, hand-off to /prestataire/[id]. No write tools, no approval flow, no profile block.

Before feature code, do task 1: confirm the ESM-only SDK loads in the CommonJS backend under ts-node and the compiled build, and confirm the Next.js /api rewrite streams SSE. Say what you found.

Binding rules: the model never receives phone, WhatsApp, email or exact coordinates; every service call passes the actor as viewer; French only with copy in apps/web/src/copy/assistant.ts; K-YOU tokens and hard rules (Lucide only, pills, skeletons never spinners, dashed empty states, 320 px clean); reuse the public ProviderCard.

Models go through the Vercel AI Gateway (createGateway, AI_GATEWAY_API_KEY) as on the reference branch; do not add @ai-sdk/anthropic or any vendor package. Mobile is out of scope; do not touch apps/mobile.

Working rules: branch agent/01-foundation from main; implement every task end to end before reporting; no commits until I review; no comments unless they explain a non-obvious constraint; node:test with hand-rolled Prisma fakes like admin.service.spec.ts; run specs, type-check and production build and report real output; check 320, 390 and 1440 px; screenshots under docs/ai-agents/screenshots/01/; update docs/ai-agents/PROGRESS.md with files, commands, decisions and risks.

End with: what was built, what was verified by running it, what you could not verify and why.
```

## Phase 1 amendment: default location

For the agent that built Phase 1 on `agent/01-foundation`, before review.

```
Amend Phase 1 of the KAYOU agent concierge on agent/01-foundation with the default-location rule.

Read: docs/ai-agents/RFC-001-agent-concierge.md §4.3 and §8, docs/ai-agents/execution/phase-1-foundation.md task 3b and the updated acceptance criteria.

The change: "je veux un plombier" must search near the client's own location without asking. Resolve the location server-side before each turn (default address place chain, else User.placeId chain, else unknown) and inject it into the turn facts with ids and labels. Update the prompt rules exactly as task 3b lists them: search at the known place and mention it in passing, a place named in the message wins for that request, a correction sticks for the conversation, ask only when nothing is known. Add the "près de chez moi" chip variants. Keep everything else as built.

Verify with three real turns against the seeded data and record them in PROGRESS.md: a client with a default address in Gombe sending "je veux un plombier" (cards, no question, place mentioned); a client with no address and no place sending the same (one short question); the Gombe client sending "un électricien à Limete" (Limete searched, stored default untouched). Add specs for resolveDefaultLocation and the turn facts line. Run the agent specs, type-check and the web build and report real output. No commits.
```

## Phase 2

```
Implement Phase 2 of the KAYOU agent concierge. Phase 1 is merged.

Read first: CLAUDE.md, docs/ai-agents/RFC-001-agent-concierge.md (revision 2, especially §4.3, §4.5, §7, §9, §10, §11), docs/ai-agents/execution/phase-2-actions-and-memory.md, docs/ai-agents/PROGRESS.md, then the existing apps/backend/src/modules/agent code and apps/web/src/app/(shell)/assistant.

Scope is the tasks and acceptance criteria in the phase document: create_booking and send_message behind the AI SDK 7 toolApproval setting, get_my_activity, approval, status and address cards, the profile block and personal chips, caps from SystemSetting, rolling summary compaction, usage metadata and the admin overview tile.

Non-negotiable rules: the server accepts only the new user message or approval responses and loads history from the database; tools never read a user id from model input; write tools reuse the existing CreateBookingDto and StartConversationDto and call BookingsService.create and MessagingService.start unchanged, so a booking or message made through the agent is identical to one made on the profile page; feat_booking off removes the booking tool for the turn; 409 SLOT_TAKEN makes the agent refetch slots.

The agent never says a booking is confirmed. Wording is "demande envoyée, le prestataire doit confirmer".

Working rules: branch agent/02-actions from main; implement every task end to end before reporting; no commits until I review; no comments unless they explain a non-obvious constraint; node:test with Prisma fakes for every service change; run specs, type-check and production build and report real output. Book and message end to end at 390 px yourself, confirm the provider side on /mon-espace and /messagerie, and describe what you saw. Screenshots under docs/ai-agents/screenshots/02/; update PROGRESS.md.
```

## Phase 3

```
Implement Phase 3 of the KAYOU agent concierge. Phases 1 and 2 are merged.

Read first: CLAUDE.md, docs/ai-agents/RFC-001-agent-concierge.md (revision 2, especially §9, §11, §16, §17), docs/ai-agents/execution/phase-3-evals-and-promotion.md, docs/ai-agents/PROGRESS.md, and the existing agent module and /assistant components.

Scope is the tasks and acceptance criteria in the phase document: the eval set exported from anonymized transcripts with code-first graders and a model-graded check only for wording, the runner calling the real runTurn with tools stubbed to recorded outputs, the model comparison across the four candidates in RFC §11, AgentMemoryNote with the remember tool and the /compte section, funnel events, and the Lingala cases. Mobile is out of scope.

For the eval: real transcripts first, hand-written edge cases second, thirty to sixty cases. Show me the case list and the rubric before the first paid run, and the measured cost of a five-case pilot before the full set. Store the baseline. Write the chosen model and the date into the RFC decision log and PROGRESS.md. The dock tab and hero promotion are my decision from the funnel numbers; prepare the change but do not apply it without my answer.

Working rules: branch agent/03-evals from main; implement every task end to end before reporting; no commits until I review; no comments unless they explain a non-obvious constraint; node:test for the notes tool and the runner; run everything and report real output. Models go through the AI Gateway with the single AI_GATEWAY_API_KEY; do not add vendor provider packages. Anything that needs a key I have not provided, list as unverified rather than claiming it works. Screenshots under docs/ai-agents/screenshots/03/; update PROGRESS.md.
```

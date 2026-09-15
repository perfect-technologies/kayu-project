# Agent prompts per phase

Copy one block into a fresh Claude Code session at the repo root. Each prompt assumes the agent reads the RFC and its phase document before touching code.

## Phase 1

```
Implement Phase 1 of the KAYOU agent concierge.

Read first, in this order: CLAUDE.md, docs/ai-agents/RFC-001-agent-concierge.md, docs/ai-agents/execution/phase-1-foundation.md, docs/design-direction/index.html.

Scope is exactly the tasks and acceptance criteria in the phase document: backend agent module with the AI SDK 7 loop and streaming, the three read tools, the two Prisma models, the web /agents page with chips and provider cards, hand-off to the existing booking page. No write tools, no approval flow, no profile block.

Before writing feature code, do task 1 of the phase doc: confirm the ESM-only AI SDK loads in the CommonJS backend under ts-node and the compiled build, and confirm the Next.js /api rewrite streams SSE. Fix the approach if either fails, and say what you found.

Use the current AI SDK 7 docs, not memory, for every SDK call. Provider-specific code goes only in agent.model.ts.

Working rules: implement every task end to end before reporting, no commits, no comments unless they explain a non-obvious constraint, mobile-first layout, provider cards follow the design-direction rules. Tests use node:test with hand-rolled Prisma fakes like admin.service.spec.ts. Run the new specs and the typecheck and report the real output.

End with: what was built, what was verified by running it, what you could not verify and why.
```

## Phase 2

```
Implement Phase 2 of the KAYOU agent concierge. Phase 1 is merged.

Read first: CLAUDE.md, docs/ai-agents/RFC-001-agent-concierge.md (especially §7, §9, §10, §11), docs/ai-agents/execution/phase-2-actions-and-memory.md, then the existing apps/backend/src/modules/agent code and the web /agents page.

Scope is the tasks and acceptance criteria in the phase document: create_booking and create_job_request behind the AI SDK 7 toolApproval setting, get_my_activity, approval and status and address cards, the profile block and personal chips, caps and daily limits from SystemSetting, rolling summary compaction, usage metadata and the admin dashboard numbers.

Non-negotiable safety rules from the RFC: the server accepts only the new user message or approval responses from the client and loads history from the database; tools never read a user id from model input; write tools reuse the existing create DTOs and services so a booking made through the agent is identical to one made on /book/[providerId].

The agent must never say a booking is confirmed. Wording is "demande envoyée, le prestataire doit confirmer".

Working rules: implement every task end to end before reporting, no commits, no comments unless they explain a non-obvious constraint, node:test with Prisma fakes for every service change, run specs and typecheck and report real output. Walk the booking flow and the no-provider fallback yourself on a 400 px viewport and describe what you saw.
```

## Phase 3

```
Implement Phase 3 of the KAYOU agent concierge. Phases 1 and 2 are merged.

Read first: CLAUDE.md, docs/ai-agents/RFC-001-agent-concierge.md (especially §9, §11, §16), docs/ai-agents/execution/phase-3-mobile-and-evals.md, the existing agent module, the web /agents components, and apps/mobile/src/screens/search for the mobile card conventions.

Scope is the tasks and acceptance criteria in the phase document: the Expo agent screen with mobile implementations of every card, AgentMemoryNote with the remember tool and the settings section on web and mobile, the eval set exported from anonymized transcripts with code-first graders and a model-graded check only for wording, the eval runner calling the real runTurn with tools stubbed to recorded outputs, the model comparison across the four candidates in RFC §11, the home page entry point and funnel events, and the Lingala cases.

For Expo and React Native, check the official Expo and AI SDK docs before wiring useChat with expo/fetch. Do not guess the transport setup.

For the eval: real transcripts first, hand-written edge cases second, thirty to sixty cases. Show me the case list and the rubric before the first paid run, and tell me the measured cost of a pilot of five cases before running the full set. Store the baseline. Write the chosen model and the date into the RFC decision log.

Working rules: implement every task end to end before reporting, no commits, no comments unless they explain a non-obvious constraint, node:test for the notes tool and the runner, run everything and report real output. Anything that needs a physical device or an API key I have not provided, list it as unverified rather than claiming it works.
```

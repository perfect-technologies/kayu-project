# Phase 3: Mobile and evals

Reference: `../RFC-001-agent-concierge.md`, builds on Phases 1 and 2

## Goal

The same agent on the Expo app, a small explainable memory the client controls, an eval set so prompt changes are measured, and the entry point promoted on the home page.

## Scope

In:

- Mobile agent screen and mobile card implementations.
- `AgentMemoryNote` and the `remember` tool, with a settings view.
- Eval set from real transcripts, grader, and a script.
- Home page entry point and analytics.
- Lingala and mixed-input check.

Out: provider-side agent, proactive messages, voice, payments.

## Tasks

### 1. Mobile

- `apps/mobile/src/screens/agent/AgentScreen.tsx` using `useChat` with `DefaultChatTransport`, `expo/fetch` as the fetch implementation, api URL from `EXPO_PUBLIC_API_URL`, bearer token from the Supabase session.
- Components in `packages/ui/src/mobile/agent/`: composer, chips, provider pick list (reusing the mobile provider card), availability, approval, status, address. Same props contract as the web components.
- Tab or entry on the home screen mirroring the web placement.
- Streaming verified on a physical device over cellular, not only the simulator.

### 2. Agent notes

- Prisma `AgentMemoryNote { id, userId, content, source (AGENT | USER), createdAt, archivedAt }`.
- Tool `remember`, left out of the `toolApproval` map so it runs without confirmation, with a hard rule in the prompt: only preferences the client stated explicitly, one sentence, French. Capped at 20 active notes per client.
- Notes appended to the profile block.
- Settings page section "Ce que l'assistant retient" listing notes with delete. Web and mobile.

### 3. Evals

- Export script: anonymized transcripts (first user message, tool calls, final assistant text, whether a booking or request followed) from `AgentMessage` into `docs/ai-agents/evals/dataset.jsonl`. No names, no addresses.
- Grader: a rubric per case, scored by a model call: correct subcategory chosen, commune asked when missing, at most three providers proposed, no false confirmation language, fallback offered when search was empty. Binary per criterion.
- Runner script under `apps/backend/scripts/agent-eval.ts` that replays the first message against the current prompt with tools stubbed to the recorded outputs, then grades. Prints a table and writes results next to the dataset.
- Rule: no prompt change ships without a run showing no criterion regressed.

### 3b. Model selection

- Add `@ai-sdk/openai` to the backend and let `agent.model.ts` pick the provider from an environment variable, so the runner can target each candidate without code changes.
- Run the eval on Claude Opus 5 (baseline), GPT-5.6 Sol, Claude Sonnet 5, and GPT-5.6 Terra. Record per candidate: rubric score per criterion, average steps per turn, average tokens per conversation, and cost per completed booking using the list prices in RFC §11.
- Keep only candidates with no regressed criterion against the baseline, then choose the lowest cost per completed booking. Write the result and the date into the RFC decision log.
- Re-run when a candidate's price changes (Sol's promotional rate ends 2026-11-21) or a new model ships in either family.

### 4. Promotion and analytics

- Home page: a chip row or a single card "Dites-nous ce qu'il vous faut" linking to `/agents`, following the design-direction composition rules. Not a redesign of the home.
- Funnel events: agent opened, first message sent, provider chosen, approval shown, approval confirmed, booking created. Reuse the existing funnel event mechanism.
- After two weeks of data, compare conversion from agent versus browse. The decision to promote further is taken from that number.

### 5. Language check

- Add ten Lingala and mixed French-Lingala cases to the eval set. The criterion is that the agent understood the service and answered in French.
- Adjust the prompt only if the run shows failures.

### 6. Tests

- Notes tool: cap enforced, archived notes excluded from the profile block, deletion removes the note from the next turn.
- Eval runner: stubbed tools return recorded outputs, grading is deterministic on a fixed sample.

## Acceptance criteria

- A client completes a booking on the mobile app through the agent with the same approval card as the web.
- A note written by the agent appears in settings and disappears from the next conversation after deletion.
- The eval runner produces a scored table on the current prompt and fails the run on any regression against the stored baseline.
- The model comparison table exists for all four candidates and the RFC decision log names the chosen production model.
- Home page shows the agent entry point and funnel events arrive in the admin dashboard.

## Verification checklist

- Run the full flow on iOS and Android builds.
- Run the eval on the Phase 2 prompt and store the baseline.
- Review ten random transcripts by hand for tone and false-confirmation language.

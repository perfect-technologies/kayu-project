# Phase 4: Evals and promotion

Reference: `../RFC-001-agent-concierge.md` (revision 2), builds on Phases 1, 2 and 3

## Goal

An eval set so prompt and model changes are measured, the production model chosen from it, a small explainable memory the client controls, and the entry point promoted from funnel data. Mobile is out of scope.

## Owns

- Everything Phases 1, 2 and 3 own.
- `docs/ai-agents/evals/**`, `apps/backend/scripts/agent-eval.ts`.
- `apps/web/src/app/(shell)/compte/**` for the notes section; `apps/web/src/components/home/**` and `apps/web/src/components/layout/MobileNav.tsx` for promotion, recorded in `PROGRESS.md`.

## Must not touch

- `apps/mobile`. Out of scope.

## Scope

In:

- Eval set from anonymized transcripts, code-first graders, a model-graded check for wording only, runner calling the real `runTurn`.
- Model comparison across the four candidates in RFC §11 and the decision.
- `AgentMemoryNote` with the `remember` tool and the `/compte` section.
- Promotion: hero action, funnel events, dock tab decision.
- Lingala and mixed-input cases.

Out: mobile, provider-side agent, proactive messages.

## Tasks

### 1. Evals

- Export script: anonymized transcripts (first user message, tool calls with arguments, final assistant text, whether a booking or message followed) into `docs/ai-agents/evals/dataset.jsonl`. Names, phones, and address lines stripped; place labels kept.
- Cases: real transcripts first, then hand-written edge cases (no provider in the quartier, ambiguous service, unlisted service, locked contacts, taken slot, Lingala). Thirty to sixty cases. The owner reviews the list before the first paid run.
- Graders, code first: expected deepest taxonomy node, `find_place` called and resolved to the expected place id, place asked when missing, at most three providers proposed, no write tool before approval, fallback step taken when search was empty, no contact field in model messages. Model-graded, binary with a one-line reason: no false confirmation language, answered in French.
- Runner `apps/backend/scripts/agent-eval.ts`: replays each first message through the real `runTurn` with tools stubbed to recorded outputs, three runs per case, writes per-criterion rates, tokens, steps, latency, and cost next to the dataset. Pilot of five cases first, measured cost reported before the full run.
- Rule: no prompt change ships without a run showing no criterion regressed against the stored baseline.

### 2. Model selection

- `agent.model.ts` reads the gateway model id from an environment variable, defaulting to `anthropic/claude-opus-5`. No new packages. Candidate ids come from the gateway catalog.
- Run the eval on Claude Opus 5 (baseline), GPT-5.6 Sol, Claude Sonnet 5, GPT-5.6 Terra. Record per candidate: rates per criterion, steps per turn, tokens per conversation, cost per completed booking or sent message.
- Keep candidates with no regressed criterion, choose the lowest cost. Write the result and date into the RFC decision log and `PROGRESS.md`.
- Re-run when a price changes (Sol's promotional rate ends 2026-11-21) or a new model ships.

### 3. Agent notes

- Prisma `AgentMemoryNote { id, userId, content, source (AGENT | USER), createdAt, archivedAt }`.
- Tool `remember`, not in the `toolApproval` map, with a prompt rule: only preferences the client stated explicitly, one sentence, French. Twenty active notes per client.
- Notes appended to the profile block.
- `/compte` section "Ce que l'assistant retient": list with delete. Copy in `copy/compte.ts`.

### 4. Promotion

- Funnel events through the existing campaign funnel mechanism: assistant opened, first message, provider chosen, approval shown, approval confirmed, booking created, message sent.
- After two weeks, compare conversion to booking or message from the assistant versus from search. Owner decides from that number whether the assistant gets a dock tab (replacing or adding to the five client tabs) and a hero action. Both changes touch 04- and 05-owned files and are logged in `PROGRESS.md`.

### 5. Language check

- Ten Lingala and mixed cases in the eval set. Criterion: service understood, place resolved, answer in French. Adjust the prompt only if the run shows failures.

### 6. Tests

- Notes tool: cap enforced, archived notes excluded, deletion removes the note from the next turn.
- Eval runner: stubbed tools return recorded outputs, grading deterministic on a fixed sample.

## Acceptance criteria

- The eval runner produces a scored table on the current prompt, stores a baseline, and fails on any regression.
- The model comparison table exists for all four candidates and the decision is logged.
- A note written by the agent appears on `/compte` and disappears from the next conversation after deletion.
- Funnel events arrive on the admin overview.

## Verification checklist

- Review ten random transcripts by hand for tone and false-confirmation language.
- Screenshots under `docs/ai-agents/screenshots/04/`.

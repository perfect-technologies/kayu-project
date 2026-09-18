# Jev at KAYOU

Experiments with Jev, TypeSafe's "System One" model, on the `experiment/jev-search` branch. Jev does not write text: it reads text ("state") and answers typed questions (Choice, Score, Noul) with calibrated probabilities in roughly 70 to 500 ms, for $0.042 per million input tokens. Code owns the workflow; Jev supplies the judgment ordinary code cannot make.

Nothing here ships until an experiment passes the bar its spec fixes in advance.

## Documents

- `01-search-intent.md`: experiment 1. The search bar maps free text ("fuite d'eau sous l'évier") to a subcategory, so a client finds a plumber without typing "plomberie". Hypothesis, variants, eval method, pass bar, and the product change if it passes.
- `eval/search-queries.jsonl`: the labelled queries for experiment 1. Review before any run.
- `PROGRESS.md`: status, decisions, results.

## Ideas queued behind experiment 1

From the 2026-09-18 brainstorm, in order. Each gets its own spec only after experiment 1 reports.

1. Search intent (this experiment).
2. Pre-turn router for the assistant (`docs/ai-agents/`): intent, category hint, complexity routing to a cheaper model, urgency, off-topic refusal before a Claude call.
3. Message safety: contact sharing to move a deal off-platform, advance mobile-money scams, harassment, feeding the existing reports queue in `apps/backend/src/modules/safety/`.
4. Admin triage: reports, contact messages, reviews.

## Facts about Jev that shape every experiment

Read from the live docs (docs.typesafe.ai) on 2026-09-18. Re-check before relying on them; the model and limits move.

| Topic | What the docs say | Consequence for us |
| --- | --- | --- |
| Model | `jev-latest` and `jev-preview` both point to `jev-1.13.0` | Pin `jev-1.13.0`; thresholds are tuned per version |
| Language | English is the primary training language; other languages "handled but not equally well" | French and Lingala are the main risk. Every experiment measures per language |
| Limits | 64k tokens per request (32k for state plus the longest question); 1,200 requests per minute and 250k tokens per second per account, "adjusting dynamically" | Cache by normalized input; never call Jev on a hot path without a timeout and a fallback |
| Options | A Choice takes up to 255 options | Our 106 level-2 subcategories fit in one question |
| Weaknesses (`jev-1.13`) | Literal reading, numbers and dates, indirection, large irrelevant state, adversarial text | Keep state small, instructions literal, arithmetic in code |
| SDK | `@typesafe-ai/sdk` (Node 20+, ESM and CommonJS, typed answers, retries with backoff) | Use it rather than raw HTTP; it loads in our CommonJS backend |
| Data | Not trained on customer requests; DPA and privacy policy at typesafe.ai/legal; zero data retention for enterprise only | Owner reviews the DPA before any user text leaves the platform in production |

## Credentials

`TYPESAFE_API_KEY`, server-side only (never in `apps/web`). The owner holds the key; it goes in `apps/backend/.env`, which git ignores.

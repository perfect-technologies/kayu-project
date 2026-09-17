# AI agents

Design and execution documents for the KAYOU agent concierge: a conversational entry point where a client says what they need and the platform finds providers, checks real slots, and, on confirmation, messages or books.

Revision 2 (2026-09-17) targets the post-refactor product (`docs/kyou-ux-refactor/`). Read the product contract there first.

- `RFC-001-agent-concierge.md` — the full design: what changed since revision 1, product, architecture, tools, approval, context, memory, cost, risks, decisions.
- `execution/phase-1-foundation.md` — backend agent loop, read-only tools, web `/assistant` page.
- `execution/phase-2-actions-and-memory.md` — booking and message tools with approval, profile memory, caps.
- `execution/phase-3-evals-and-promotion.md` — eval set, model selection, agent notes, promotion.

Mobile is out of scope for all phases: `apps/mobile` is frozen and must be migrated to the new system first. Models are reached through the Vercel AI Gateway with one key.
- `execution/prompts.md` — copy-paste prompts to start each phase in a fresh agent session.
- `PROGRESS.md` — status, decisions, shared-file changes, evidence.

Each phase document is self-contained enough to implement from, but assumes the RFC's vocabulary.

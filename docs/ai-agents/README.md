# AI agents

Design and execution documents for the KAYOU agent: a conversational entry point where a client says what they need and the platform finds, proposes, and books the right provider.

- `RFC-001-agent-concierge.md` — the full design: product, architecture, tools, approval, context, memory, cost, risks, decisions.
- `execution/phase-1-foundation.md` — backend agent loop, read-only tools, web `/agents` page.
- `execution/phase-2-actions-and-memory.md` — booking and job-request tools with approval, profile memory, caps.
- `execution/phase-3-mobile-and-evals.md` — mobile screen, agent notes, evals, promotion of the entry point.
- `execution/prompts.md` — copy-paste prompts to start each phase in a fresh agent session.

Read the RFC first. Each phase document is self-contained enough to implement from, but assumes the RFC's vocabulary.

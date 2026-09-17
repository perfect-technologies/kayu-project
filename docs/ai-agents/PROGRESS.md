# Agent concierge — progress

## Status

| Phase | Status | Owner, date | Notes |
| --- | --- | --- | --- |
| 1 — Foundation | Not started (revision 2) | — | A revision-1 build exists on `feat/agent-concierge-phase-1` (`6bb6dca`) against the pre-refactor contract; reference only |
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

## Shared-file changes (record before consumers merge)

| Date | File | Change | Phase |
| --- | --- | --- | --- |

## Open questions for the owner

- Dock tab for the assistant on mobile (Phase 3, from funnel numbers).
- Auto-archive conversations after 30 days of inactivity (proposed yes).

## Evidence

Per phase: commands run with output, manual checks at 320 / 390 / 1440 px, screenshots under `screenshots/0N/`.

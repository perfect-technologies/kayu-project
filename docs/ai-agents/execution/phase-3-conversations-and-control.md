# Phase 3: Conversations and control

Reference: `../RFC-001-agent-concierge.md` (revision 2, §4.1), builds on `phase-1-foundation.md` and `phase-2-actions-and-memory.md`

## Why this phase exists

Phases 1 and 2 shipped a conversation that persists and nothing to manage it with. Opening `/assistant` always resumes the latest active conversation, so the client lands in yesterday's thread. There is no way to start a fresh one, to see the older ones, to archive, or to delete. The only conversation-switching action in the product is a "Nouvelle conversation" button that appears at the 60-message cap.

Everything needed is already there: conversations carry a generated title, a status and a last-message timestamp, `GET /assistant/conversations` lists the active ones newest first, and `POST /assistant/conversations/:id/archive` exists. What is missing is a surface and a freshness rule.

## Goal

The client owns the conversation. They can see the ones they had, open any of them, start a new one whenever they want, rename, archive, reactivate and delete. Opening the assistant the next morning does not drop them into yesterday.

## Owns

- `apps/backend/src/modules/agent/**` (list, lifecycle and settings only; the loop, tools, prompt and profile block are untouched).
- `apps/web/src/app/(shell)/assistant/**`, `apps/web/src/components/assistant/**`, `apps/web/src/copy/assistant.ts`.
- `packages/schemas/src/dto.ts` and `packages/api/src/{endpoints,query-keys}.ts`, assistant entries only.
- `apps/backend/prisma/seed-settings.ts` for the two new keys.

## Must not touch

- The turn loop, the tools, the system prompt, the profile block, the approval flow. This phase changes no model behaviour.
- Bookings, messaging, addresses service logic.
- `apps/mobile`. Out of scope, frozen.
- Launch-lead tables, endpoints, DTOs, tests.

## Scope

In:

- The freshness rule that decides which conversation greets the client.
- A conversation list with active and archived sections, reachable from a header row.
- Start a conversation on demand, rename, archive, reactivate, delete.
- Automatic archiving after a period of inactivity, without a scheduler.
- A deep link to one conversation.
- Read-only rendering of an archived conversation, with a way to reactivate it.

Out: evals, model selection, agent notes, promotion (Phase 4). Search inside conversations. Sharing or exporting a conversation. Pinning.

## Tasks

### 1. Backend: listing

- `GET /assistant/conversations` gains `status` (`active` default, `archived`, `all`), `page` and `limit` (default 20, max 50), returning the usual `{ items, total, page, limit }` envelope. The default stays `active` so the existing callers behave as they do today.
- Each item gains `preview`: the trimmed text of the last stored message, at most 120 characters, derived from a nested `take: 1` select. No new column, because `title`, `status` and `lastMessageAt` already carry the rest.
- Ordering stays `lastMessageAt` descending.

### 2. Backend: lifecycle

- `POST /assistant/conversations/:id/unarchive` sets the status back to `ACTIVE` and does not touch `lastMessageAt`, so reactivating does not jump the conversation to the top of the list.
- `DELETE /assistant/conversations/:id` deletes the conversation and cascades its messages. It does not delete bookings or the provider conversations the agent created: those live in their own tables and stay visible on `/mes-reservations` and `/messagerie`. Deleting the last conversation is allowed; the page then opens a fresh one.
- `PATCH /assistant/conversations/:id` sets `title`, trimmed, 1 to 80 characters. Passing `null` restores the generated title from the first user message.
- All four are `@Roles("CLIENT")` with the same ownership check as the existing routes: another client's id is 403, an unknown id is 404.
- A turn on an archived conversation already returns 409 `INVALID_TRANSITION`. That stays, and the web now renders it as a state rather than an error (task 5).

### 3. Backend: automatic archiving

- `agent.autoArchiveDays`, default 30, `0` disables it. Read through the existing settings service.
- The sweep runs lazily at the start of `listConversations`: one `updateMany` setting `status = ARCHIVED` for the actor's active conversations whose `lastMessageAt` is older than the window. Per actor, not global, so it stays cheap and needs no cron. The app runs no scheduler and this phase does not add one.
- The sweep is idempotent and must not touch a conversation that has just been reactivated within the window.

### 4. Which conversation greets the client

- `agent.resumeWindowHours`, default 12, `0` means always start fresh.
- `loadInitial` in the server component and `AssistantBootstrap` in the client resume `items[0]` only when its `lastMessageAt` is inside the window. Otherwise they create a new conversation and leave the previous one in the list.
- The same resolution runs in both places, so a cookie-less boot behaves identically. Factor it into one helper rather than duplicating the comparison.
- A conversation that is `full` is never resumed; it is treated as stale regardless of its age.

### 5. Web: the list and the header

- `ConversationHeader` sits above the thread: the current title (or the copy for a new conversation), a chevron opening the list, and a "Nouvelle conversation" pill. On a fresh empty conversation the pill is disabled, since there is nothing to leave.
- `ConversationSheet` uses the bottom-sheet pattern from the product contract: spring from `y 100%`, black/40 backdrop, `rounded-t-3xl`, `max-h-[85dvh]`, focus trap, Escape closes, body scroll locked, focus restored. At `sm` and above it becomes the centred modal the contract specifies, with the same content.
  - Two sections, "Actives" and "Archivées", the second collapsed until opened.
  - Each row: title, preview line, relative date, and a row menu with Ouvrir, Renommer, Archiver or Réactiver, Supprimer.
  - Delete opens the shared confirm sheet. The copy says the messages go and the bookings stay.
  - Rename is an inline field with an 80-character counter.
  - "Voir plus" appends the next page while `items.length < total`.
  - Empty state: the dashed `rounded-3xl` card with one action, per the contract.
- An archived conversation renders read-only: the composer is replaced by a notice with a "Réactiver" pill. Tapping it unarchives and restores the composer without a reload.
- The cap's existing "Nouvelle conversation" button calls the same action as the header pill. One code path.
- `/assistant?c=<id>` opens that conversation. An unknown or foreign id falls back to the normal resolution and shows a toast rather than an error page. Opening a conversation from the sheet updates the query parameter, so the back button walks the history.
- Every mutation invalidates the conversation list query key and, where relevant, the detail key.
- All copy in `apps/web/src/copy/assistant.ts`. Lucide icons only, pills for actions, skeletons never spinners, 320 px clean.

### 6. Tests

- Freshness rule: inside the window resumes, outside creates, `0` always creates, a `full` conversation is never resumed. Test the boundary in both directions.
- Listing: status filter, pagination envelope, preview derivation and its 120-character trim, ordering.
- Lifecycle: unarchive does not move `lastMessageAt`; delete cascades messages and leaves bookings and messaging conversations intact; rename validation and the `null` reset; ownership returns 403 and 404 on the four routes.
- Auto-archive: sweeps only the actor's stale active rows, is idempotent, respects `0`, and spares a just-reactivated conversation.
- Web: the sheet's focus trap and Escape, the read-only state and its reactivation, the deep link with a foreign id.

## Acceptance criteria

- Opening `/assistant` the morning after yesterday's conversation shows an empty new one, with yesterday's first in the list.
- Opening it again ten minutes later resumes the same conversation rather than making another.
- "Nouvelle conversation" works at any time, and the old conversation is still in the list afterwards.
- A conversation can be archived from the header and from the list, and then appears under "Archivées".
- An archived conversation opens read-only and a turn on it is refused; "Réactiver" restores the composer.
- Renaming shows the new title in the header and the list; clearing it restores the generated one.
- Deleting removes it from both sections, and a booking it created is still on `/mes-reservations`.
- A conversation untouched for 31 days is archived the next time the list is read, with no scheduler involved.
- `/assistant?c=<id>` opens that conversation; another client's id falls back with a toast and returns no data.
- Specs, type-check and production build green. 320, 390 and 1440 px, reduced motion, no horizontal overflow.

## Verification checklist

- Drive the whole lifecycle by hand at 390 px: create, name, archive, reactivate, rename, delete.
- Set `agent.resumeWindowHours` to `0`, reload, and confirm a fresh conversation every time; set it back.
- Set `agent.autoArchiveDays` to `1`, backdate a conversation in the database, read the list, confirm it archived.
- Confirm a deleted conversation's booking and provider thread survive.
- Screenshots under `docs/ai-agents/screenshots/03/`.

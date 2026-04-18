# DS04 — Messages upgrade (web + mobile)

## Goal

Rewrite the messaging surface with a split layout on web (360px list + thread), a single-screen-switch on mobile (list → thread on tap), system messages (booking confirmed, en-route banner), status chips on thread previews (Mission en cours / Devis en attente / Terminé), and a suggested-replies chip row during active missions.

## Why it matters

The v1 `ConversationsScreen` + `ChatScreen` on mobile predate the v2 patterns — plain bubbles, no system messages, no active-mission context. Clients can't distinguish "pre-quote chat" from "mission in progress" at a glance. V2 fixes that.

## Scope

### In scope
- `Messages` screen combining inbox (list) and thread view. Single component `Messages` handles routing between them.
- **Web:** split layout `grid: 360px 1fr` — list on left, thread on right, both 100% height
- **Mobile:** single-screen; tapping a thread swaps the whole screen to `<ThreadView mobile onBack={...}/>` (no separate stack navigation needed if we want smooth transitions, but native stack is fine too)
- `ThreadListItem` with status chip + unread badge
- `MessageBubble` with 3 variants: me / pro / system
- `ThreadView` header with avatar + online state + "Appeler" icon button
- Active-mission banner at top of thread (Sky-subtle + mission pointer)
- Suggested-replies row (only when thread.status === "active")
- Composer: attach (+) IconButton + rounded input + send IconButton
- Filter pills: Tous / Non lus / En cours — web inside list header, mobile at top of the page
- Search input on web list (empty on mobile)

### Out of scope
- Real WebSocket or SSE — use polling or the existing query invalidation
- File upload in composer — placeholder `+` IconButton only
- Voice notes, images in messages — future
- Message reactions, edits, deletes — out of scope
- Per-thread routes (`/messages/[threadId]`) — nice-to-have but not needed for DS04; mobile keeps tap-to-open, web keeps list+thread side-by-side
- Push notifications

## Reference files
- `prototype/components/Messages.jsx` — full reference, 358 lines. Data in `THREADS`, suggested replies in `SUGGESTED_REPLIES`.
- DS01 (icons) — `phone`, `plus`, `send` are already in v1; `inbox` is v1 too

## Data contract

A thread is:
```
{
  id, providerId, unread, lastAt (display str), status ("active" | "quote" | "completed"),
  preview (last message text), messages: [{ id, from: "me"|"pro"|"system", text, at }]
}
```

Backend shape: the existing `/messaging` endpoints likely return similar, with `status` derived from the associated booking/quote state. If `status` isn't there yet, DS04 flags that to backend and falls back to `"active"` if the thread has an associated active booking.

## Component structure

```
Messages
├── [web] grid(360, 1fr)
│   ├── <ThreadList>
│   │   ├── header: title + <SearchInput/> + <FilterPillRow/>
│   │   └── <ThreadListItem repeat/> (scrollable)
│   └── <ThreadView> (the active one, or empty-state "Sélectionnez une conversation")
│
└── [mobile]
    ├── if activeId === null: <InboxScreen/>
    │   ├── sticky header: title + filter pills
    │   └── <ThreadListItem repeat/>
    └── else: <ThreadView mobile onBack={() => setActiveId(null)}/>
```

## ThreadListItem

- Padded 14px; mobile 20px side-padding, web 16px
- Left: 44px Avatar with online indicator (v1 primitive)
- Right column:
  - Row 1: provider name (truncate) + lastAt caption right-aligned
  - Row 2: profession caption
  - Row 3: preview (2-line clamp). Bold-ish if `thread.unread > 0`, muted otherwise.
  - Row 4: status chip ("Mission en cours" emerald-subtle / "Devis en attente" amber-subtle / "Terminé" neutral) + unread badge (right-aligned, pill shape, primary bg, white text, mono font)
- 1px `var(--k-border-subtle)` bottom divider
- Active state: Sky-subtle bg + 3px Sky-primary left border

## ThreadView

### Header
- White bg, 1px border-bottom
- Mobile: back arrow first (margin-left -4), then avatar+name+online-or-last-seen (tap → nav("profile", providerId))
- Web: no back, just the tap-profile block
- Trailing: 38×38 round phone IconButton

### Mission banner (active only)
- Sky-subtle bg, 1px `#BAE6FD` border-bottom
- Padding 10 20, Sky-hover text
- Row: calendar icon + "Mission confirmée · demain 9h00" + ghost "Voir" link right

### Message list
- Scroll region, 16×14 (mobile) or 20×24 (web) padding, Sand bg

### MessageBubble

Three variants:
- **me** (right-aligned): primary bg, white text, border-bottom-right-radius 6, bubble radius 18, subtle primary shadow (`0 2px 8px rgba(14,165,233,0.2)`), `at` in rgba-white-70 mono below
- **pro** (left-aligned): surface bg, 1px Slate-200 border, Ink text, border-bottom-left-radius 6, elev.e1, `at` in Slate-subtle mono
- **system** (center-aligned pill): success-subtle bg with `#A7F3D0` border, success text, check icon leading, 999 radius, 8×14 padding

### Suggested replies (active only)
- Horizontal scroll row above composer
- Each pill: 1px border, transparent bg, fontSize 13, padding 8 14, 999 radius
- Tapping sends the text immediately

### Composer
- 12px top + bottom padding (web) / 10+14 mobile
- Row: 40px `+` IconButton (attach), 42px rounded input (999 radius, transparent bg inside), 42px round send IconButton (primary bg when draft.length > 0, disabled grey otherwise, shadow on active)
- Enter sends (debounce so Shift+Enter works later if needed)

## Web split-layout details

- Grid: `360px 1fr`; height: 100%
- Left panel: `var(--k-surface)` bg, 1px right border, flex-column
- Left header: 18 16 12 padding, 1px bottom border; search input below title; filter pills row
- Left scroll: flex-1 overflow-y auto
- Right panel: flex-column, minWidth 0 so chat truncates on long messages

## Mobile two-screen feel

Even though this is "one screen with two views", the transition between inbox and thread should feel native:
- If using React Navigation, put `ChatScreen` as a push on the stack with the threadId in route params
- If staying within the single-screen pattern, animate the swap (slide-from-right works) — but a stack push is cleaner

We go with **stack push** for mobile: `InboxScreen` and `ChatScreen` are two separate screens. The `Messages.jsx` prototype uses a single component because of its constrained preview shell — in production, it's two files (or one file with a `useNavigation` branch).

## What to retire

Mobile:
- `apps/mobile/src/screens/messages/ConversationsScreen.tsx` — rewrite in place
- `apps/mobile/src/screens/messages/ChatScreen.tsx` — rewrite in place

Web: new route, nothing to retire.

## Dependencies
- Depends on DS01
- Blocks: DS11 audit

## Acceptance criteria

1. Web `/messages` renders split layout with list and empty-thread-selected state at first load; picking a thread fills right pane
2. Mobile inbox → thread navigation is a stack push (back restores inbox scroll position)
3. ThreadListItem shows status chip, unread badge (when > 0), online dot on avatar (when pro.online)
4. MessageBubble system variant centers with emerald pill styling; me is primary; pro is surface-bordered
5. Mission banner renders only when `thread.status === "active"`
6. Suggested replies render only when active; tapping sends the text immediately
7. Composer send button enables when draft.trim().length > 0; disables otherwise
8. Enter key sends the message
9. Typing in the web search input filters the thread list (at least by provider name)
10. Filter pills (Tous / Non lus / En cours) work correctly

## QA checklist
- [ ] Unread count in the badge is derived from `thread.unread`, not computed client-side
- [ ] Long provider names truncate with ellipsis in ThreadListItem
- [ ] Last-message preview clamps to 2 lines consistently on both platforms
- [ ] System messages do not increment `unread`
- [ ] Sending a new message appends optimistically and clears `draft`
- [ ] Thread view scrolls to bottom on open
- [ ] "Appeler" phone IconButton shows a tooltip on web hover (`title="Appeler"`)
- [ ] Mobile composer respects the keyboard (no jank with `KeyboardAvoidingView`)
- [ ] Online indicator on avatar turns off when `provider.online === false`
- [ ] Tapping the avatar+name in ThreadView header navigates to the provider profile
- [ ] Tapping "Voir" in the mission banner navigates to `/bookings/[id]`
- [ ] The 4 sample threads in the prototype render correctly on day 1 (sanity check)

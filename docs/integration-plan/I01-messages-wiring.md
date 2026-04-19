# I01 — Messages wiring (easy win)

## Goal

Replace the `DEMO_THREADS` fixture in both `apps/web` and `apps/mobile` with real calls to the existing `/messages` backend. Prove out the integration pattern that the rest of the plan will follow.

## Why it's the easy win

Everything is already there — backend endpoints (`GET /messages`, `POST /messages`), `@kayu/schemas` (ConversationSchema, MessageSchema), `@kayu/api` (messagesApi, query keys). The fixtures are the only thing preventing the screens from being real.

## Scope

### In scope
- Delete `DEMO_THREADS` from web and mobile Messages screens
- Wire `ConversationsScreen` (mobile) / `/messages` list panel (web) to `GET /messages` (list conversations)
- Wire `ChatScreen` (mobile) / thread panel (web) to `GET /messages?conversationId=X` + `POST /messages`
- Polling (TanStack Query `refetchInterval: 15_000` on list, `5_000` on an active chat) — simulates real-time
- Loading / empty / error states for each view
- Thread status chip (`active / quote / completed`) derived from the thread's related booking (or default to plain if no booking)
- Filter pills (Tous / Non lus / En cours) wired to a client-side filter over the real data (keep current behavior; no server-side filter)
- Suggested-replies row only on threads with `status === "active"` — unchanged

### Out of scope
- WebSockets / SSE
- Typing indicators
- Message deletion, editing, reactions
- File / image upload
- Server-side search (the web search input filters client-side over the loaded list)
- Push notifications

## Backend state check

Already in place at `apps/backend/src/modules/messaging/`:
```
GET /messages (conversations list or messages in a conversation)
  Guards: SupabaseGuard, ActorGuard
  Query: conversationId?, page?, limit?
POST /messages
  Guards: SupabaseGuard, ActorGuard
  Body: { recipientId, content, type, fileUrl? }
```

Verify the response shapes return:
- **List conversations:** `ConversationsResponse` (array with preview, unread, lastMessageAt, otherUser, thread.status if available)
- **List messages:** `MessagesResponse` (array with senderId, content, type, isRead, createdAt — system messages should have `type === "SYSTEM"` or derive from a backend-generated `message.type`)
- **Send:** returns the created message

If the shapes are missing a field (e.g. `thread.status`), add it to the schema in `@kayu/schemas` and extend the backend service to compute it from the related booking.

## `@kayu/schemas` state

- `ConversationSchema` ✅
- `MessageSchema` ✅
- `MessageType` enum ✅ (already includes TEXT, IMAGE, FILE, LOCATION, BOOKING_REQUEST, QUOTE)

**Add** (if not there):
- `system` MessageType value — used for server-generated "Réservation confirmée" markers. Extend the enum.
- `ConversationStatus` enum (`active | quote | completed | none`) — derived on the server from the conversation's bookings.

If the conversation has:
- a current in-progress booking → `status = "active"`
- an outstanding quote waiting for client → `status = "quote"`
- only completed bookings → `status = "completed"`
- no bookings → `status = "none"` (render no chip)

## `@kayu/api` state

- `messagesApi(client)` ✅ with `getConversations`, `getMessages`, `send`
- `queryKeys.messages.conversations` + `queryKeys.messages.conversation(id)` ✅

**Add** if missing: a typed `MessagesResponse` schema so consumers don't get `unknown`.

## Frontend wiring — web

File: `apps/web/src/app/messages/page.tsx` (or wherever Messages is routed)

Delete the `DEMO_THREADS` constant. Replace with:

```tsx
const { data: conversations, isLoading, error, refetch } = useQuery({
  queryKey: queryKeys.messages.conversations,
  queryFn: () => messagesApi(apiClient).getConversations(),
  refetchInterval: 15_000,
})

const { data: messages } = useQuery({
  queryKey: queryKeys.messages.conversation(activeId),
  queryFn: () => messagesApi(apiClient).getMessages(activeId!),
  enabled: !!activeId,
  refetchInterval: 5_000,
})

const sendMut = useMutation({
  mutationFn: (text: string) =>
    messagesApi(apiClient).send({ recipientId: activeThread.otherUser.id, content: text, type: "TEXT" }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversation(activeId) }),
})
```

States:
- `isLoading` → `<PageSkeleton kind="messages" />` from `@kayu/ui` (exists from D08)
- `error` → `<ErrorState onRetry={() => refetch()} />`
- Empty → `<EmptyState icon="inbox" title="Aucun message" subtitle="Tes échanges avec les pros apparaîtront ici." />`

## Frontend wiring — mobile

Files:
- `apps/mobile/src/screens/messages/ConversationsScreen.tsx` — same pattern, `@kayu/api` client from the mobile adapter
- `apps/mobile/src/screens/messages/ChatScreen.tsx` — same

Mobile uses stack navigation: tapping a ThreadListItem pushes `ChatScreen` with `route.params.conversationId`.

Delete `DEMO_THREADS` from mobile `fixtures.ts` (or wherever it lives).

## Optimistic UI for send

On send, optimistically append the user's message locally (immediate feedback) and reconcile when the mutation resolves:

```ts
onMutate: async (text) => {
  await queryClient.cancelQueries({ queryKey: queryKeys.messages.conversation(activeId) })
  const prev = queryClient.getQueryData(...)
  queryClient.setQueryData(..., (old) => [...old, { id: "optimistic", from: "me", text, at: "maintenant" }])
  return { prev }
},
onError: (_err, _vars, ctx) => { /* rollback */ queryClient.setQueryData(..., ctx.prev) }
```

## Fixtures to delete

- `apps/web` Messages: `DEMO_THREADS`, `SUGGESTED_REPLIES` (keep — it's product config, not data)
- `apps/mobile` fixtures.ts: `DEMO_THREADS`

## Dependencies
- None (easy win; everything it needs exists)
- Blocks I10 (cleanup sweep)

## Acceptance criteria

1. Sending a message on the web persists to DB and shows on the other user's session within 15s
2. Thread list shows real unread counts, last messages, last timestamps
3. Thread-status chips derive from backend data (no client-side faking)
4. Web and mobile both render the same thread correctly
5. No `DEMO_THREADS` reference remains in app code
6. Loading, empty, error states all visible on the right conditions

## QA checklist
- [ ] `grep -r "DEMO_THREADS" apps/` returns nothing
- [ ] Open `/messages` without any conversations → empty state renders
- [ ] Backend down → error state with retry button
- [ ] Send a message → appears immediately (optimistic) then confirmed
- [ ] Two browser sessions as different users: one sends, the other receives within 15s (polling)
- [ ] System messages render as emerald-subtle pill (backend must produce `type === "SYSTEM"` with proper text)
- [ ] Active-mission banner appears on threads where the related booking is in progress
- [ ] Suggested replies render only when thread.status === "active"
- [ ] Search input on web list filters client-side by provider name
- [ ] Filter pills (Tous / Non lus / En cours) narrow the visible list
- [ ] Mobile stack push from ConversationsScreen → ChatScreen restores scroll position on back
- [ ] Unread count badge clears when a thread is opened (mark-read call or implicit on fetch)

# 07 — Backend: Messaging, Notifications & Social

## Goal

Migrate the messaging system (conversations and messages), notification system, and favorites functionality from Next.js API routes to NestJS modules.

## Why It Matters

Communication between clients and providers is essential for a service marketplace. Clients need to discuss details before booking, and providers need to coordinate logistics. Notifications keep users informed about booking updates, new messages, and reviews. Favorites let clients save providers they want to book later.

## Scope

### In Scope
- `MessagingModule` with controller and service
- `NotificationsModule` with controller and service
- `FavoritesModule` with controller and service
- Endpoints:
  - `POST /api/messages` — send a message
  - `GET /api/messages` — list conversations or messages in a conversation
  - `GET /api/notifications` — list user notifications
  - `PATCH /api/notifications/:id/read` — mark notification as read
  - `PATCH /api/notifications/read-all` — mark all as read
  - `GET /api/favorites` — list favorite providers
  - `POST /api/favorites` — add a favorite
  - `DELETE /api/favorites` — remove a favorite
- Conversation creation (auto-create when first message sent)
- Message read tracking
- Unread count per conversation

### Out Of Scope
- WebSocket/real-time messaging (polling is acceptable for MVP)
- Push notifications (future)
- File upload for message attachments (use URL references)
- Message deletion (the `isDeleted` field exists but soft-delete isn't used)

## API Endpoints

### `POST /api/messages`

**Auth required**

**Request body** (validated with `CreateMessageDto`):
```
{
  recipientId: string
  content: string
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'LOCATION' | 'BOOKING_REQUEST' | 'QUOTE'
  fileUrl?: string
}
```

**Logic:**
1. Find or create conversation between sender and recipient
   - Conversation uniqueness: sorted pair of user IDs (user1Id < user2Id)
2. Create message in conversation
3. Update conversation `lastMessageAt`
4. Create notification for recipient (type: NEW_MESSAGE)
5. Return message

### `GET /api/messages`

**Auth required**

**Query params:**
- `conversationId` — if provided, return messages in this conversation
- `page` / `limit` — pagination

**Response (conversation list):**
```
{
  success: true,
  conversations: [
    {
      id, otherUser: UserSummary, lastMessage: MessageSchema,
      lastMessageAt, unreadCount
    }
  ]
}
```

**Response (messages in conversation):**
```
{
  success: true,
  messages: MessageSchema[],
  pagination: { page, limit, total, totalPages }
}
```

**Logic:**
- If `conversationId`: fetch messages, mark unread messages as read, return paginated
- If no `conversationId`: fetch all conversations for current user, include last message and unread count per conversation

### `GET /api/notifications`

**Auth required**

**Query params:**
- `unreadOnly` — boolean
- `page` / `limit` — pagination

**Response:**
```
{
  success: true,
  notifications: NotificationSchema[],
  unreadCount: number,
  pagination: { page, limit, total, totalPages }
}
```

### `PATCH /api/notifications/:id/read`

**Auth required**

Marks a single notification as read. Sets `isRead = true` and `readAt = now()`.

### `PATCH /api/notifications/read-all`

**Auth required**

Marks all unread notifications for the current user as read.

### `GET /api/favorites`

**Auth required**

**Query params:**
- `providerId` — optional, check if a specific provider is favorited

**Response (list):**
```
{
  success: true,
  favorites: FavoriteSchema[] (with provider details)
}
```

**Response (check single):**
```
{
  success: true,
  isFavorited: boolean
}
```

### `POST /api/favorites`

**Auth required**

**Request body:** `{ providerId: string }`

**Logic:**
1. Validate provider exists
2. Check for duplicate (userId + providerId is unique)
3. Create favorite
4. Return success

### `DELETE /api/favorites`

**Auth required**

**Request body:** `{ providerId: string }`

Removes the favorite entry.

## Module Structure

```
apps/backend/src/modules/
├── messaging/
│   ├── messaging.module.ts
│   ├── messaging.controller.ts
│   └── messaging.service.ts
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.controller.ts
│   └── notifications.service.ts
└── favorites/
    ├── favorites.module.ts
    ├── favorites.controller.ts
    └── favorites.service.ts
```

## Notification Service as Shared Utility

The notification service is used by multiple modules (bookings, reviews, messaging). It should be exported from `NotificationsModule` so other modules can inject `NotificationsService` to create notifications:

```typescript
// Usage in BookingsService:
this.notificationsService.create({
  userId: provider.userId,
  type: 'BOOKING_NEW',
  title: 'Nouvelle réservation',
  message: `${client.firstName} a demandé un service`,
  data: { bookingId: booking.id }
})
```

## Conversation Uniqueness

Conversations between two users are unique. The current implementation sorts user IDs to ensure consistency:
- `user1Id` = min(senderId, recipientId)
- `user2Id` = max(senderId, recipientId)
- Unique constraint on `(user1Id, user2Id)`

This ensures that regardless of who initiates the conversation, there's only one conversation record.

## Dependencies

- **Depends on:** Chunk 02 (schemas), Chunk 03 (Prisma, guards), Chunk 04 (auth)
- **Does NOT depend on:** Chunk 05 or 06 (messaging is independent of providers/bookings)
- **Required by:** Chunk 08 (admin may need to view messages), Chunk 10 (web messaging UI), Chunk 12 (mobile messaging)

## Acceptance Criteria

1. Sending a message creates a conversation if none exists
2. Messages are ordered by creation time
3. Reading a conversation marks unread messages as read
4. Conversation list shows last message and unread count
5. Notifications are created for new messages
6. Notifications can be marked as read (single and bulk)
7. Favorites can be added and removed
8. Duplicate favorites are rejected
9. Favorite check returns boolean for specific provider

## Suggested Implementation Steps

1. Create `modules/notifications/notifications.service.ts` first (used by other modules)
2. Create `modules/notifications/notifications.controller.ts` with GET, PATCH endpoints
3. Create `modules/messaging/messaging.service.ts` with `sendMessage`, `getConversations`, `getMessages` methods
4. Create `modules/messaging/messaging.controller.ts`
5. Create `modules/favorites/favorites.service.ts` with `add`, `remove`, `findAll`, `isFavorited` methods
6. Create `modules/favorites/favorites.controller.ts`
7. Export `NotificationsService` from its module so bookings/reviews modules can use it
8. Test messaging flow end-to-end
9. Test notification creation and read marking

## QA / Validation Checklist

- [ ] `POST /api/messages` creates a message and auto-creates conversation
- [ ] `GET /api/messages` returns conversation list with unread counts
- [ ] `GET /api/messages?conversationId=X` returns messages and marks as read
- [ ] Second message between same users reuses existing conversation
- [ ] `GET /api/notifications` returns paginated notifications
- [ ] `PATCH /api/notifications/:id/read` marks single notification as read
- [ ] `PATCH /api/notifications/read-all` marks all notifications as read
- [ ] `POST /api/favorites` adds a favorite
- [ ] `POST /api/favorites` rejects duplicate
- [ ] `DELETE /api/favorites` removes a favorite
- [ ] `GET /api/favorites?providerId=X` returns isFavorited boolean
- [ ] Notification created when message is sent

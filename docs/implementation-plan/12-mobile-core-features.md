# 12 — Mobile App: Core Features

## Goal

Implement the full mobile marketplace experience: provider search and browsing, provider profiles, booking creation and management, reviews, messaging, favorites, profile management, and settings.

## Why It Matters

The mobile app is the primary way users in DRC and Congo-Brazzaville will use KAYOU — mobile-first market. This chunk delivers the features that make the app functional beyond just logging in. After this chunk, mobile users can complete the full marketplace flow: find a provider → book a service → message the provider → leave a review.

## Scope

### In Scope
- **Search & Browse:**
  - Search screen with text search, category filter, city filter
  - Provider list with cards (name, profession, rating, price, city)
  - Category detail screen (subcategories, providers)
- **Provider Profile:**
  - Full profile screen (info, skills, certifications, portfolio, reviews)
  - Rating display (5 category icons: punctuality, quality, communication, value, professionalism)
  - Contact button (opens messaging)
  - Favorite toggle
- **Bookings:**
  - Booking creation form (from provider profile)
  - My bookings list (with status tabs: All, Pending, Confirmed, Completed, Cancelled)
  - Booking detail screen
  - Status update actions (confirm, cancel)
- **Reviews:**
  - Review form (after completed booking, 5-category rating input)
  - Reviews list on provider profile
- **Messaging:**
  - Conversation list
  - Chat screen (send/receive text messages)
  - Unread message indicators
- **Profile & Settings:**
  - Profile screen (view/edit name, phone, city)
  - Visibility settings
  - Logout
- **Favorites:**
  - Favorites list screen
  - Toggle favorite from provider profile

### Out Of Scope
- Push notifications
- Image/file upload in messages
- Map view (Leaflet doesn't work in React Native — use react-native-maps later)
- Provider onboarding on mobile (complex multi-step form — web only for MVP)
- Admin dashboard on mobile
- Payment
- Offline support

## Screen Inventory

### Search Tab
- `SearchScreen.tsx` — search input, category filter pills, provider results list
- `CategoryDetailScreen.tsx` — subcategory grid, filtered providers
- `ProviderProfileScreen.tsx` — full provider profile
- `AllReviewsScreen.tsx` — paginated reviews for a provider

### Bookings Tab
- `BookingsScreen.tsx` — booking list with status tabs
- `BookingDetailScreen.tsx` — booking detail with actions
- `CreateBookingScreen.tsx` — booking form (from provider profile)
- `ReviewScreen.tsx` — review form (after completed booking)

### Messages Tab
- `ConversationsScreen.tsx` — conversation list with last message preview
- `ChatScreen.tsx` — message thread

### Profile Tab
- `ProfileScreen.tsx` — user info, favorites link, settings link, logout
- `EditProfileScreen.tsx` — edit name, phone, city
- `FavoritesScreen.tsx` — list of favorite providers
- `SettingsScreen.tsx` — visibility settings

### Navigation Update

```
MainTabs
├── HomeTab
│   └── HomeScreen
├── SearchTab (Stack)
│   ├── SearchScreen
│   ├── CategoryDetailScreen
│   ├── ProviderProfileScreen
│   │   ├── CreateBookingScreen (modal)
│   │   └── AllReviewsScreen
│   └── ChatScreen (from contact button)
├── BookingsTab (Stack)
│   ├── BookingsScreen
│   ├── BookingDetailScreen
│   └── ReviewScreen
├── MessagesTab (Stack)
│   ├── ConversationsScreen
│   └── ChatScreen
└── ProfileTab (Stack)
    ├── ProfileScreen
    ├── EditProfileScreen
    ├── FavoritesScreen
    │   └── ProviderProfileScreen
    └── SettingsScreen
```

## Key UI Components to Create

### Provider Components
- `ProviderCard.tsx` — compact card for lists (avatar, name, profession, rating, price, city)
- `ProviderProfileHeader.tsx` — large header with avatar, name, rating, favorite toggle
- `ProviderAboutSection.tsx` — description, experience, rate
- `ProviderSkillsSection.tsx` — skill badges
- `ProviderCertificationsSection.tsx` — certification cards
- `ProviderPortfolioSection.tsx` — image gallery
- `ProviderReviewsSection.tsx` — review cards with rating breakdown

### Booking Components
- `BookingCard.tsx` — booking list item (title, provider, status badge, date)
- `BookingStatusBadge.tsx` — colored status indicator
- `BookingForm.tsx` — create booking inputs

### Rating Components
- `RatingDisplay.tsx` — 5 category icons with scores (mobile-adapted layout)
- `RatingInput.tsx` — tappable rating input for each category

### Messaging Components
- `ConversationCard.tsx` — conversation preview (avatar, name, last message, time, unread badge)
- `MessageBubble.tsx` — message bubble (sent/received styles)
- `ChatInput.tsx` — text input with send button

### Common Components (extend from chunk 11)
- `EmptyState.tsx` — empty list placeholder
- `LoadingSpinner.tsx` — activity indicator
- `PullToRefresh.tsx` — pull-to-refresh wrapper
- `StatusBar.tsx` — booking/message status indicators

## Data Fetching Patterns

All data fetching uses TanStack Query with `@kayu/api`:

```typescript
// Provider search
const { data, isLoading } = useQuery({
  queryKey: queryKeys.providers.search({ q: searchQuery, category, city }),
  queryFn: () => providersApi(apiClient).search({ q: searchQuery, category, city }),
  enabled: !!searchQuery || !!category,
})

// Create booking (mutation)
const mutation = useMutation({
  mutationFn: (data: CreateBookingDtoType) => bookingsApi(apiClient).create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() })
  },
})
```

## Platform-Specific Considerations

- **Keyboard handling:** Use `KeyboardAvoidingView` for forms
- **Safe areas:** Use `SafeAreaView` from `react-native-safe-area-context`
- **Images:** Use `Image` from React Native (not `next/image`)
- **Scrolling:** Use `FlatList` for long lists (not ScrollView with map)
- **Navigation:** Use `navigation.navigate()` (not Next.js `Link`)
- **Status bar:** Configure with `expo-status-bar`
- **Haptics:** Use `expo-haptics` for button feedback (optional)

## Dependencies

- **Depends on:** Chunk 11 (mobile foundation, auth, navigation), Chunks 04-08 (all backend endpoints)
- **Required by:** Chunk 13 (launch readiness)

## Acceptance Criteria

1. User can search for providers by text, category, and city
2. Provider profile shows full information with ratings
3. User can create a booking from provider profile
4. My bookings list shows all bookings with status tabs
5. User can leave a review for a completed booking (5-category rating)
6. Conversation list shows all chats with unread indicators
7. Chat screen sends and receives messages
8. User can add/remove favorites
9. Profile screen shows user info and allows editing
10. Visibility settings work
11. All screens handle loading, empty, and error states
12. Navigation flows are intuitive (back buttons, tab switching)

## Suggested Implementation Steps

1. Update `AppNavigator.tsx` with full navigation structure (stacks within tabs)
2. Build search screen with provider list
3. Build provider profile screen (reuse data patterns from web)
4. Build booking creation flow (form → submit → navigate to bookings)
5. Build bookings list and detail screens
6. Build review screen (accessible from completed booking detail)
7. Build conversation list and chat screens
8. Build favorites screen and toggle
9. Build profile and settings screens
10. Add loading spinners, empty states, error handling to all screens
11. Test complete user flow: search → view provider → book → review → message
12. Polish UI: spacing, colors (from `@kayu/ui`), typography

## QA / Validation Checklist

- [ ] Search by text returns matching providers
- [ ] Search by category shows filtered results
- [ ] Provider profile loads with full data
- [ ] Favorite toggle works (add/remove)
- [ ] Booking form validates required fields
- [ ] Booking creation succeeds and appears in bookings list
- [ ] Booking status tabs filter correctly
- [ ] Review form requires all 5 category ratings
- [ ] Review creation updates provider rating
- [ ] Conversation list shows chats with unread count
- [ ] Sending a message appears in chat
- [ ] Receiving a message appears (on refresh/pull-to-refresh)
- [ ] Profile edit saves changes
- [ ] Visibility settings save correctly
- [ ] Empty states shown when no data
- [ ] Loading spinners shown during data fetch
- [ ] Error states shown on network failure
- [ ] Back navigation works on all screens
- [ ] Tab switching preserves scroll position

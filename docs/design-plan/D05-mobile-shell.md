# D05 — Mobile shell: navigation, headers, safe areas, icon buttons

## Goal

Build the mobile app's chrome — the floating bottom tab bar, the shrinking sticky search header, the icon buttons, and the scroll/safe-area wiring that every mobile screen depends on.

## Why it matters

Every screen in D06/D07 sits inside this shell. Getting the shell right (tab bar behavior, safe-area padding, scroll listeners for shrinking) makes those screens easy. Getting it wrong makes every screen fight the shell.

## Scope

### In scope — `apps/mobile`
- `src/navigation/AppNavigator.tsx` — tabs + stacks wiring with React Navigation
- `src/components/MobileTabBar.tsx` — floating pill tab bar
- `src/components/ShrinkingSearchHeader.tsx` — the shrinking-on-scroll header used on home and search
- `src/components/IconButton.tsx` — round 36–44px icon button (elevated)
- `src/components/FloatingBackButton.tsx` — the round Paper button on photo heroes
- `src/components/StickyBottomBar.tsx` — the Paper bar with 1px top border used for price/reserve and footer CTAs
- Safe-area handling across iOS notch + Android navigation gesture bar
- Scroll wiring: a shared `useShrinkOnScroll(threshold)` hook

### Out of scope
- The actual home / search / profile screens (D06)
- Booking sheet (D07 — it replaces the shell, not wraps it)

## Reference files
- `prototype/components/MobileShell.jsx` — the Airbnb-style `MobileTabBar`, `FeaturedProviderCard`, `WideProviderCard`, `NearbyRow`, `CategoryStrip` (cards are D03; tab bar is this chunk)
- `prototype/components/Homepage.jsx` — the `MobileHome` function shows the shrinking header in action, with the sticky search pill and scrolled boolean
- DESIGN_SYSTEM §8.7 (bottom tab), §8.8 (shrinking header), §8.9 (sticky bottom CTA)

## Component specs

### MobileTabBar

Floating pill, 5 icon-only tabs.

- Container: `position: absolute; left: 0; right: 0; bottom: 0; zIndex: 30; padding: 8 10 14; pointer-events: none` with gradient `linear-gradient(to top, tokens.color.bg 70%, transparent)` as a fade behind the pill
- Inner pill: `pointer-events: auto`, `display: flex; justify-content: space-between; align-items: center`, Paper bg, radius `pill`, padding `6 8`, `elev.4`
- 5 tabs: `Accueil (home) / Rechercher (search) / Réservations (calendar) / Messages (inbox) / Moi (user)`
- Each tab: `flex: 1; padding: 10 6; border-radius: pill`. Inactive icon color Slate-500; active is a Sky-primary filled pill behind a white icon
- Transition 240ms standard on color/background
- **Hides on booking screens and provider profile** — the calling screen decides visibility via a prop or by not rendering it
- Bottom safe inset is handled by the container padding — do not add another `SafeAreaView` below it (creates double padding)

On press: haptic-style bump via `Pressable` with `transform: scale(0.96)` over 120ms.

### ShrinkingSearchHeader

Used on mobile Home. Has two rendered heights — a tall default (brand row visible) and a short scrolled state (brand row collapsed).

Props: `onSearchTap`, `scrolled: boolean`

- Container: `position: sticky; top: 0; zIndex: 10; background: Sand; paddingTop: 10; transition: box-shadow 240ms; box-shadow: scrolled ? 0 1px 0 borderSubtle : none`
- **Brand row** (collapses on scroll): padding 4 20, `display: flex; justify-content: space-between; align-items: center`, `height: scrolled ? 0 : 40`, `overflow: hidden`, `opacity: scrolled ? 0 : 1`, `transition: height 240ms standard, opacity 180ms`
  - Left: logo 22px + "KAYOU" (Display 800, 18px)
  - Right: two 36×36 round icon buttons (inbox, user)
- **Search pill** (always visible): padding 8 16 14
  - Button with `display: flex; align-items: center; gap: 12; width: 100%; padding: scrolled ? 10 16 : 14 18; background: Paper; border: 0; border-radius: pill; elev.e3; transition: padding 200ms`
  - Search icon 18px Ink
  - Middle block (flex 1): Bold 14px "Trouve un pro" + Caption "Plomberie · Coiffure · Ménage · …" (the caption collapses when scrolled)
  - Right block: 32px circle Sky-50 bg, Sky-hover icon (sliders)

### useShrinkOnScroll

Hook that returns `[scrolled, scrollRef]`:
- On web (RN-web): listen to the nearest scroll container
- On native: provide an `onScroll` handler + pass to a `ScrollView`/`FlatList`
- Threshold: 40px
- Uses `requestAnimationFrame` to throttle updates; returns `true` when scrollTop > threshold

### IconButton

Round, elevated, used for header actions (inbox/user) and various in-screen buttons.

- Size prop: 32 | 36 | 40 | 44 (default 36)
- Shape: `border-radius: pill`, Paper bg, no border
- Shadow: `elev.e1` (or `elev.e2` for 40+)
- Active: scale 0.94 for 120ms
- Accepts any Lucide icon via the D02 Icon primitive

### FloatingBackButton

Used on full-bleed photo heroes (mobile profile). Sits absolutely positioned over a photo.

- 38×38 round, `rgba(255,255,255,0.96)` background, `backdrop-filter: blur(6px)` on supporting platforms
- `elev.e1` shadow
- No border
- Icon: arrowLeft 18px Ink

Also export `FloatingShareButton` and `FloatingHeartButton` with the same chassis — just different icons (and heart toggles between Ink and Coral-filled).

### StickyBottomBar

The sticky footer pattern. Used for mobile profile's price+reserve and mobile booking's step footer.

Props: `children` (the content), `safeAreaInsets: optional`

- `position: absolute; left: 0; right: 0; bottom: 0; zIndex: 40`
- `background: Paper; border-top: 1px solid tokens.color.border; padding: 12 16 18`
- `display: flex; align-items: center; gap: 12`
- `box-shadow: 0 -4px 20px -8px rgba(15,23,42,0.1)` (negative-y so it lifts from the bottom edge)

Consumers compose content inside — the bar is layout-only.

### Navigator wiring

```
AppNavigator (NavigationContainer)
└── Tab (BottomTabNavigator, custom tabBar={MobileTabBar})
    ├── HomeStack → [Home, ProviderProfile, Booking*]
    ├── SearchStack → [Search, ProviderProfile, Booking*]
    ├── BookingsStack → [BookingsList, BookingDetail]
    ├── MessagesStack → [Conversations, Thread]
    └── ProfileStack → [Profile, EditProfile, Settings]

* Booking uses a modal stack on top of the parent stack — full-screen sheet pattern.
  When Booking is active, the MobileTabBar hides via the tabBarStyle returning null.
  Likewise for ProviderProfile.
```

Route config also handles the "hide tab bar on profile and booking" logic via React Navigation's `tabBarStyle` option.

## Dependencies
- Depends on D02 (Icon, Avatar primitives)
- Depends on migration chunk 11 (Expo scaffold) — app must exist
- Blocks D06 (mobile screens) and D07 (mobile booking)

## Acceptance criteria
1. Floating tab pill renders at bottom of every screen in HomeStack and SearchStack, except when on ProviderProfile or Booking
2. Tab bar is icon-only (no labels anywhere) — user preference
3. Active tab is a Sky-primary pill with white icon; inactive is Slate-500 on transparent
4. Shrinking header collapses brand row smoothly at scrollTop > 40 on mobile Home
5. Back button on full-bleed photo heroes uses `FloatingBackButton` with backdrop blur
6. StickyBottomBar + MobileTabBar never render at the same time on the same screen
7. Safe-area insets are respected on iPhone 14 (notch), iPhone SE (no notch), and Pixel 6 (gesture bar)

## QA checklist
- [ ] Tab bar pill stays pill-shaped (not stretched) on iPhone SE width (375px)
- [ ] Tab bar icon-only active pill is a perfect circle behind the icon, not a stretched oval
- [ ] Brand row collapse animation is smooth (no jank) at 60fps on older Android
- [ ] Search pill press produces a visible scale animation before navigating
- [ ] Inbox and user icon buttons on brand row are 36×36 with Paper shadow
- [ ] `useShrinkOnScroll` doesn't fire more than once per animation frame
- [ ] Floating back button over a photo hero remains legible on light AND dark photo backgrounds (white 96% + shadow does both)
- [ ] StickyBottomBar bottom-padding clears the home indicator on notched iOS
- [ ] Android gesture navigation bar doesn't overlap the tab pill
- [ ] Tab switching preserves each stack's scroll position and navigation state (React Navigation default behavior)

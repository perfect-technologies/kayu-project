# D08 — The Kayou Moment + empty/loading/error states

## Goal

Ship the booking-confirmation celebration animation (the Kayou Moment) and all the small-but-essential surfaces that bring the product to life between the main screens: empty states, loading (shimmer) states, and error states.

## Why it matters

The Kayou Moment is the one beat of pure delight in the product — two avatars connected by a traveling coral dot, the visual metaphor of *trust travels light*. It's the emotional payoff that makes a first-time user feel the product *works*. Empty/loading/error states are the less glamorous half — but without them every list, form, and fetch feels unfinished.

## Scope

### In scope
- `<KayouMoment/>` — the celebration screen for booking confirmation (web + mobile)
- **Empty states** — reusable `<EmptyState/>` for: no bookings, no favorites, no messages, no search results, no reviews yet
- **Loading states** — page-level shimmer patterns for homepage, search results list, provider profile, dashboard
- **Error states** — reusable `<ErrorState/>` for: network failure, 404 provider, permission denied, form submission fail
- **Toast notifications** — small success/info/error toasts for non-blocking feedback
- "First booking" detection — the Moment arc animation only fires on the user's first confirmed booking; subsequent bookings get the static success without the arc (this is a product rule to avoid gimmick-fatigue)

### Out of scope
- Full commissioned illustration set (placeholder line-SVGs for empty states; commission later)
- Animated onboarding flow (separate design pass)
- In-app notifications list (feature-layer, uses D03 cards)

## Reference files
- `prototype/components/BookingFlow.jsx` — **`KayouMoment`** function near the bottom. Has the full animation: success circle pop + pulse, headline rise, the SVG arc with traveling coral dot, summary card, action buttons. Inline CSS keyframes are defined at the top of the component — preserve those exact timing curves.
- DESIGN_SYSTEM §9.5 (Kayou Moment), §8.8 empty-state pattern (referenced from the design system)

## The Kayou Moment

### Layout
- Full screen, Sand bg, center-aligned content, padding 40 20
- Flex column, center justify
- Text alignment: centered (exception to §8 "no centered long-form text" rule — these are short headlines)

### Phases (orchestrated with `useEffect` timers)
- `phase = 0` at mount (initial)
- `phase = 1` at +300ms (start arc animation)
- `phase = 2` at +2300ms (provider avatar pulse when the coral dot arrives)

### Elements from top to bottom

**1. Success circle** (mounts at phase 0):
- Outer: 96×96 Emerald-subtle bg, circle. Pop-in animation (500ms `cubic-bezier(0.34, 1.56, 0.64, 1)`, scale 0.6 → 1.15 → 1, opacity 0 → 1)
- Inner: 72×72 Emerald-500 bg, white check icon (`stroke 2.5`, 36px). After pop, continuous `kmPulse` animation at 2400ms standard (scale 1 → 1.08 → 1)
- 24 bottom margin

**2. Headline** — Display-L (36px on web, 28px on mobile), "C'est noté !", rise+fade in at 500ms delay 200ms. 10 bottom margin.

**3. Subheadline** — Body-L Slate-700, `{provider.firstName} te recontacte sous ~{provider.response}`. Rise+fade at 500ms delay 320ms. 28 bottom margin. Provider name in bold; response time in mono bold.

**4. The arc** (shows only on first booking — see §First-booking detection below):
- Container 320×120, rise+fade at 600ms delay 440ms
- SVG with path: `M 40 90 Q 160 10 280 90` (quadratic curve — starts at client avatar, apex above midline, ends at provider avatar)
- Path stroke: Coral-500 (`#FB7185`), 2px, rounded linecaps, stroke-dasharray 400, stroke-dashoffset 400, animates `kmPath` at 2000ms emphasized to dashoffset 0 → opacity 0 (appears and fades behind the dot)
- Traveling dot: 6px circle, Coral-500 fill, coral glow via drop-shadow, follows the path via `offset-path` CSS. `kmDot` animation 2000ms emphasized (offset-distance 0% → 100%, opacity fade in then out)
- Avatars at endpoints:
  - Client avatar (left, x=40, y=90 minus half-size): 56px Avatar with initials+bg, label "Toi" Caption 600 below
  - Provider avatar (right, x=280, y=90 minus half-size): 56px Avatar, online dot true, label "{firstName}" Caption 600 below. When phase 2 kicks in, animate `kmPulse` 900ms bounce (one-shot)

**5. Summary card** — Paper radius.md border 1px Slate-200 padding 16, width min(420px, 100%), 36 top-margin. Rise+fade 600ms delay 600ms:
- 2-col grid, left-aligned:
  - Col 1: Caption "Référence" + Price 14px `#KY-4829-AM`
  - Col 2: Caption "Date" + Body-M 600 `Mer. 18 avril · 10:00`

**6. Action buttons** — flex row gap 10, width min(420px, 100%), 24 top-margin. Rise+fade 600ms delay 720ms:
- Secondary "[MessageCircle] Message" — flex 1
- Primary "Voir ma réservation" — flex 1.2

### CSS keyframes (inline `<style>` block in the component)

```css
@keyframes kmDot {
  0% { offset-distance: 0%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { offset-distance: 100%; opacity: 0; }
}
@keyframes kmPath {
  0% { stroke-dashoffset: 400; opacity: 0.8; }
  100% { stroke-dashoffset: 0; opacity: 0; }
}
@keyframes kmPulse {
  0%,100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
@keyframes kmPop {
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes kmRise {
  0% { transform: translateY(12px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
```

### Mobile (React Native) adaptation

React Native doesn't support `offset-path` or CSS keyframes directly. Options:
- Use `react-native-reanimated` for the dot position along the arc — compute x/y from `t ∈ [0,1]` using the quadratic bezier formula
- Arc path drawn with `react-native-svg`
- Success circle pop uses `Animated.spring` with overshoot config
- Rise+fade uses `Animated.parallel([opacity, translateY])` with staggered delays

Keep the visual output identical; swap the animation driver.

### First-booking detection

The arc animation (`phase >= 1`) only runs on the user's **first** confirmed booking. Subsequent bookings show everything else (success circle, headline, summary, buttons) but skip the arc entirely.

- Web: store a `kayou:firstBookingShown` flag in `localStorage`
- Mobile: same flag in `expo-secure-store`
- Set the flag after the animation completes the first time

If the flag is already set at mount time, render the Moment without the arc — just success + text + summary + buttons.

### Reduced motion

If `prefers-reduced-motion: reduce` (or the RN equivalent via `AccessibilityInfo.isReduceMotionEnabled()`):
- Skip all animations
- Render static end-states: success circle at scale 1 (no pop, no pulse), texts at final position (no rise), no arc at all (just avatars at their end positions with the provider already "pulsed"), summary and buttons fully visible
- Do not auto-advance phases

## Empty states

### `<EmptyState/>` primitive

Props: `illustration` (SVG component or icon fallback), `title` (string), `subtitle` (string), `cta?` ({ label, onPress }).

Layout:
- Center column, flex 1, padding 40 20
- Illustration: 96×96 area. For MVP, use a large Lucide icon at 96px with 1.5 stroke in a muted tone. Later: replace with commissioned line-art.
- Title: Display-M (24px), centered, 16 top-margin from illustration
- Subtitle: Body Slate-500, centered, max-width 380, 10 top-margin
- CTA (if provided): primary button, 24 top-margin

### Required empty states
- `NoBookingsEmpty` — icon: Calendar. "Pas encore de réservations." Subtitle: "Trouve un pro et réserve un service en quelques clics." CTA: "Trouver un pro" → nav to Home/Search.
- `NoFavoritesEmpty` — icon: Heart. "Aucun favori pour l'instant." CTA: "Explorer".
- `NoMessagesEmpty` — icon: Inbox. "Aucun message." Subtitle: "Tes échanges avec les pros apparaîtront ici."
- `NoSearchResultsEmpty` — icon: Search. "Aucun pro trouvé." Subtitle: "Ajuste tes filtres ou élargis ta zone de recherche." CTA: "Effacer les filtres".
- `NoReviewsYetEmpty` — icon: Star (outline). "Pas encore d'avis." Subtitle: "Sois le premier à évaluer ce pro." CTA: "Laisser un avis".

## Loading states

Never render a spinner on a content area (DESIGN_SYSTEM §16 forbids it). Always use shimmer matching the layout of the real content.

### Pre-built skeleton compositions
- `HomeScreenSkeleton` — shrinking header placeholder + category strip (empty shimmer circles + labels) + 3× FeaturedProviderCardSkeleton (D03) in a horizontal row + NearbyCard with 4 NearbyRowSkeleton rows
- `SearchResultsSkeleton` — 4–6× WideProviderCardSkeleton stacked with 16px gap
- `ProviderProfileSkeleton` — photo-hero shimmer (full-bleed, aspect 5:4) + identity block shimmer + stat row shimmer + 3 section shimmers
- `DashboardSkeleton` — deferred to dashboard design pass

### Shimmer primitive
From D02. Use for everything. Avoid Lottie, avoid spinners.

### Loading on buttons
The Button primitive's `loading` prop (D02) keeps width stable and swaps label for a 16×6 shimmer bar — never use a spinner inside a button.

## Error states

### `<ErrorState/>` primitive

Same shape as EmptyState but with a Rose accent:
- Illustration: `AlertCircle` icon in a Rose-subtle circle background
- Title: Display-M
- Subtitle: Body Slate-700 (slightly darker than empty state to convey urgency)
- CTA: usually "Réessayer" that triggers a retry

### Required error states
- `NetworkErrorState` — "Connexion perdue." Subtitle: "Vérifie ton internet et réessaie." CTA: "Réessayer".
- `NotFoundState` — "Introuvable." Subtitle: "Cette page ou ce pro n'existe plus." CTA: "Retour à l'accueil".
- `GenericErrorState` — "Une erreur est survenue." Subtitle: "On travaille dessus. Réessaie dans un instant." CTA: "Réessayer".
- `PermissionDeniedState` — "Accès restreint." Subtitle: "Tu n'as pas les droits pour voir cette page."

### Form-level errors
When a form submission fails, don't navigate away. Show an inline banner at the top of the form:
- Rose-subtle bg, 1px Rose-200 border-left (2px thick), radius.md, padding 12 14
- `AlertCircle` leading icon + Body-M message
- Optional "Réessayer" inline button on the right

## Toast notifications

For non-blocking success/info/error events (favorite added, message sent, profile saved).

- Absolute positioned: top 24 on web, top safe-inset + 24 on mobile
- Centered horizontally, max-width 360
- Paper bg, `radius.md`, `elev.e3`, padding 12 16
- Left: leading icon at 18px, color depends on variant (Emerald for success, Sky for info, Rose for error)
- Right: Body-M message, flex 1
- Optional dismiss X
- Auto-dismiss at 4000ms with fade-out (200ms)
- Only one toast visible at a time; new toast replaces the previous

On mobile, respect safe-area top inset. On web, offset below any sticky header.

## Dependencies
- Depends on D02 (primitives: Icon, Button, Shimmer)
- Depends on D07 (booking flow calls into Kayou Moment after step 3 confirmation)
- Blocks D09 (QA audit needs every state reachable)

## Acceptance criteria
1. KayouMoment renders the full animation sequence on first booking (success circle pop → pulse → headlines rise → arc + dot → provider avatar pulse → summary + buttons rise)
2. Subsequent bookings skip the arc animation but show everything else
3. `prefers-reduced-motion` collapses the animation to a static end state (no animations at all)
4. All 5 empty states are implemented and reachable (via seeded empty data or `?empty` param in dev)
5. All 4 error states are implemented
6. Every list in the app has a matching skeleton composition that renders while data loads
7. Toast notifications render above safe areas and auto-dismiss at 4s
8. No spinner renders on any content area or inside any button

## QA checklist
- [ ] KayouMoment success circle pop + pulse triggers on mount (no layout shift before animation starts)
- [ ] Arc path is drawn before the dot starts traveling (strokeDashoffset → 0 first)
- [ ] Coral dot arrives at provider avatar and then the provider avatar pulses once
- [ ] Summary card and buttons rise into view staggered (600ms, 720ms delays)
- [ ] First-booking flag persists across app restarts (localStorage / SecureStore)
- [ ] Reduced-motion users see the end state immediately (no ramp)
- [ ] Empty states render centered with sufficient whitespace (not cramped)
- [ ] Empty state CTAs navigate correctly (e.g., NoBookingsEmpty → Home)
- [ ] Error state retry CTA re-triggers the failed fetch
- [ ] Skeleton compositions match real content dimensions ±2px (no layout shift on load)
- [ ] Toast dismisses at 4s; tapping dismiss removes immediately
- [ ] Toast respects iOS safe-area top inset
- [ ] Mobile: first-booking flag in SecureStore persists after uninstall-reinstall? (answer: no — that's fine; we want the delightful Moment if a user reinstalls)

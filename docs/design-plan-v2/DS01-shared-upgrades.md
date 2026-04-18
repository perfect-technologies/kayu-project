# DS01 — Shared upgrades: icons, tab bar, routing

## Goal

Land the cross-cutting changes that v2 makes to `@kayu/ui` and the mobile shell, so every subsequent chunk can assume: (a) new icons exist, (b) the mobile tab bar routes correctly, (c) the post-booking flow chains into `WriteReview`, (d) the hide-tab-bar list covers all modal-like flows, (e) `KayouMoment` has the v2 polish.

## Why it matters

Every v2 chunk touches at least one of these. Doing them first means DS02–DS11 can stop reimplementing shell/icons and focus on their screen's content.

## Scope

### In scope
- **Icons:** ~30 new Lucide-style icons added to `@kayu/ui/Icon.tsx` (web) and the mobile icon record
- **Mobile tab bar:** targets + role-aware tab set + expanded hide-tab-bar list
- **Booking → Review routing:** confirming the booking advances to `WriteReview` (not home)
- **KayouMoment polish:** emerald shadow on success circle, 14px button radius, borderless summary card with soft shadow, letter-spacing tightened on headline
- **Role-aware mobile tabs:** based on `/me.role`, mobile navigator renders the client tab set or the pro tab set

### Out of scope
- Any screen-specific styling (that's in the individual chunks)
- Backend changes (`/me` already returns `role`; if not, flag to backend, don't fix here)
- Admin navigation (admin is desktop-only, no mobile tab set)

## Reference files
- `prototype/components/shared.jsx` — **diff** the v2 file against `../design-plan/prototype/components/shared.jsx` to see the 30+ new icons. They're appended in one block.
- `prototype/components/MobileShell.jsx` — v2 tab bar with new targets
- `prototype/KAYOU Prototype.html` — `App()` function:
  - Line ~251: `onDone={() => nav("review", param)}` — the booking→review hook
  - Line ~273: `!["booking", "profile", "review", "onboarding", "auth", "quote"].includes(screen) && <MobileTabBar .../>` — the expanded hide list
- `prototype/components/BookingFlow.jsx` — KayouMoment polish deltas (emerald shadow, letter-spacing, borderless summary)

## Icon additions

Full list (all lucide-react line icons, stroke 1.75 by default):

```
trash, pencil, fileText, percent, copy, info, alertTriangle, eye,
camera, upload, flag, bell, settings, globe, lock, logout,
chevronLeft, refresh, wifi, wifiOff, creditCard, trendingUp, trendingDown,
users, moreVertical, fileCheck, xCircle, checkCircle, server, rotate,
selfie, idCard
```

Details:
- `selfie` and `idCard` are **custom** compositions (not stock lucide icons). Copy the SVG paths from the prototype's `shared.jsx` verbatim.
- `chevronLeft` is already in web's Icon record via the `chevronRight` twin — add for completeness.
- `xCircle` / `checkCircle` are used by ProVerification status states.
- All icons tree-shake in the web bundle; no runtime cost.

### Implementation

- **Web (`packages/ui/src/web/Icon.tsx` or wherever icons live):** import from `lucide-react` and re-export. For `selfie` and `idCard`, build them with `<svg>` components matching the prototype paths.
- **Mobile (`packages/ui/src/mobile/Icon.tsx`):** same, but using `lucide-react-native`.

Verify each icon renders at 16 / 20 / 24 in the DesignProbeScreen.

## Mobile tab bar reshuffle

### v1 (current, broken)

```
Accueil      → home
Rechercher   → search
Réservations → home    ← lie
Messages     → home    ← lie
Moi          → home    ← lie
```

### v2 — client tab set

```
Accueil      → home
Rechercher   → search
Réservations → bookings
Messages     → messages
Moi          → profile (existing ProfileScreen)
```

### v2 — pro tab set (new)

```
Dashboard    → provider
Demandes     → requests
Messages     → messages
Gains        → earnings
Moi          → profile (same ProfileScreen, role-aware content later)
```

### Role-aware selection

In `apps/mobile/src/navigation/AppNavigator.tsx` (or equivalent):

```ts
const role = useAuth().user?.role ?? "CLIENT"
const tabs = role === "PROVIDER" ? PRO_TABS : CLIENT_TABS
```

Admin never gets a mobile tab bar — an ADMIN role falling through to mobile bounces to a "use desktop" screen or the CLIENT set (they can still browse as a user). DS10 decides; for DS01 just use `CLIENT_TABS` as the fallback and tag a TODO.

### Hide-tab-bar list

Update the navigator config so the tab bar is hidden on:
```
booking, profile, review, onboarding, auth, quote
```

v1 had `booking` + `profile` only. Everything else was keeping the tab bar behind a sticky sheet — wrong.

## Booking → Review routing

The chain:
1. User confirms booking on the Booking flow → triggers `KayouMoment`
2. KayouMoment buttons: "Message" (left, ghost) and "Voir ma réservation" (right, primary)
3. **New:** After a short auto-delay OR on tap of "Voir ma réservation", navigate to WriteReview for this booking's providerId

In the prototype (`KAYOU Prototype.html` line 251):
```jsx
if (screen === "booking") return <BookingFlow ... onDone={() => nav("review", param)} />
```

Implementation:
- **Web:** `apps/web/src/app/book/[providerId]/page.tsx` confirms → `router.replace(\`/review/${providerId}\`)` (use `replace` so back doesn't go back to the booking form). Initial landing on `/review/[id]` is allowed when `?fromBooking=1` to show the review prompt.
- **Mobile:** the booking stack's confirm handler does `navigation.replace("WriteReview", { providerId })`. Again replace, not push.

An important nuance: when `review` is launched **from MyBookings → BookingDetail** on a completed booking, it's a normal `navigation.push` — we want back to return to the detail page.

## KayouMoment polish

Diff these against the v1 component in `@kayu/ui/{web,mobile}/KayouMoment.tsx`:

```diff
- <div className="success-circle" style={{ boxShadow: "0 0 0 8px var(--k-success-subtle)" }}>
+ <div className="success-circle" style={{ boxShadow: "0 12px 36px -12px rgba(16,185,129,0.45)" }}>

- <h1 className="k-display-l" style={{ margin: "0 0 10px", fontSize: mobile ? 28 : 36 }}>
+ <h1 className="k-display-l" style={{ margin: "0 0 10px", fontSize: mobile ? 28 : 36, letterSpacing: "-0.02em" }}>

- <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-md)", padding: 16, ... }}>
+ <div style={{ background: "white", borderRadius: 18, padding: "16px 18px",
+   boxShadow: "0 10px 28px -12px rgba(15,23,42,0.14), 0 2px 6px -2px rgba(15,23,42,0.05)", ... }}>

- <button className="k-btn k-btn-secondary" style={{ flex: 1 }} onClick={onDone}>
+ <button onClick={onDone} style={{ flex: 1, height: 48, borderRadius: 14, border: 0, cursor: "pointer",
+   background: "white", color: "var(--k-text-primary)",
+   boxShadow: "0 4px 14px -6px rgba(15,23,42,0.12), 0 1px 3px -1px rgba(15,23,42,0.05)", ... }}>

- <button className="k-btn k-btn-primary" style={{ flex: 1.2 }}>
+ <button className="k-btn k-btn-primary" style={{ flex: 1.2, height: 48, borderRadius: 14, fontSize: 14 }}>
```

Essentially: bordered → shadowed summary card, default shadow → colored success glow, consistent 48px / 14px-radius buttons with tabbed spacing.

## Dependencies
- Depends on: nothing beyond v1 shipped (DS01 is the foundation)
- Blocks: DS02–DS11

## Acceptance criteria

1. All 30+ new icons render correctly at 16/20/24 in the DesignProbeScreen on both platforms
2. Mobile tab bar correctly targets `home / search / bookings / messages / profile` for a CLIENT user
3. Mobile tab bar correctly targets `provider / requests / messages / earnings / profile` for a PROVIDER user
4. Mobile tab bar is hidden on `booking, profile, review, onboarding, auth, quote` screens
5. Confirming a booking advances to `/review/[providerId]` on web and `WriteReview` screen on mobile, with the booking removed from the back stack
6. KayouMoment renders with the polish diffs applied (emerald glow, borderless shadowed summary, 14px-radius 48px buttons)
7. `@kayu/ui` re-published and consumers rebuild cleanly

## QA checklist
- [ ] Lucide-react tree-shake verified in `next build` — no more than +2kB gzip from icon additions
- [ ] `selfie` and `idCard` custom SVGs render identically on web + mobile at 20px
- [ ] `navigation.replace` (not push) is used for booking → review
- [ ] Back button from WriteReview returns to MyBookings/BookingDetail context, not to the booking form
- [ ] Role-aware tab sets switch without remounting the whole navigator (just tab labels)
- [ ] Admin role on mobile falls through to CLIENT tabs (or a "use desktop" prompt — document choice in PROGRESS decisions)
- [ ] KayouMoment under `prefers-reduced-motion` still honors the v1 rule (skip arc), and the v2 polish doesn't break that

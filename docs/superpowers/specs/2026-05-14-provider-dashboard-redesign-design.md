# Provider dashboard redesign — design

**Date:** 2026-05-14
**Scope:** `apps/web/src/app/pro/page.tsx`, `apps/web/src/app/pro/ProviderDashboardClient.tsx`, new components in `apps/web/src/components/dashboard/provider/`, additive changes to `apps/backend/src/modules/dashboard/dashboard.service.ts` + DTOs in `packages/schemas`. No mobile (Expo) work.
**Status:** Pending implementation plan.

## Goal

Rebuild `/pro` as a **mission-control surface** that answers two questions at a glance:

1. **What's the most important thing I should do right now?** — state-led hero card.
2. **What else is on my plate?** — a tight to-do strip + today/upcoming missions + recent reviews + a compact business pulse.

Today's `/pro` page is generic SaaS chrome: an avatar header, an availability bar, a 4-stat grid, two parallel lists (pending bookings + today's planning), and a feature-flagged "Nouvelles demandes" column. The stats dominate, the availability bar costs a full row, and nothing tells the provider *which* single thing to act on. It also predates the current design direction (flat surfaces, hairline borders, state-led heroes) used on the landing, provider details, booking flow, booking details, and client dashboard pages.

The redesign:

- Replaces the avatar header + stat grid + availability bar with a **state-aware hero** modeled on the client dashboard hero. Picks the most urgent state automatically across 8 variants.
- Replaces the "Nouvelles demandes" column with **nothing** — the job-match feature (`launchFlags.enableJobRequests`) is being killed for v1.
- Folds availability into a tappable chip inside the greeting (no more full-width bar).
- Adds a focused **À FAIRE** strip carrying real provider to-dos: extra pending bookings beyond the hero, unread message threads, bookings that need to be closed out, and profile-polish nudges.
- Splits today + upcoming missions into a **date-led grid**: `Aujourd'hui` on the left (heavier), `À venir` on the right.
- Adds **Avis récents** — read-only rows for the 3 most recent reviews.
- Adds **Pouls de la semaine** — a compact 4-cell business strip at the bottom (revenue, missions, response rate, rating) replacing the dominant stats grid. Entry point to `/pro/earnings`.
- Designs **mobile-first** with a single-column layout, and a 2-column `Aujourd'hui / À venir` grid at desktop. Uses the same flat-surface / hairline-border / display-font vocabulary as the rest of the new pages.

## Non-goals

- No mobile (Expo) implementation. Web only.
- No changes to the client dashboard (`/dashboard/client`), admin dashboard, or shared `DashboardStats`/`StatCard`/`JobCard`/`RequestCard` components used elsewhere.
- No new job-matching surface on the dashboard. `launchFlags.enableJobRequests` stays off; the `newRequests` payload stays unused by this page. The `/pro/requests` and `/pro/devis` routes still exist; we don't touch them.
- No changes to the marketing landing (`/`). Providers reach the dashboard via the sidebar entry / `/pro` link.
- No changes to booking-state semantics, payment flow, commission rules, or onboarding-step transitions.
- No new auth flows.
- No realtime updates (websockets / supabase channels). Polls via react-query refetches like the rest of the app.
- No "reply to review" feature (it doesn't exist in the codebase today).
- No one-tap "Mark complete" in the hero — the in-progress hero CTA routes to `/bookings/{id}` where the existing completion flow lives. Completion is a payment-bearing action and deserves the detail context.

## Required reading

1. `docs/design-direction/index.html` — flat surfaces, hairline borders, Lucide icons, restrained color, no gradients, plain text for secondary metadata.
2. `packages/ui/src/tokens.ts` — canonical tokens.
3. `docs/superpowers/specs/2026-05-14-client-dashboard-redesign-design.md` — establishes the state-aware hero pattern, the À FAIRE strip vocabulary, and the responsive grid this spec inherits.
4. `docs/superpowers/specs/2026-05-14-booking-details-redesign-design.md` — the StatusChip vocabulary and the booking-detail accept/refuse flow the pending hero CTAs route into.

## Global design rules (inherited)

1. No gradient backgrounds. Flat surfaces only.
2. Lucide icons via `@kayu/ui/web`'s `I`. Emoji in the mockups are stand-ins — production uses Lucide icons.
3. Plain text for secondary metadata, chips only for status and trust.
4. Restrained color — status is the only place color carries meaning. Everything else uses neutrals (`--k-text-primary`, `--k-text-body`, `--k-text-muted`, `--k-border`, `--k-border-subtle`).
5. Tokens are the source of truth.
6. Display font (Bricolage Grotesque) for big numbers/dates/headings; body font for everything else; mono (`--k-font-mono`) for labels, refs, and date "MAI/AVR" abbreviations.

---

## §1. Page composition

```
<div className="k-pd-page">                            {/* max-width 1080 px, centred, padded */}

  <Greeting user={user} provider={provider} availability={availability} />   {/* §2 */}

  <DashboardHero data={...} />                          {/* state-aware, §3 */}

  {todos.length > 0 && <TodoStrip items={todos} />}     {/* §4, hides when empty */}

  <DashboardGrid>                                       {/* 1fr on mobile, 1.4fr/1fr on desktop */}
    <TodayList items={todayJobs} estimatedRecette={...} />  {/* §5.1 */}
    <UpcomingList items={upcoming} />                       {/* §5.2 */}
  </DashboardGrid>

  {recentReviews.length > 0 && <ReviewsList items={recentReviews} />}   {/* §6 */}

  <PulseStrip stats={stats} />                          {/* §7 */}

</div>
```

- **Breakpoint:** `md` = 768 px. Below: single column. At/above: `Aujourd'hui` / `À venir` becomes `1.4fr / 1fr`.
- **Outer width:** `max-width: 1080px`, `margin: 0 auto`, padding `12px 16px 32px` on mobile, `20px 24px 40px` on desktop.
- **Background:** the app background (`var(--k-surface-muted)`, already in use). All cards sit on `var(--k-surface)` with `1px solid var(--k-border)` hairlines.
- **Vertical rhythm:** 14 px gap between sections on mobile, 18 px on desktop.

The page is **`'use client'`**, hosts the existing `useQuery(queryKeys.dashboard.provider, ...)`, and renders skeletons in `isLoading` (see §9). The skeleton mirrors the section structure 1:1.

Hero-variant selection runs as a pure function on the loaded `data` payload (see §3.1) so the same dataset can be hot-reloaded as the user transitions states (e.g. accepts a pending → no more pending → next-today wins).

---

## §2. Greeting

A small block above the hero. Plain text greeting + secondary trust line + tappable availability chip.

```
<header className="k-pd-greet">
  <div className="k-pd-greet-main">
    <h1>Bonjour {firstName}</h1>
    <p className="k-pd-greet-meta">
      ★ {rating.toFixed(1)} · {totalJobs} missions · <TrustChip trust={trust} />
    </p>
  </div>
  <AvailabilityChip isAvailable={isAvailable} zoneCity={zoneCity} zoneRadiusKm={zoneRadius} />
</header>
```

- `h1`: display font, 22 px (mobile) / 26 px (desktop), 700 weight, letter-spacing -.015em. No time-of-day variation ("Bonjour" always, like the client side).
- `firstName` comes from `useAuth().user.firstName ?? "Pro"` (existing fallback).
- `meta` line: 12 px / `var(--k-text-muted)`. `★` is mono-tinted gold `#F59E0B`, the rating itself is body-weight 600 in `var(--k-text-primary)`. Total missions is body 12 / 400 / muted. Trust chip is the existing `TrustChip` atom (NEWCOMER / ESTABLISHED / TRUSTED / EXPERT).
- The big avatar from today's design **goes away** — visual noise on a working surface, matches client-dashboard precedent.
- **AvailabilityChip** atom — see §2.1. On desktop / wide mobile the chip sits to the right of the meta block (`margin-left: auto`). At `< 480 px` it drops to its own row below the meta line.

### §2.1 AvailabilityChip atom

```
<button className="k-pd-avail-chip" data-on={isAvailable} aria-pressed={isAvailable}>
  <Dot />
  <span>{label}</span>
</button>
```

- Available: `background: var(--k-success-subtle)`, `color: #047857`, border `1px solid #A7F3D0`. Leading 6 px dot in `var(--k-success)` with a soft 4-px outer halo (`box-shadow: 0 0 0 4px rgba(16,185,129,0.18)`).
- Unavailable: `background: #F1F5F9`, `color: var(--k-text-body)`, border `1px solid var(--k-border)`. Leading 6 px dot in `var(--k-border-strong)`.
- Label format: available = `"Disponible · {zoneCity}, {radius} km"`. Unavailable = `"Indisponible"`.
- Clicking the chip opens a small bottom-sheet on mobile / popover on desktop:
  - Toggle row (switch + label "Disponible" / "Indisponible").
  - Two read-only rows showing current `zoneCity` and `zoneRadiusKm` with "Modifier →" routing to `/pro/onboarding` (the zone-edit step) or future `/pro/availability` settings.
- The toggle mutation is the existing `providersApi.updateAvailability` mutation already wired in today's page. Optimistic update is kept.

### §2.2 Skeleton

While loading, the chip renders as a 28 px tall × 140 px wide rounded skeleton. The h1 + meta line render as two stacked skeletons (22 × 200 px, 12 × 240 px).

---

## §3. DashboardHero

State-aware hero. Picks one of **8 variants** based on the data; all share the same outer card shell so the page rhythm is steady.

### §3.1 Selection priority

```ts
type HeroVariant =
  | "onboarding"
  | "pending_request"
  | "in_progress"
  | "next_today"
  | "next_upcoming"
  | "unavailable"
  | "calm"
  | "empty";

function pickVariant(d: ProviderDashboardData): HeroVariant {
  if (!d.onboarding.isComplete) return "onboarding";

  const pending = d.bookingRequests; // already PENDING-only
  if (pending.length > 0) return "pending_request";

  const inProgress = d.upcomingBookings?.find((b) => b.status === "IN_PROGRESS");
  if (inProgress) return "in_progress";

  const now = Date.now();
  const todayEnd = endOfToday();
  const upcoming = (d.upcomingBookings ?? [])
    .filter((b) => b.status === "CONFIRMED")
    .sort(byScheduledDateAsc);
  const soonest = upcoming[0];
  if (soonest) {
    const ts = new Date(soonest.scheduledDate).getTime();
    if (ts > now && ts <= todayEnd.getTime()) return "next_today";
    return "next_upcoming";
  }

  if (!d.availability.isAvailable) return "unavailable";

  if (d.hasAnyBookingEver) return "calm";
  return "empty";
}
```

The hero "owns" the booking it leads with — that booking is then **excluded from `Aujourd'hui` and `À venir` (§5)** to avoid duplication.

### §3.2 Shared shell

- Background: `var(--k-surface)`. White.
- Border: `1px solid var(--k-border)`. No accent bars.
- Radius: `var(--k-r-lg)` (14 px).
- Padding: 16 px mobile, 22 px desktop.
- Shadow: none.
- Margin-bottom: 14 px (mobile) / 18 px (desktop).
- Header chip row, big headline (display font), body line, optional detail row (avatar + client name), CTA row.

### §3.3 Variant: `onboarding`

Wins when `onboarding.isComplete === false`.

```
<section className="k-pd-hero k-pd-hero--onboarding">
  <StatusChip variant="welcome" label={"PROFIL INCOMPLET · ÉTAPE " + currentStep + "/" + totalSteps} />
  <Headline>Termine ton inscription.</Headline>
  <Sub>Tu n'apparaîtras dans les recherches qu'une fois ton profil publié.</Sub>
  <Progress percent={onboardingPct} />
  <Primary>Continuer l'inscription →</Primary>
</section>
```

- Chip: amber `#FDE68A` bg / `#92400E` text, no dot.
- `Headline`: 22 px mobile / 26 px desktop, 700, display font.
- `Sub`: 12.5 px, `var(--k-text-body)`.
- `Progress`: 6 px tall pill, `#FEF3C7` track, `#F59E0B` fill. Width = `(currentStep / totalSteps) * 100 %`.
- `Primary`: dark `var(--k-text-primary)` background pill, white text, full-width on mobile. Routes to `/pro/onboarding`.
- No "Ignorer" — onboarding is mandatory before going live.

### §3.4 Variant: `pending_request`

Wins when ≥ 1 PENDING booking is in `bookingRequests`. The hero shows the **soonest by `scheduledDate`** (tie-break by `createdAt desc`).

```
<section className="k-pd-hero k-pd-hero--pending">
  <Ribbon>
    <StatusChip variant="pending" label={"À CONFIRMER · " + relativeRequested} />
  </Ribbon>
  <Headline>{whenLabel}</Headline>
  <Sub>{kind} · {durationLabel} · {commune} · {priceLabel}</Sub>
  <ClientRow>
    <Avatar />
    <div>
      <Name>{clientName} · {clientHistoryLabel}</Name>
      {firstMessage && <Snippet>« {firstMessage} »</Snippet>}
    </div>
  </ClientRow>
  <Actions>
    <Secondary>Message</Secondary>
    <Ghost onClick={openRefuseSheet}>Refuser</Ghost>
    <Primary onClick={onAccept}>Accepter ✓</Primary>
  </Actions>
</section>
```

- **StatusChip** "pending" — `background: var(--k-warning-subtle)`, `color: #92400E`, leading amber 6 px dot. Suffix `relativeRequested` uses `formatRelativeTime(booking.createdAt)` (already exists in `ProviderDashboardClient`).
- **whenLabel** uses `formatWhen` from `lib/booking-v2.ts`:
  - Today: `"Aujourd'hui · {time}"`.
  - Tomorrow: `"Demain, {jourLong} {date} · {time}"`.
  - Beyond: `"{jourLong} {date} · {time}"` (e.g. `"Samedi 17 mai · 14:00"`).
- **Sub** combines `booking.title`, duration (`"~ 2 h"`, falls back to `"Durée à confirmer"` if `durationMinutes` is null), `booking.city ?? booking.address`, and `formatMoneyFc(booking.price)` (fallback `"Prix à convenir"`).
- **ClientRow**: 38 px avatar (palette via existing `colorFor(clientId || name)`), name in body 13 / 600, `clientHistoryLabel` = `"première fois"` if `bookingCount === 0`, else `"cliente régulière · {n} missions ensemble"`. Snippet uses the booking's `description` / first message (capped ~ 80 chars); hidden if absent.
- **Actions** layout: `Message` on the left, `Refuser` and `Accepter` on the right (`margin-left: auto`). On mobile: `Message` drops above the action row when space is tight; `Refuser` and `Accepter` always share the bottom row at 1 / 1.4 flex.
- **Accept**: calls the existing `bookingsApi.update(id, { status: "CONFIRMED" })` mutation with optimistic update on `queryKeys.dashboard.provider`. On success, the dashboard refetches and the hero re-picks (likely transitions to `next_today` or `next_upcoming`).
- **Refuse**: opens a bottom-sheet / popover with three radio rows + confirm button:
  - `Créneau indisponible` (default)
  - `Trop loin`
  - `Autre raison…` (reveals a 280-char textarea)
  
  Confirm calls `bookingsApi.update(id, { status: "CANCELLED", cancelReason })`. Same optimistic-update pattern.

### §3.5 Variant: `in_progress`

Wins when no PENDING but at least one `upcomingBookings` row has `status === "IN_PROGRESS"`. If multiple are in progress, picks the one with the highest `scheduledDate` that is `<= now` (the most recently started).

```
<section className="k-pd-hero k-pd-hero--live">
  <StatusChip variant="live" label="EN COURS · CHEZ LE CLIENT" />
  <Headline>Mission en cours</Headline>
  <Sub>{kind} · {clientName} · {address}</Sub>
  <ClientRow startedAt={scheduledDate} estDuration={durationLabel} priceLabel={priceLabel} />
  <Actions>
    <Secondary>Message</Secondary>
    <Primary>Terminer la mission →</Primary>
  </Actions>
</section>
```

- **StatusChip** "live" — `background: var(--k-success-subtle)`, `color: #047857`, pulsing 6 px green dot using the existing `kPulse` keyframes.
- **Headline** is intentionally short — providers in the field don't need a long phrase.
- **ClientRow** carries a small footer line: `"démarrée à {scheduledTime} · Estimée {duration} · {priceLabel}"`.
- **Primary** routes to `/bookings/{id}` where the existing completion flow lives.
- No hero-level "Mark complete" — too easy to mistap. Completion bears payment + review flow.

### §3.6 Variant: `next_today`

Wins when no PENDING, no IN_PROGRESS, and the soonest CONFIRMED booking is today and in the future.

```
<section className="k-pd-hero k-pd-hero--confirmed">
  <StatusChip variant="confirmed" label={"CONFIRMÉE · " + proximityLabel} />
  <Headline>{whenLabel}</Headline>
  <Sub>{kind} · {durationLabel} · {commune} · {priceLabel}</Sub>
  <ClientRow />
  <Actions>
    <Secondary>Message</Secondary>
    <Primary>Voir la mission →</Primary>
  </Actions>
</section>
```

- **proximityLabel**: `"DANS {n}H"` / `"DANS {n} MIN"` based on `scheduledDate - now`. Falls back to `"AUJOURD'HUI"` if > 6 h out.
- **whenLabel** = `"Aujourd'hui · {time}"`.
- **ClientRow** carries the client name, the `clientHistoryLabel` ("cliente régulière · {n} missions ensemble" / "première fois"), and rating-of-the-client when available.
- **Primary** routes to `/bookings/{id}`.

### §3.7 Variant: `next_upcoming`

Same composition as `next_today` but the soonest CONFIRMED booking is tomorrow or beyond.

- **proximityLabel**: `"DEMAIN"` / `"{JOURLONG}"` (within a week) / blank otherwise.
- **whenLabel** = `formatWhen` (e.g. `"Dimanche 18 mai · 10:00"`).

### §3.8 Variant: `unavailable`

Wins when no PENDING / IN_PROGRESS / upcoming CONFIRMED, and `availability.isAvailable === false`.

```
<section className="k-pd-hero k-pd-hero--unavailable">
  <StatusChip variant="neutral" label="INDISPONIBLE" />
  <Headline>Tu es invisible aux clients.</Headline>
  <Sub>Réactive ta disponibilité pour recevoir des demandes à {zoneCity} et autour.</Sub>
  <Primary onClick={() => toggleAvailability(true)}>Redevenir disponible</Primary>
</section>
```

- **StatusChip** "neutral" — `background: #F1F5F9`, `color: var(--k-text-body)`, no dot.
- **Primary**: green `var(--k-success)` background, white text, full-width on mobile. Calls the existing availability mutation directly. Optimistic update flips the page to `calm` (or `empty` if no history).

### §3.9 Variant: `calm`

Wins when published, available, has booking history, but no PENDING / IN_PROGRESS / upcoming.

```
<section className="k-pd-hero k-pd-hero--calm">
  <StatusChip variant="neutral" label="AUCUNE MISSION PRÉVUE" />
  <Headline>Journée libre.</Headline>
  <Sub>{n} missions cette semaine · {revenueWeek} FC. Partage ton profil pour des demandes supplémentaires.</Sub>
  <Actions>
    <Secondary>Voir mes revenus</Secondary>
    <Primary>Partager mon profil →</Primary>
  </Actions>
</section>
```

- **Sub** numbers come from the existing `stats.missions.value` (this period) and `stats.revenue.value`. Period reads "month" by default — the copy says "cette semaine" only if the period is weekly; otherwise "ce mois-ci". (See §7 on period.) Use whichever the existing stats period is; we don't introduce a new aggregation.
- **Secondary** routes to `/pro/earnings`.
- **Primary** opens the existing share sheet for the provider's public profile (`/providers/{id}` URL via the Web Share API; falls back to copy-to-clipboard).

### §3.10 Variant: `empty`

Wins when published, available, no PENDING / IN_PROGRESS / upcoming, **and** `hasAnyBookingEver === false`.

```
<section className="k-pd-hero k-pd-hero--empty">
  <StatusChip variant="welcome" label="BIENVENUE" />
  <Headline>Ton profil est en ligne.</Headline>
  <Sub>Tu apparais dans les recherches "{primaryCategoryName} · {zoneCity}". Ta première demande arrivera bientôt.</Sub>
  <TipList>
    <li>Réponds en moins de 2 h pour booster ta visibilité</li>
    <li>Ajoute des photos de tes réalisations</li>
  </TipList>
  <Primary>Partager mon profil</Primary>
</section>
```

- **StatusChip** "welcome" — same amber as onboarding.
- **TipList**: muted body 12 / `var(--k-text-body)`, bullet markers `•` rendered as `::before` (no list-style).
- **Primary** opens the same share sheet as `calm`.

In `empty`, **TodoStrip and UpcomingList** hide (no actionable to-dos beyond the welcome). `Aujourd'hui` and `Avis récents` also hide. `Pouls de la semaine` renders with all-zero values so the page never has a tail-less gap.

### §3.11 Mobile layout for all variants

- Hero headline uses the 22 px mobile pair.
- Sub line absorbs the price (we don't break out a separate `PriceBlock` like the client booking-details hero — providers care about the date/time more than the price; the price is in the sub).
- ClientRow stacks below the body.
- Actions become a flex row: secondary `flex: 1`, primary `flex: 1.4`. Three-action variants (pending) stack `Message` above the `Refuser / Accepter` pair when total horizontal width is < 360 px.

### §3.12 StatusChip tokens

| Variant | Background | Text | Dot |
|---|---|---|---|
| `live` (in_progress) | `var(--k-success-subtle)` | `#047857` | green `var(--k-success)`, pulse |
| `confirmed` (next_today / next_upcoming) | `var(--k-success-subtle)` | `#047857` | green, no pulse |
| `pending` (pending_request) | `var(--k-warning-subtle)` | `#92400E` | amber `var(--k-warning)`, no pulse |
| `neutral` (calm / unavailable) | `#F1F5F9` | `var(--k-text-body)` | none |
| `welcome` (onboarding / empty) | `#FDE68A` | `#92400E` | none |

These reuse the client-dashboard chip atom (`HeroStatusChip.tsx`) verbatim. No new variants.

---

## §4. TodoStrip — "À FAIRE"

A single card carrying genuine provider to-dos. Renders only when `todos.length > 0`.

```
<section className="k-pd-todo">
  <Head>
    <Label>À FAIRE</Label>
    <Count>{todos.length} {todos.length === 1 ? "tâche" : "tâches"}</Count>
  </Head>
  {todos.map(t => <TodoRow key={t.key} item={t} />)}
</section>
```

### §4.1 Card surface

- Same shell as the hero (white, `1px solid var(--k-border)`, `var(--k-r-lg)`).
- Padding: `0`. Head and rows manage their own padding.
- Head: 10 px 16 px 6 px, label in mono uppercase, count in body 10.5 px / 600 / `var(--k-text-muted)` with `#F1F5F9` pill (2 px × 8 px, `var(--k-r-pill)`).

### §4.2 To-do sources

Four kinds:

| Kind | When | Source |
|---|---|---|
| `extra_pending` | A PENDING booking that is **not** the one already in the hero. | `data.bookingRequests` minus the hero booking. |
| `unread_message` | Conversation has `unreadCount > 0` AND the last message's `senderId !== currentUser.id`. | New `dashboard.todos.unreadMessages` payload (§8). Same shape as client side. |
| `close_overdue` | A `CONFIRMED` booking whose `scheduledDate` is `< now - 2 h`. | New `dashboard.todos.bookingsToClose` payload (§8). |
| `profile_gap` | `provider.completionPercentage < 100` AND a specific completion item is false. | Derived client-side from existing `provider.completionItems`, capped at the top 2 gaps. |

Other notification types (status changes, payment confirmations, etc.) **do not** generate to-dos here. They surface in the booking-detail page or `/notifications`.

### §4.3 TodoRow

```
<a className="k-pd-todo-row" href={item.href}>
  <Icon><I.{iconName} /></Icon>
  <Body>
    <Title>{item.title}</Title>
    <Meta>{item.meta}</Meta>
  </Body>
  <CTA>{item.cta} →</CTA>
</a>
```

- Row: 11 px × 16 px padding, top divider `1px solid var(--k-border-subtle)` (first row omits).
- **Icon** container: 32 px × 32 px, 8 px radius. Per kind:
  - `extra_pending`: `background: #FEF3C7; color: #92400E;` icon `I.clock` (or `I.alertCircle`).
  - `close_overdue`: `background: #FEE2E2; color: #B91C1C;` icon `I.alertTriangle`.
  - `unread_message`: `background: #E0E7FF; color: #4338CA;` icon `I.messageCircle`.
  - `profile_gap`: `background: #F0FDF4; color: #15803D;` icon depends on the missing item (`I.camera` for photo, `I.image` for portfolio, etc.). Fallback `I.checkSquare`.
- **Title**: 13 px / 600 / `var(--k-text-primary)` / 1.3 line-height. Examples:
  - `extra_pending`: `"Réponds à {clientFirstName} · {kind} {dayShort}"`.
  - `close_overdue`: `"Clôture \"{kind} · {clientFirstName}\""`.
  - `unread_message`: `"{clientFirstName} t'a écrit"` (or `"{clientFirstName} t'a écrit · {n} messages"` if `n > 1`).
  - `profile_gap`: e.g. `"Ajoute une photo de profil"`, `"Ajoute un portfolio"`.
- **Meta**: 11 px / `var(--k-text-muted)` / 1 px margin-top. Per kind:
  - `extra_pending`: `"Demandé {relativeTime} · {priceLabel}"`.
  - `close_overdue`: `"Mission du {dayShort} non terminée · {priceLabel} en attente"`.
  - `unread_message`: `"« {messagePreview} »"` (capped ~ 60 chars).
  - `profile_gap`: short value prop, e.g. `"+18 % de clics sur les profils avec photo"`.
- **CTA**: 11.5 px / 600 / `var(--k-text-primary)` text on `#F1F5F9` pill (`var(--k-r-md)`, 6 px × 10 px padding). Aligned right with `margin-left: auto`. Copy per kind: `Répondre →` / `Clôturer →` / `Répondre →` / `Compléter →`.
- **Whole row is the link.** `href`:
  - `extra_pending` / `close_overdue`: `/bookings/{bookingId}`.
  - `unread_message`: `/messages?recipientId={clientId}&recipientName={encoded}` (matches today's `BookingRequestCard` message routing) or `/messages/{conversationId}` if that route exists.
  - `profile_gap`: `/pro/onboarding?step={stepKey}` (re-enters the wizard on the relevant step).

### §4.4 Ordering

Rows are sorted by urgency:

1. `close_overdue` (red icon) — money / review flow blocked.
2. `extra_pending` (amber icon) — clients waiting, time-sensitive.
3. `unread_message` (indigo icon) — communications.
4. `profile_gap` (green icon) — long-term polish.

Within each kind: by recency (`createdAt desc` for pending, `scheduledDate desc` for close_overdue, `lastMessageAt desc` for messages, fixed order for profile gaps).

Capped at **5 visible rows** total. If the merged list exceeds 5, the 5th row is replaced by a muted summary link: `"+{n} de plus →"` routing to `/bookings` (most likely destination for actionable rows).

### §4.5 Empty + single-item

- 0 to-dos: the section is omitted entirely. No "Aucune tâche" empty state.
- 1 to-do: same composition, count pill reads `"1 tâche"`.

---

## §5. DashboardGrid — Aujourd'hui + À venir

Two-section grid sitting beneath the TodoStrip. On desktop: `1.4fr / 1fr`, 14 px gap. On mobile: stacked, full-width.

### §5.1 TodayList — "AUJOURD'HUI"

```
<section className="k-pd-section">
  <Head>
    <Label>AUJOURD'HUI · {n} {n === 1 ? "MISSION" : "MISSIONS"} · {totalLabel}</Label>
    <Link href="/bookings">Calendrier →</Link>
  </Head>
  {items.map(j => <TodayRow key={j.id} job={j} />)}
</section>
```

- Card shell: white, hairline border, `var(--k-r-lg)`.
- Head padding: 10 px 14 px. Label in mono uppercase, link in body 11.5 px / 600 / `var(--k-text-primary)`.
- `totalLabel` = `formatMoneyFc(sum(jobs.map(j => j.fee)))`.

#### TodayRow

```
<a className="k-pd-today-row" href={`/bookings/${j.id}`}>
  <TimeBlock time={j.time} duration={j.duration} />
  <Body>
    <Title>{j.kind} · {j.client.name}</Title>
    <Sub>{j.address} · {priceLabel}</Sub>
  </Body>
  <StatusChip variant={j.status === "IN_PROGRESS" ? "live" : "confirmed"} compact />
</a>
```

- Row layout: `56px 1fr auto`, 12 px gap, 10 px vertical padding, top divider on every row except the first.
- **TimeBlock**: 56 px width, centred. Time in display font 18 px / 700 / line-height 1; duration in mono 9.5 px / `var(--k-text-muted)` / uppercase / 3 px margin-top (e.g. `"1H30"`, `"2H"`).
- **Title**: 13 px / 600 / `var(--k-text-primary)`.
- **Sub**: 11 px / `var(--k-text-muted)` / 2 px margin-top.
- **StatusChip compact**: 9.5 px font, 2 px × 6 px padding. Same colour tokens as §3.12.

#### Data shape

`todayJobs` = existing `data.today.jobs` (already filtered to today's range). **Excludes the booking already in the hero** if it's an `in_progress` / `next_today` variant. Includes `IN_PROGRESS` rows so the provider sees the running mission alongside the rest of the day.

If 0 items after exclusion, the card renders a single muted row: `"Aucune mission aujourd'hui"` (body 12 / `var(--k-text-muted)` / centered / 16 px padding). The card stays — preserves layout rhythm.

### §5.2 UpcomingList — "À VENIR"

```
<section className="k-pd-section">
  <Head>
    <Label>À VENIR</Label>
    <Link href="/bookings">Tout voir →</Link>
  </Head>
  {items.map(b => <UpcomingRow key={b.id} booking={b} />)}
</section>
```

#### UpcomingRow

```
<a className="k-pd-up-row" href={`/bookings/${b.id}`}>
  <DateBlock day={d} month={mAbbr} />
  <Body>
    <Title>{kind} · {clientFirstName}</Title>
    <Sub>{time} · {commune} · {priceLabel}</Sub>
  </Body>
</a>
```

- Row layout: `44px 1fr`, 12 px gap, 10 px vertical padding, top divider on every row except the first.
- **DateBlock**: 44 px width, centred. Day in display font 18 px / 700 / line-height 1; month abbreviation in mono 9.5 px / `var(--k-text-muted)` / uppercase / 3 px margin-top.
- **Title** / **Sub**: same scale as TodayRow.
- No status chip (all rows are CONFIRMED; no information).

#### Data shape

`upcoming` = existing `data.upcomingBookings` filtered to `status === "CONFIRMED"` and `scheduledDate > endOfToday()`. Sorted ascending. Capped at 3. **Excludes the booking already in the hero** if it's a `next_upcoming` variant.

If 0 items, the card shows the same muted row pattern: `"Aucune mission à venir"`.

---

## §6. ReviewsList — "AVIS RÉCENTS"

A compact list of the last 3 reviews. Full-width section below the grid.

```
<section className="k-pd-section">
  <Head>
    <Label>AVIS RÉCENTS</Label>
    <Link href={`/providers/${provider.id}#avis`}>Voir tous →</Link>
  </Head>
  {items.map(r => <ReviewRow key={r.id} review={r} />)}
</section>
```

### ReviewRow

```
<div className="k-pd-rev-row">
  <Avatar size={34} bg={paletteFor(r.client.id)}>{initials}</Avatar>
  <Body>
    <HeadRow>
      <Name>{clientFirstName} {lastInitial}.</Name>
      <Stars value={r.score} />
      <Date>{dateMono}</Date>
    </HeadRow>
    {r.comment && <Comment>« {comment} »</Comment>}
    {(r.serviceLabel || r.commune) && <Meta>{serviceLabel}{commune ? ` · ${commune}` : ""}</Meta>}
  </Body>
</div>
```

- Row: 11 px × 14 px padding, top divider on every row except the first.
- **Avatar**: 34 px circle, deterministic colour from existing palette (`colorFor(r.client.id || r.client.name)`).
- **HeadRow**: flex, gap 8 px. Name 13 / 600. Stars 11 px `★` glyphs in gold `#F59E0B` for filled, `var(--k-border)` for empty (rendered as filled count + empty count to avoid the `★☆` Unicode flicker). Date in mono 10.5 / `var(--k-text-muted)`, `margin-left: auto`.
- **Comment**: 12.5 / `var(--k-text-body)` / 1.4 line-height / 4 px margin-top. Capped at ~ 140 chars with ellipsis (CSS line-clamp 2).
- **Meta**: 10.5 / `var(--k-text-muted)` / 4 px margin-top.
- No reply button. No upvote. Read-only.

### Data shape

`recentReviews` = existing `data.recentReviews` field (already returned by `getProviderDashboard`, last 3 reviews). The DTO already carries `score`, `comment`, `createdAt`, `client.firstName`, `client.lastName`, and optionally `booking.title`. We use them as-is.

If 0 reviews, the section is hidden entirely.

---

## §7. PulseStrip — "POULS DE LA SEMAINE"

A compact 4-cell strip at the bottom. Replaces the existing 4-card stats grid.

```
<a className="k-pd-pulse" href="/pro/earnings">
  <Head>
    <Label>POULS DE LA SEMAINE · {periodLabel}</Label>
    <Link>Voir les revenus →</Link>
  </Head>
  <Grid>
    <Cell value={revenueLabel} delta={revenueDelta} label="REVENUS" />
    <Cell value={missions} delta={missionsDelta} label="MISSIONS" />
    <Cell value={responseRateLabel} qualitative={responseLabel} label="RÉPONSE" />
    <Cell value={ratingLabel + " ★"} delta={ratingDelta} label="" />
  </Grid>
</a>
```

- Card surface: white, hairline border, `var(--k-r-lg)`, 14 px padding.
- The whole card is a link to `/pro/earnings`. Hover: `box-shadow: var(--k-e1)`.
- Head: mono label, `Voir les revenus →` link in body 11.5 / 600.
- **Period label**: derived from `stats.period`. `"month" → "MAI 2026"`, `"week" → "CETTE SEMAINE"`. The existing backend returns `month` by default; we don't change it.
- **Grid**: `grid-template-columns: repeat(4, 1fr); gap: 14px;`.
- **Cell** anatomy:
  - Value in display font 22 px (desktop) / 18 px (mobile) / 700 / line-height 1.
  - Label + delta line in mono 9.5–10 px / `var(--k-text-muted)` / letter-spacing .04em, 4 px below value.
- **Value formats**:
  - Revenue: `"{shortMoney}"` (e.g. `"280k FC"`), tabular nums. Short formatter rounds to nearest thousand, drops trailing zeros (`280k`, `1.2M`, etc.).
  - Missions: integer.
  - Response rate: `"{n}%"` with `n` from `stats.responseRate.value`. Qualitative label below (`Excellent` / `Bon` / `À améliorer`) in `var(--k-success)` / `var(--k-warning)` / `var(--k-danger)` color.
  - Rating: `"{n.toFixed(1)} ★"`, tabular nums.
- **Delta line** color: positive = `#047857`, negative = `#B91C1C`, zero = `var(--k-text-muted)`. Format: revenue/missions use `"+{n}%"` or `"+{n}"`. Rating uses `"+0.1 CE MOIS"` (delta-then-period).
- On mobile the cells stay in one row; value font drops to 18 px; mono label truncates ("REVENUS" stays, "+12%" stays, "BON" stays).
- Always rendered, even when all values are zero (empty provider). In that case all deltas hide and the card still anchors the page bottom.

---

## §8. Backend changes

`getProviderDashboard` returns more data. No new endpoints, no breaking changes (additive).

### §8.1 New fields on `DashboardProviderResponse`

```ts
type DashboardProviderResponse = {
  // ... existing fields kept (see packages/schemas/src/dto.ts) ...

  // new:
  todos: {
    unreadMessages: ProviderDashboardMessageTodo[];  // same shape as client side
    bookingsToClose: ProviderDashboardCloseTodo[];   // CONFIRMED rows past scheduledDate + 2h
  };
  hasAnyBookingEver: boolean;                         // for empty/calm distinction
};
```

`profile_gap` to-dos are derived on the client from the existing `provider.completionItems` map (no new payload).

`extra_pending` to-dos are derived on the client from the existing `bookingRequests` array (we just skip the hero booking).

### §8.2 New row shapes

```ts
type ProviderDashboardMessageTodo = {
  conversationId: string;
  unreadCount: number;
  lastMessageAt: string;        // ISO
  lastMessagePreview: string | null;
  client: { id: string; firstName: string; lastName: string };
};

type ProviderDashboardCloseTodo = {
  bookingId: string;
  title: string;                 // booking.title (kind)
  scheduledDate: string;         // ISO
  price: number;
  client: { firstName: string };
};
```

### §8.3 Service work

In `dashboard.service.ts`, `getProviderDashboard` gains two parallel queries (added to the existing `Promise.all`):

1. **`todos.unreadMessages`** — `conversation.findMany({ where: { participants: { some: { userId: actor.id } } }, include: { messages: { take: 1, orderBy: { createdAt: "desc" } }, _count: { select: { messages: { where: { readAt: null, senderId: { not: actor.id } } } } } }, orderBy: { lastMessageAt: "desc" }, take: 10 })`. Map only those with `_count.messages > 0` and last message inbound. Cap at 5.
   - Verify at implementation time: the conversation schema may differ. Reuse the same query shape as the client-dashboard implementation (`messaging.service.ts` already does this kind of read).
2. **`todos.bookingsToClose`** — `prisma.booking.findMany({ where: { providerId: provider.id, status: "CONFIRMED", scheduledDate: { lt: twoHoursAgo } }, orderBy: { scheduledDate: "desc" }, take: 10, include: { client: { select: { firstName: true } } } })`. Map to `ProviderDashboardCloseTodo`. Cap at 5.
3. **`hasAnyBookingEver`** — `prisma.booking.count({ where: { providerId: provider.id } }) > 0`. Could derive from `statsSummary.totalBookingsAllTime > 0`, but adding it explicitly keeps the consumer decoupled from the legacy stats payload.

All run inside the existing `Promise.all`.

### §8.4 DTO / shared schemas

In `packages/schemas/src/dto.ts` (Zod), add:

```ts
export const ProviderDashboardMessageTodoSchema = z.object({ ... });
export const ProviderDashboardCloseTodoSchema = z.object({ ... });
export const ProviderDashboardTodosSchema = z.object({
  unreadMessages: z.array(ProviderDashboardMessageTodoSchema).default([]),
  bookingsToClose: z.array(ProviderDashboardCloseTodoSchema).default([]),
});
```

Extend `DashboardProviderResponseSchema` with `todos` (optional, defaulted) and `hasAnyBookingEver` (boolean, optional + defaulted false for back-compat with old client builds).

`@kayu/api` regenerates types from the DTO and the web client picks them up automatically.

### §8.5 Tests

Follow the existing pattern in `apps/backend/src/modules/dashboard/dashboard.service.spec.ts`:

1. Provider with 0 bookings ever → `hasAnyBookingEver: false`, `todos.unreadMessages: []`, `todos.bookingsToClose: []`.
2. Provider with 1 CONFIRMED booking whose `scheduledDate` is `now - 3 h` → `todos.bookingsToClose` has 1 row.
3. Provider with 1 CONFIRMED booking whose `scheduledDate` is `now + 1 h` → `todos.bookingsToClose: []` (future).
4. Provider with 1 conversation containing 2 unread inbound messages → `todos.unreadMessages` has 1 row with `unreadCount: 2` and the preview.
5. Provider whose only "unread" conversation had the last message outbound → `todos.unreadMessages: []`.
6. ForbiddenException when `actor.role !== "PROVIDER"` (existing test stays).

---

## §9. Loading + error states

### §9.1 Skeleton

The page-level skeleton mirrors the section structure 1:1 so the layout never jumps:

- Greeting: one `Skeleton h-7 w-48` (name), one `Skeleton h-4 w-56` (meta), one `Skeleton h-7 w-36` (availability chip) on the right.
- Hero: full-width skeleton matching the hero card (chip row + tall headline + sub line + client row + two action pills).
- TodoStrip: 2 rows. Always rendered while loading; hides once loaded if there are no todos.
- DashboardGrid: two side-by-side skeleton cards. Each has a head row + 2 child rows.
- ReviewsList: head row + 2 child rows.
- PulseStrip: head row + 4 cell skeletons in one row.

Skeleton atoms reuse the existing `<SkeletonBlock />` already in `ProviderDashboardClient.tsx`. Move it to its own `DashboardSkeleton.tsx`.

### §9.2 Error state

If the dashboard query errors, the page replaces hero + below content with a single centred block:

```
<div className="k-pd-error">
  <I.alertCircle />
  <h2>Impossible de charger ton tableau de bord.</h2>
  <p>Vérifie ta connexion et réessaie.</p>
  <button className="k-btn k-btn-primary" onClick={() => refetch()}>Réessayer</button>
</div>
```

- Container: white card with hairline border, centered text, 32 px padding, 16 px vertical gap.
- Icon: `I.alertCircle` at 36 px, `var(--k-text-muted)`.
- The Greeting renders above the error block (firstName visible so the user keeps orientation).

### §9.3 Auth guard

The page-level `useQuery` is gated on `!!user && user?.role === "PROVIDER"`. The existing redirect to `/` when role !== PROVIDER stays. The dashboard layout's redirect covers the unauthenticated case.

---

## §10. Mobile vs desktop

| | Mobile (< 768) | Desktop (≥ 768) |
|---|---|---|
| Layout | Single column | Hero full-width; `Aujourd'hui` / `À venir` as 1.4fr / 1fr; `Avis récents` + `Pouls` full-width |
| Outer padding | 12 px 16 px 32 px | 20 px 24 px 40 px |
| Hero headline | 22 px | 26 px |
| Pending hero actions | `Message` + 2-button row (Refuser / Accepter) when narrow; flex row when wide | Single 3-button row (Message · gap · Refuser · Accepter) |
| Availability chip | Same composition; drops below the greeting at < 480 px | Right-aligned in the greeting row |
| Pulse strip | 4 cells in one row, value font 18 px | 4 cells, value font 22 px |
| Sticky elements | None on the dashboard page itself; AppShell's bottom tab bar stays present | None |

The dashboard does **not** introduce its own sticky bar. AppShell already provides navigation.

---

## §11. Tokens, atoms, file map

### New components

All in `apps/web/src/components/dashboard/provider/` (new subfolder):

| Component | Purpose |
|---|---|
| `Greeting.tsx` | Salutation + meta line + AvailabilityChip. |
| `AvailabilityChip.tsx` | The tappable chip + bottom-sheet/popover with toggle and zone summary. |
| `DashboardHero.tsx` | State-aware hero. Receives the whole `ProviderDashboardData`, dispatches to the right variant. |
| `HeroOnboarding.tsx` / `HeroPending.tsx` / `HeroInProgress.tsx` / `HeroNext.tsx` / `HeroUnavailable.tsx` / `HeroCalm.tsx` / `HeroEmpty.tsx` | One file per variant body. `HeroNext` is shared between `next_today` and `next_upcoming` (proximity label is the only difference). |
| `HeroStatusChip.tsx` | Re-export of the chip atom from `components/dashboard/client/HeroStatusChip.tsx` (or move that atom to a shared `components/dashboard/atoms/` folder). |
| `RefuseReasonSheet.tsx` | The bottom-sheet / popover with the 3 reasons + textarea for "Autre raison…". |
| `TodoStrip.tsx` | "À FAIRE" card. |
| `TodoRow.tsx` | Single row. Receives `kind: "extra_pending" \| "close_overdue" \| "unread_message" \| "profile_gap"` + payload. |
| `TodayList.tsx` | "AUJOURD'HUI" section. |
| `TodayRow.tsx` | Single row. |
| `UpcomingList.tsx` | "À VENIR" section. |
| `UpcomingRow.tsx` | Single row. |
| `ReviewsList.tsx` | "AVIS RÉCENTS" section. |
| `ReviewRow.tsx` | Single row. |
| `PulseStrip.tsx` | The 4-cell business strip. |
| `DashboardSkeleton.tsx` | Replaces the existing inline `DashboardLoadingState` in `ProviderDashboardClient.tsx`. |
| `providerDashboardHelpers.ts` | `pickHeroVariant`, `formatShortMoney`, profile-gap derivation, hero-booking exclusion. |

### Reused

- `Skeleton`/`SkeletonBlock` (moved).
- `I` icon registry from `@kayu/ui/web`. Icons used: `I.alertCircle`, `I.alertTriangle`, `I.clock`, `I.messageCircle`, `I.camera`, `I.image`, `I.checkSquare`, `I.calendar`, `I.arrowRight`, `I.check`, `I.x`. No new icons.
- `TrustChip` from `@kayu/ui/web` for the trust chip in the greeting meta line.
- `formatMoneyFc` from `@kayu/ui`.
- `formatWhen`, `formatRelativeFR` from `lib/booking-v2.ts`.
- `useAuth`, `apiClient`, `bookingsApi`, `providersApi`, `dashboardApi`, `queryKeys` — unchanged.
- The existing `availabilityMutation` and `bookingActionMutation` in `ProviderDashboardClient.tsx` move into the new hero variants and chip.

### Removed / superseded

- Big-avatar header → plain text greeting.
- Full-width availability bar → AvailabilityChip in the greeting.
- 4-card stats grid → PulseStrip.
- Inline `OnboardingBanner` above the page → `HeroOnboarding` variant.
- `BookingRequestCard` (inline, in `ProviderDashboardClient.tsx`) → `HeroPending` + `extra_pending` TodoRow.
- `JobCard` (the dashboard rendering) → `TodayRow`.
- `EmptyLine` (dashed) → single muted row inside each section's card.
- Feature-flagged "Nouvelles demandes" column → removed entirely. The `RequestCard` component file stays on disk (still used at `/pro/requests`).
- Fixed-corner "Actualisation…" toast → removed. Refetches are silent.

These shared components (`StatCard`, `TrustChip`, `Avatar`, `StarRating`, `JobCard`, `RequestCard`) stay on disk. We only stop importing them in `ProviderDashboardClient.tsx`.

### CSS class prefix

All new atoms use the `k-pd-*` prefix (provider-dashboard) to stay clear of `k-cd-*` (client), `k-bd-*` (booking details), `k-bk-*` (booking flow), `k-pdet-*` (provider details).

### Tokens used

- Colors: `--k-surface`, `--k-surface-muted`, `--k-border`, `--k-border-subtle`, `--k-text-primary`, `--k-text-body`, `--k-text-muted`, `--k-text-subtle`, `--k-success`, `--k-success-subtle`, `--k-warning`, `--k-warning-subtle`, `--k-danger`.
- Radii: `--k-r-sm`, `--k-r-md`, `--k-r-lg`, `--k-r-pill`.
- Font: `--k-font-mono`, `--font-display`. Display font is loaded globally.

---

## §12. State × component matrix

| Hero variant | TodoStrip | TodayList | UpcomingList | ReviewsList | PulseStrip |
|---|---|---|---|---|---|
| `onboarding` | hidden | hidden | hidden | hidden | hidden |
| `pending_request` | render if any todos | render if any today | render if any upcoming (excluding hero) | render if any reviews | render |
| `in_progress` | render if any todos | render (excluding hero) | render if any upcoming | render if any reviews | render |
| `next_today` | render if any todos | render (excluding hero) | render if any upcoming | render if any reviews | render |
| `next_upcoming` | render if any todos | render if any today | render if any upcoming (excluding hero) | render if any reviews | render |
| `unavailable` | hidden | hidden | hidden | render if any reviews | render |
| `calm` | render if any todos | render if any today | render if any upcoming | render if any reviews | render |
| `empty` | hidden | hidden | hidden | hidden | render (all zeros) |

---

## §13. Edge cases

- **Multiple PENDING bookings**: hero shows soonest by `scheduledDate`; the rest go to the À FAIRE strip as `extra_pending` rows. Tie-break by `createdAt desc`.
- **Onboarding incomplete + a legacy PENDING booking exists**: onboarding wins the hero. The PENDING goes to À FAIRE. The provider can still respond from the booking-detail page (linked from the todo).
- **IN_PROGRESS + multiple PENDINGs**: `pending_request` wins per the priority order (clients are waiting; the in-progress mission is the provider's current focus and they don't need a hero reminder for it). The IN_PROGRESS booking still shows in `Aujourd'hui` with the live chip.
   - **Rationale flag:** earlier in the design we discussed putting `in_progress` second after onboarding. The final order puts `pending_request` second because: time-to-respond is the highest-leverage business metric, an unresponded pending becomes a lost client, and the in-progress mission is information the provider already has from being physically there. If field testing flips this preference we revisit in v1.1.
- **Unavailable + IN_PROGRESS**: `in_progress` wins (you're literally on a job; the toggle is moot).
- **Unavailable + next_upcoming**: `next_upcoming` wins (a future confirmed mission is more concrete than the availability state).
- **Refuse a pending**: opens the reason sheet; cancel closes without firing. The mutation calls `bookingsApi.update(id, { status: "CANCELLED", cancelReason })` with the existing optimistic-update pattern. Toast on error reuses today's copy.
- **`profile_gap` after all items are true**: kind is filtered out; no row generated. If `completionPercentage === 100`, the kind contributes nothing to the strip.
- **`close_overdue` for an already-COMPLETED booking**: backend query filters on `status: "CONFIRMED"` only, so already-completed rows are skipped. If the user marks complete from the booking-detail page, refetching the dashboard drops the row.
- **`unread_message` when conversation has no preview**: fall back to `"Conversation · {relativeDate}"` (matches client dashboard).
- **Avatar palette collisions**: existing `colorFor` is deterministic per `id`. Two clients with the same `id`-hash would collide; unlikely and not worth deduping.
- **`hasAnyBookingEver === false` but availability flipped off**: `empty` wins (welcome state takes precedence over scolding). The provider should know they're live before being nudged about the toggle.
- **Backend returns `bookingRequests: []` and `upcomingBookings: undefined`** (older client builds): treat undefined as `[]`, hero falls back to `calm` (with history) or `empty` (without). PulseStrip renders.
- **react-query cache**: a single key `queryKeys.dashboard.provider` covers everything. Refetched on window focus (existing default) and after the accept/refuse/availability mutations (already wired). No new invalidation work.
- **Hero booking becomes stale mid-session** (e.g. provider accepted on another device): refetch on focus picks up the change; the hero re-runs `pickVariant` against the new payload.

---

## §14. Acceptance criteria

1. **Onboarding incomplete** → `onboarding` hero with amber chip + progress bar + "Continuer l'inscription →" routing to `/pro/onboarding`. À FAIRE / today / upcoming / reviews hidden. PulseStrip hidden.
2. **Single PENDING request** → `pending_request` hero showing the booking; Accept fires the existing mutation; Refuse opens the reason sheet.
3. **Multiple PENDING requests** → soonest in the hero; others in À FAIRE as `extra_pending` rows with `Répondre →` routing to `/bookings/{id}`.
4. **IN_PROGRESS booking** → `in_progress` hero with pulsing green chip "EN COURS · CHEZ LE CLIENT" + "Terminer la mission →" routing to the booking detail.
5. **No pending, next CONFIRMED today** → `next_today` hero with chip "CONFIRMÉE · DANS 2H30" (or relevant proximity copy).
6. **No pending, next CONFIRMED tomorrow** → `next_upcoming` hero with "CONFIRMÉE · DEMAIN".
7. **Published, available, no bookings today/upcoming, has history** → `calm` hero with "Journée libre." + business stats summary in sub line + share-profile CTA.
8. **Available toggle OFF, no pending/in_progress/upcoming** → `unavailable` hero with "Tu es invisible aux clients." + "Redevenir disponible" CTA (fires the mutation directly).
9. **Brand-new provider, profile published, 0 bookings ever** → `empty` hero with "Ton profil est en ligne." + tips list. Other sections (except PulseStrip with zeros) hidden.
10. **A CONFIRMED booking whose `scheduledDate` is in the past** → appears in À FAIRE as a red `close_overdue` row at the top of the strip.
11. **2 unread inbound messages from a single conversation** → 1 row in À FAIRE with `unreadCount: 2` + preview snippet.
12. **`completionPercentage` < 100, no photo** → "Ajoute une photo de profil" appears as a green `profile_gap` row at the bottom of À FAIRE.
13. **Availability chip in the greeting** toggles when clicked (or via the bottom-sheet); the page refetches and the hero re-picks if the variant changes.
14. **`Aujourd'hui` / `À venir` exclude the hero booking** — never duplicated.
15. **Refuse with reason** sheet submits with the chosen `cancelReason`; the booking disappears from the page on success.
16. **Mobile 375 px and desktop 1280 px viewports** render without horizontal overflow.
17. **No gradients** anywhere (visual sweep / DOM grep for `gradient`).
18. **Skeleton matches the loaded layout** 1:1 — no shift between loading and loaded states.
19. **`enableJobRequests` feature flag is off** — the dashboard contains no reference to job-match requests, the matching column, or `RequestCard`.

---

## §15. Out-of-scope follow-ups

- Realtime push for incoming PENDING bookings (today: refetch-on-focus / on-mutation).
- "Reply to review" feature — would require backend work and a new section behavior.
- A separate availability scheduler (different hours by weekday). Today: a single on/off toggle.
- Smart hero re-ranking based on observed provider behavior (e.g. demote `pending_request` if the provider has historically refused everything, surface `calm` instead).
- Mobile (Expo) implementation — separate spec when the Expo app catches up.
- Spending insights / forecast ("À ce rythme tu feras X FC ce mois").
- Pruning the legacy `recentBookings`, `legacyStats`, `viewsData`, `notifications.unreadCount` fields from the provider dashboard response after auditing other callers.
- Removing the `BookingRequestCard`, `JobCard`, `RequestCard`, and big stat grid components from disk after the redesign settles. For now they stay.
- A configurable "what to surface" preference (let the provider hide a section). Not needed v1.

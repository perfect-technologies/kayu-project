# Client dashboard redesign — design

**Date:** 2026-05-14
**Scope:** `apps/web/src/app/dashboard/client/page.tsx`, new components in `apps/web/src/components/dashboard/client/`, targeted additions to `apps/backend/src/modules/dashboard/dashboard.service.ts` + DTOs in `packages/schemas`. No mobile (Expo) work.
**Status:** Pending implementation plan.

## Goal

Rebuild `/dashboard/client` as a **mission-control surface** that answers two questions at a glance:

1. **What's happening in my world right now?** — state-led hero card.
2. **What do I actually need to do?** — a tight to-do strip, only when there's something genuine.

Today's page is generic SaaS chrome: stats grid + quick-actions tiles + "recent bookings" card + "favorites" card. The stats are vanity counts, the quick actions duplicate the sidebar, and there's no sense of *which* booking matters most. It also predates the current design direction (flat surfaces, hairline borders, state-led heroes) used on the landing, provider details, booking flow, and booking details pages.

The redesign:

- Replaces the stats grid with a **state-aware hero** modeled on the booking-details hero (`BookingHero.tsx`). Picks the most relevant booking automatically.
- Replaces "quick actions" with a focused **À faire** strip carrying only real client to-dos (reviews to leave, unread message threads).
- Replaces "recent bookings" with a date-led **À venir** list (next 3 upcoming, excluding the one already in the hero).
- Keeps **Tes prestataires** but reframes it as a merged "favorites + most-booked" list aimed at one-tap rebook.
- Adds **Activité récente** — compact last-3-completed rows with per-row review state.
- Designs **mobile-first** with a single-column layout, and a 2-column grid at desktop. Uses the same flat-surface / hairline-border / display-font vocabulary as the rest of the new pages.

## Non-goals

- No mobile (Expo) implementation. Web only.
- No changes to the provider dashboard (`/dashboard/provider`), admin dashboard, or shared `DashboardStats`/`QuickActions` components used elsewhere.
- No changes to the marketing landing (`/`). Logged-in clients are **not** redirected from `/` — they reach the dashboard via the sidebar entry. This is an explicit decision: `/` stays the discovery surface for everyone, the dashboard is the status surface.
- No changes to status semantics, payment flow, commission rules, or booking-state transitions.
- No new auth flows, no new login redirect target.
- No realtime updates (websockets / supabase channels). Polls via react-query refetches like the rest of the app.
- No "discover providers" / category grid on the dashboard outside of the **Empty** hero variant. Discovery lives on `/`.

## Required reading

1. `docs/design-direction/index.html` — flat surfaces, hairline borders, Lucide icons, restrained color, no gradients, plain text for secondary metadata.
2. `packages/ui/src/tokens.ts` — canonical tokens.
3. `docs/superpowers/specs/2026-05-14-booking-details-redesign-design.md` — establishes the BookingHero, StatusChip, and step-strip vocabulary this spec inherits.
4. `docs/superpowers/specs/2026-05-14-booking-flow-redesign-design.md` — typography, spacing, button conventions.

## Global design rules (inherited)

1. No gradient backgrounds. Flat surfaces only.
2. Lucide icons via `@kayu/ui/web`'s `I`. The mockup emoji placeholders (`✂️`, `🧹`, `🔧`, `⚡`) are stand-ins — production uses category icons already wired into the existing `CategoryTile` (Lucide / per-category SVGs already in `@kayu/ui`).
3. Plain text for secondary metadata, chips only for status and trust.
4. Restrained color — status is the only place color carries meaning. Everything else uses neutrals (`--k-text-primary`, `--k-text-body`, `--k-text-muted`, `--k-border`, `--k-border-subtle`).
5. Tokens are the source of truth.
6. Display font (Bricolage Grotesque) for big numbers/dates/headings; body font for everything else; mono (`--k-font-mono`) for labels, refs, and date "MAI/AVR" abbreviations.

---

## §1. Page composition

```
<div className="k-cd-page">                          {/* max-width 1080 px, centred, padded */}

  <Greeting user={user} summary={summary} />        {/* salutation + tiny meta line */}

  <DashboardHero data={...} />                       {/* state-aware, see §3 */}

  {todos.length > 0 && <TodoStrip items={todos} />}  {/* §4, hides when empty */}

  {!isEmpty && (
    <DashboardGrid>                                  {/* §5: 1fr on mobile, 1.4fr/1fr on desktop */}
      <UpcomingList items={upcoming} />              {/* §5.1 */}
      <ProvidersList items={providers} />            {/* §5.2 */}
    </DashboardGrid>
  )}

  {!isEmpty && <ActivityList items={completed} />}  {/* §6 */}

</div>
```

- **Breakpoint:** `md` = 768 px. Below: single column. At/above: 1fr / 300 px the same way the booking-details right rail breaks. The "À venir" + "Tes prestataires" pair specifically uses `1.4fr / 1fr` at desktop so the booking list has more breathing room than the providers column.
- **Outer width:** `max-width: 1080px`, `margin: 0 auto`, padding `12px 16px 32px` on mobile, `20px 24px 40px` on desktop.
- **Background:** the app background (`var(--k-surface-muted)`, already in use). All cards sit on `var(--k-surface)` with `1px solid var(--k-border)` hairlines.
- **Vertical rhythm:** 14 px gap between sections on mobile, 18 px on desktop.

The page is **`'use client'`**, hosts a single `useQuery(queryKeys.dashboard.client, ...)`, and renders skeletons in `isLoading` (see §8). The skeleton mirrors the section structure 1:1.

---

## §2. Greeting

A small block above the hero. Two lines:

```
<header className="k-cd-greet">
  <h1>Bonjour {firstName}<span className="k-cd-greet-light"> — voici l'état de tes services</span></h1>
  <p className="k-cd-greet-sub">{summaryLine}</p>
</header>
```

- `h1`: display font, 22 px (mobile) / 26 px (desktop), 700 weight, letter-spacing -.015em. The "— voici l'état de tes services" suffix is 400 weight, `var(--k-text-body)`. On mobile the suffix is dropped (the line wraps badly at 375 px); only `Bonjour {firstName}` shows, with the summary below.
- `summaryLine`: 12.5 px, `var(--k-text-muted)`. Content depends on state:
  - Has upcoming: `"{dateLong} · {upcoming.length} réservation{s} à venir"`.
  - No upcoming, has history: `"Aucune réservation active · dernière mission il y a {relative}"`.
  - No history: `"Bienvenue sur KAYOU"`.

`firstName` is taken from `data.user.firstName` (already returned by `getClientDashboard`).

No greeting variations by time-of-day (`Bonjour / Bon après-midi / Bonsoir`). The existing code does this; we drop it. The greeting is about *who* you are, not *when* you arrived.

---

## §3. DashboardHero

State-aware hero. Picks one of **five variants** based on the data; all share the same outer card shell so the page rhythm is steady.

### §3.1 Selection priority

```ts
type HeroVariant =
  | "in_progress"
  | "upcoming_confirmed"
  | "upcoming_pending"
  | "calm"
  | "empty";

function pickVariant(d: ClientDashboardData): HeroVariant {
  const inProgress = d.upcoming.find((b) => b.status === "IN_PROGRESS");
  if (inProgress) return "in_progress";

  const soonest = d.upcoming
    .filter((b) => b.status === "CONFIRMED" || b.status === "PENDING")
    .sort(byScheduledDateAsc)[0];
  if (soonest && soonest.status === "PENDING") return "upcoming_pending";
  if (soonest) return "upcoming_confirmed";

  if (d.hasAnyBookingEver) return "calm";
  return "empty";
}
```

The hero "owns" the booking it leads with — that booking is then **excluded from the À venir list** (see §5.1) to avoid duplication.

### §3.2 Shared shell

- Background: `var(--k-surface)`. White.
- Border: `1px solid var(--k-border)`. No accent bars.
- Radius: `var(--k-r-lg)` (14 px).
- Padding: 18 px mobile, 22 px desktop.
- Shadow: none.
- Margin-bottom: 14 px (mobile) / 18 px (desktop).

### §3.3 Variant: `in_progress`

Live mission happening right now.

```
<section className="k-cd-hero k-cd-hero--live">
  <Ribbon>
    <StatusChip variant="live" label="EN COURS" />
    <Ref>#{ref}</Ref>
  </Ribbon>
  <When>{whenLabelLive}</When>
  <Sub>{title} · {durationLabel} · {commune}</Sub>
  <PriceBlock label="PRIX CONVENU" value={formatMoneyFc(price)} helper="Espèces à la fin" />
  <Who avatar name verified rating />
  <Actions>
    <Secondary>Message</Secondary>
    <Primary>Voir la réservation →</Primary>
  </Actions>
</section>
```

- **StatusChip** "live" variant — `background: var(--k-success-subtle)`, `color: #047857`, leading 6 px green dot that pulses with the existing `kPulse` keyframes.
- **When** label format: `"En ce moment · {time}"` (e.g. `"En ce moment · 14:00"`). Display font, 22 px mobile / 28 px desktop, 700, letter-spacing -.02em. (All hero headlines share this size pair — see §9.)
- The `Sub` line joins with ` · ` and lives at 13 px / `var(--k-text-body)`.
- **Mobile:** `PriceBlock` is *inlined* into the Sub line (`"Coiffure · Tresses · ≈ 2 h · 35 000 FC"`) to avoid stacking a second big number. Desktop puts `PriceBlock` in a right-column inside a 2-column hero-row grid (`1fr auto`).
- **Who row:** identical to `BookingHero.tsx` (38 px avatar mobile / 42 px desktop, name in display font 14-15 px, verified `I.badgeCheck`, role line `"Ta {profession} · ★ {rating} ({n} avis)"`).
- Two actions: secondary "Message" (calls existing message flow), primary "Voir la réservation →" (navigates to `/bookings/{id}`).

### §3.4 Variant: `upcoming_confirmed`

A confirmed booking in the future.

```
<section className="k-cd-hero k-cd-hero--confirmed">
  <Ribbon>
    <StatusChip variant="confirmed" label={chipLabel} />
    <Ref>#{ref}</Ref>
  </Ribbon>
  <When>{whenLabelDate}</When>
  <Sub>{title} · {durationLabel} · {commune}</Sub>
  {hasOffer && <InfoStrip>Accord enregistré · espèces à la fin de la mission.</InfoStrip>}
  <Who ... />
  <Actions>
    <Secondary>Message</Secondary>
    <Primary>Voir la réservation →</Primary>
  </Actions>
</section>
```

- **chipLabel** depends on proximity:
  - Today: `"CONFIRMÉE · AUJOURD'HUI"`.
  - Tomorrow: `"CONFIRMÉE · DEMAIN"`.
  - Within 7 days: `"CONFIRMÉE · {jourLong}"` (e.g. `"CONFIRMÉE · SAMEDI"`).
  - Beyond: `"CONFIRMÉE"`.
- **StatusChip** "confirmed" variant — same green-pulse treatment as `in_progress`, no separate label. (Visual differentiation comes from the chip label + the absence of "live" copy in the body.)
- **When** label format reuses `formatWhen` from `lib/booking-v2.ts`. For "today" it formats as `"Aujourd'hui · {time}"`; for "tomorrow" `"Demain, {jourLong} {date} · {time}"`; beyond, `"{jourLong} {date} · {time}"`.
- **InfoStrip** appears only when the booking has a `FinalOffer` row (already in the model). Quiet neutral strip (`#F8FAFC` bg, no border, `var(--k-text-body)` text, 12 px). It carries an `info` dot (8 px circle, `var(--k-text-subtle)` colour). No CTA. **This is the canonical place the dashboard surfaces "accord enregistré" — not as a to-do.**

### §3.5 Variant: `upcoming_pending`

Soonest upcoming booking is still PENDING (provider hasn't confirmed). Tone shifts from green to amber.

Same composition as §3.4 except:

- **StatusChip** "pending" variant — `background: var(--k-warning-subtle)`, `color: #92400E`, leading amber 6 px dot (no pulse). Label: `"EN ATTENTE"`.
- **InfoStrip** mandatory, warning tone (`#FFFBEB` bg / `#FDE68A` border / `#92400E` text), 12 px. Copy: `"⏱ {firstName} n'a pas encore confirmé. Réponse habituelle en moins de 2 h."` (the clock glyph is rendered as `I.clock`, not an emoji — see §10).
- **Actions:** secondary "Message" (60 % width on mobile primary slot), primary "Voir la réservation →".
- No live-pulse anywhere.

### §3.6 Variant: `calm`

The user has booking history but nothing active right now. Reframes the hero from "what's next" to "who would you book again." Most common state for returning users.

```
<section className="k-cd-hero k-cd-hero--calm">
  <Ribbon>
    <StatusChip variant="neutral" label="AUCUNE RÉSERVATION ACTIVE" />
  </Ribbon>
  <When>Rien de prévu pour l'instant.</When>
  <Sub>Ta dernière mission s'est terminée il y a {relative}. Réserve à nouveau ou retrouve un prestataire de confiance.</Sub>
  <CalmProviderPills items={top3Providers} />
  <Actions>
    <Primary>Réserver un nouveau service →</Primary>
    <Ghost>Voir mes prestataires</Ghost>
  </Actions>
</section>
```

- **StatusChip** "neutral" — `background: #F1F5F9`, `color: var(--k-text-body)`, no dot.
- **When**: display font, 26 px mobile / 32 px desktop, 700. Black text. The headline is a sentence ending in a period, not a date.
- **CalmProviderPills**: a horizontal row of up to 3 pills. Each pill: 8 px × 10 px padding, `var(--k-r-pill)`, `#F8FAFC` background, hovers to `#F1F5F9`. Inside: 24 px avatar (colour from existing avatar palette) + `"{name} · {profession}"` in body 11.5 px / 600. Tap target navigates to `/providers/{id}`. Pills wrap on narrow viewports.
- **Source** = same 4-item merged list used by ProvidersList (§5.2), truncated to 3.
- **Actions:** primary "Réserver un nouveau service →" routes to `/`. Ghost "Voir mes prestataires" scrolls to / focuses the ProvidersList section (the section also exists below, so the ghost is a soft anchor).

### §3.7 Variant: `empty`

Brand new user, no bookings ever.

```
<section className="k-cd-hero k-cd-hero--empty">
  <Ribbon>
    <StatusChip variant="welcome" label="BIENVENUE" />
  </Ribbon>
  <When>Réserve ton premier service.</When>
  <Sub>Des prestataires vérifiés à Kinshasa et Brazzaville. Tu paies en espèces à la fin de la mission, pas avant.</Sub>
  <CategoryTilesRow items={top4Categories} />
  <Actions>
    <Primary>Découvrir les prestataires →</Primary>
  </Actions>
</section>
```

- **StatusChip** "welcome" — `background: #FDE68A`, `color: #92400E`, no dot.
- **CategoryTilesRow**: 4 tiles in a row on desktop, 2×2 on mobile. Each tile: `#F8FAFC` bg, no border, 10 px radius, 10 px padding, 32 px white-circle icon container with hairline border, category label in body 10.5 px / 600 / centered. Hover: `1px solid var(--k-text-primary)` border. Tap → `/services?category={slug}`.
- **Source** = top 4 categories by booking volume across the platform. Reuses the same query the landing page uses for category tiles (the landing already fetches this; the dashboard reads from the same endpoint via a separate `useQuery`).
- **Actions:** single primary "Découvrir les prestataires →" routes to `/`.

In `empty`, **TodoStrip / UpcomingList / ProvidersList / ActivityList all hide.** The hero carries the whole page.

### §3.8 Mobile layout for all variants

- Hero headline uses the mobile pair (22 px) of the size pair set in §3.3 — no other downscaling needed.
- `Sub` line absorbs the `PriceBlock` content (for `in_progress` / `upcoming_*` variants).
- `Who` row stays full-width below the body.
- Actions become a 2-button flex row: secondary on the left (`flex: 1`), primary on the right (`flex: 1.4`). On variants with no secondary action (empty / calm primary), the primary spans the full row.

### §3.9 StatusChip tokens

| Variant | Background | Text | Dot |
|---|---|---|---|
| `live` (in_progress) | `var(--k-success-subtle)` | `#047857` | green `var(--k-success)`, pulse |
| `confirmed` | `var(--k-success-subtle)` | `#047857` | green, pulse |
| `pending` | `var(--k-warning-subtle)` | `#92400E` | amber `var(--k-warning)`, no pulse |
| `neutral` (calm) | `#F1F5F9` | `var(--k-text-body)` | none |
| `welcome` (empty) | `#FDE68A` | `#92400E` | none |

These reuse the same vocabulary as `BookingHero`'s `StatusChip` and add the `neutral` + `welcome` variants. The chip atom is shared (see §10).

---

## §4. TodoStrip — "À FAIRE"

A single card carrying genuine client to-dos. Renders only when `todos.length > 0`.

```
<section className="k-cd-todo">
  <Head>
    <Label>À FAIRE</Label>
    <Count>{todos.length} {todos.length === 1 ? "tâche" : "tâches"}</Count>
  </Head>
  {todos.map(t => <TodoRow key={t.key} item={t} />)}
</section>
```

### §4.1 Card surface

- Same shell as the hero (white, `1px solid var(--k-border)`, `var(--k-r-lg)`). Not amber-bordered — the amber framing in early mockups felt alarmist for items that are genuinely optional (a review is *useful*, not *urgent*).
- Padding: `0`. Head and rows manage their own padding.
- Head: 10 px 16 px 6 px, label in mono uppercase, count in body 10.5 px / 600 / `var(--k-text-muted)` with `#F1F5F9` pill (2 px × 8 px, `var(--k-r-pill)`).

### §4.2 To-do source

Two kinds of to-do:

| Kind | When | Source |
|---|---|---|
| `review` | Booking is COMPLETED + paid, no `Review` row exists where `(bookingId, clientId)` matches | New `dashboard.todos.reviews` payload, see §7. One row per unreviewed completed booking. |
| `message` | Conversation has `unreadCount > 0` AND the last message's `senderId !== currentUser.id` | New `dashboard.todos.unreadMessages` payload, see §7. One row per conversation with unread inbound messages. |

Other event types (booking confirmed, accord registered, payment confirmed by provider, etc.) **do not** generate to-dos. They're either informational (handled by the hero info strip or the À venir/Activité rows) or already in-flight (no client action needed).

### §4.3 TodoRow

```
<a className="k-cd-todo-row" href={item.href}>
  <Icon><I.{review ? "star" : "messageCircle"} /></Icon>
  <Body>
    <Title>{item.title}</Title>
    <Meta>{item.meta}</Meta>
  </Body>
  <CTA>{item.cta} →</CTA>
</a>
```

- Row: 11 px × 16 px padding, top divider `1px solid var(--k-border-subtle)` (first row omits).
- **Icon** container: 32 px × 32 px, 8 px radius. Review rows use `background: #FEF3C7; color: #92400E;` (amber). Message rows use `background: #E0E7FF; color: #4338CA;` (indigo). One Lucide icon centred at 14 px.
- **Title**: 13 px / 600 / `var(--k-text-primary)` / 1.3 line-height.
  - Review: `"Note ton {category} avec {providerFirstName}"`.
  - Message: `"{providerFirstName} t'a envoyé un message"` (or `"{providerFirstName} t'a écrit · {n} messages"` if `n > 1`).
- **Meta**: 11 px / `var(--k-text-muted)` / 1px margin-top.
  - Review: `"Terminé {relativeDate} · {formatMoneyFc(price)}"`.
  - Message: `"« {messagePreview} »"` (truncated to ~ 60 chars). If preview is unavailable, fall back to `"Conversation · {relativeDate}"`.
- **CTA**: 11.5 px / 600 / `var(--k-text-primary)` text on `#F1F5F9` pill (`var(--k-r-md)`, 6 px × 10 px padding). Aligned right with `margin-left: auto`. Copy: review = "Noter →"; message = "Répondre →".
- **Whole row is the link.** `href`:
  - Review: `/bookings/{bookingId}` (review submission lives inside the booking-detail flow today — confirmed by reading `BookingDetail.tsx` and the "Laisser un avis ★" action).
  - Message: `/messages/{conversationId}` (or `/messages?thread={id}` if the messages page uses query params — verified by reading `apps/web/src/app/messages/page.tsx` at implementation time).

### §4.4 Ordering

- Reviews are sorted by `completedAt DESC` (newest first).
- Messages are sorted by `lastMessageAt DESC` (newest first).
- The strip interleaves them with messages first (live conversations are more time-sensitive than month-old review reminders).
- Capped at **5 visible rows** total. If `reviews.length + unreadMessages.length > 5`, the 5th row is replaced by a muted summary link: `"+{n} de plus →"` (where `n = total - 4`) routing to `/bookings` (the most likely destination — review-related). The to-do rows above it follow the same interleave order (messages first, then reviews).

### §4.5 Empty + single-item

- 0 to-dos: the section is omitted entirely. No "Aucune tâche" empty state.
- 1 to-do: same composition, count pill reads `"1 tâche"`.

---

## §5. DashboardGrid — À venir + Tes prestataires

Two-section grid sitting beneath the TodoStrip. On desktop: `1.4fr / 1fr`, 14 px gap. On mobile: stacked, full-width.

### §5.1 UpcomingList — "À VENIR"

```
<section className="k-cd-section">
  <Head>
    <Label>À VENIR · {n} {n === 1 ? "RÉSERVATION" : "RÉSERVATIONS"}</Label>
    <Link href="/bookings">Tout voir →</Link>
  </Head>
  {items.map(b => <UpcomingRow key={b.id} booking={b} />)}
</section>
```

- Card shell: white, hairline border, `var(--k-r-lg)`, 14 px × 16 px padding.
- Head label in mono uppercase, link in body 11.5 px / 600 / `var(--k-text-primary)`.

#### UpcomingRow

```
<a className="k-cd-up-row" href={`/bookings/${b.id}`}>
  <DateBlock day={d} month={mAbbr} />
  <Body>
    <Title>{title}</Title>
    <Sub>{time} · {providerFirstName} · {commune}</Sub>
    <MetaChips>
      <Chip>{formatMoneyFc(price)}</Chip>
      {hasOffer && <Chip muted>Accord enregistré</Chip>}
    </MetaChips>
  </Body>
  <StatusChip variant={b.status === "PENDING" ? "pending" : "confirmed"} compact />
</a>
```

- Row layout: `auto 1fr auto`, 12 px gap, 10 px vertical padding, top divider on every row except the first.
- **DateBlock**: 44 px width, centred. Day in display font 18 px / 700 / line-height 1; month abbreviation (`MAI`, `AVR`) in mono 9.5 px / `var(--k-text-muted)` / uppercase / 3 px margin-top. For "tomorrow" the day is replaced with a 4-letter "DEM" badge in the same slot at the same size.
- **Title**: 13 px / 600 / `var(--k-text-primary)`.
- **Sub**: 11 px / `var(--k-text-muted)` / 2 px margin-top.
- **MetaChips**: small inline pills, `#F8FAFC` background, 10 px / 500, 2 px × 6 px padding, `var(--k-r-sm)`, 4 px gap. Max 2 chips: price + (when applicable) accord-enregistré. The muted variant uses lighter text (`var(--k-text-muted)`) and no border.
- **StatusChip compact**: 9.5 px font, 2 px × 6 px padding. Same colour tokens as §3.9.

#### Data shape

`upcoming` = `data.upcoming` (new field, see §7). Server-side filter: `status IN (PENDING, CONFIRMED, IN_PROGRESS) AND scheduledDate >= now`. Sorted ascending. **Excludes the booking already in the hero.** Capped at 3.

If there are 0 upcoming (after excluding the hero), the section is hidden. (This is rare — only happens if the hero already shows the only booking. The "Tes prestataires" column still renders.)

### §5.2 ProvidersList — "TES PRESTATAIRES"

```
<section className="k-cd-section">
  <Head>
    <Label>TES PRESTATAIRES</Label>
    <Link href="/dashboard/settings#favorites">Tous →</Link>
  </Head>
  {items.map(p => <ProviderRow key={p.id} provider={p} />)}
</section>
```

#### Data source — merged list

Server returns a merged list of up to 4 providers. Inclusion + ordering rules:

1. **Favorited providers** first, sorted by `favorite.createdAt DESC`.
2. Then **non-favorited providers the client has booked at least once** (completed bookings), sorted by `bookingCount DESC`. Tie-breaker: most-recent completed booking.
3. De-duplicate by `providerId` (a provider can only appear once).
4. Cap at 4.

If the client has no favorites AND no completed bookings, the section is hidden. (For Calm state this is impossible — Calm implies booking history exists.)

#### ProviderRow

```
<a className="k-cd-prov-row" href={`/providers/${p.id}`}>
  <Avatar size={36} bg={paletteFor(p.id)}>{initials}</Avatar>
  <Body>
    <Name>{firstName} {lastInitial}.</Name>
    <Meta>{profession} · {countOrStar}</Meta>
  </Body>
  <CTA onClick={(e) => { e.preventDefault(); routeToServices(p.id); }}>Réserver →</CTA>
</a>
```

- Row: 9 px vertical padding, top divider on every row except first.
- **Avatar**: 36 px circle, deterministic colour from existing avatar palette (no new randomness — reuse `paletteFor(id)` helper if it exists in `lib/avatar.ts`, otherwise add a small one based on a hash of the providerId).
- **Name**: 12.5 px / 600 / `var(--k-text-primary)`.
- **Meta**: 10.5 px / `var(--k-text-muted)`. Format = `"{profession} · {countOrStar}"`. `countOrStar` rules:
  - Favorited: leading `★ ` + `"{n} fois"` if `n > 0`, else just `★ favori`.
  - Not favorited: `"{n} fois"`.
- **CTA**: 11 px / 600 / `var(--k-text-primary)`. No background, no border — plain text link aligned right. On hover, underline. Click navigates to `/services?provider={id}` (preserving today's "rebook" route from `FavoriteList`).

#### Mobile layout

On mobile the ProvidersList swaps from a vertical list to a **horizontal scroll** of cards. Each card 140 px min-width, contains avatar + name + meta + a full-width "Réserver →" button. Same data. Matches the v2 mockup. The horizontal scroll uses `overflow-x: auto`, negative horizontal margin to bleed to the screen edge (`margin: 0 -16px; padding: 0 16px;`), and CSS scroll-snap (`scroll-snap-type: x mandatory; scroll-snap-align: start`).

---

## §6. ActivityList — "ACTIVITÉ RÉCENTE"

A compact list of the last 3 completed bookings. Full-width section below the grid. Padding-top 14 px (mobile) / 18 px (desktop) of margin from the grid above.

```
<section className="k-cd-section">
  <Head>
    <Label>ACTIVITÉ RÉCENTE</Label>
    <Link href="/bookings">Historique →</Link>
  </Head>
  {items.map(b => <ActivityRow key={b.id} booking={b} />)}
</section>
```

### ActivityRow

Row layout: `1fr auto auto auto`, 12 px gap, 9 px vertical padding, top divider on every row except first.

```
<a className="k-cd-act-row" href={`/bookings/${b.id}`}>
  <Title>{title} · {providerFirstName}</Title>
  <Date>{dateMono}</Date>
  <Price>{formatMoneyFc(price)}</Price>
  {b.hasReview ? <Rating value={b.reviewScore} /> : <ToRate />}
</a>
```

- **Title**: 12 px / 500 / `var(--k-text-primary)`. Joins category + provider first name.
- **Date**: 10.5 px / mono / `var(--k-text-muted)`. Format `"{D} {MMM}"` uppercase (e.g. `"9 MAI"`).
- **Price**: 11.5 px / 600 / display font / `var(--k-text-primary)`.
- **Rating** (when reviewed): 10.5 px / `var(--k-text-muted)` / 5 stars in `★★★★★` rendered with Lucide `I.star` filled to `b.reviewScore` (1-5).
- **ToRate** (when not reviewed): 10.5 px / 600 / `#92400E` text on `#FEF3C7` pill, `var(--k-r-sm)`, 2 px × 6 px padding. Copy: `"À NOTER ★"`. Tap → same row link (`/bookings/{id}`).

### Data shape

`completed` = last 3 bookings where `status === "COMPLETED"`, sorted by `completedAt DESC`. Each row carries `hasReview: boolean` and (when reviewed) `reviewScore: 1-5`.

If the client has no completed bookings, the section is hidden. The Empty hero variant already implies this.

---

## §7. Backend changes

`getClientDashboard` returns more data. No new endpoints, no new modules, no breaking changes to existing callers (the response is additive).

### §7.1 New fields on `ClientDashboardResponse`

```ts
type ClientDashboardResponse = {
  success: true;
  user: { firstName: string; lastName: string };
  // existing — kept:
  stats: { totalBookings; completedBookings; pendingBookings; favoritesCount; reviewsCount };  // legacy, not consumed by the new dashboard but kept for backward-compat
  recentBookings: ClientDashboardBooking[];                                                     // legacy, not consumed by the new dashboard
  favoriteProviders: ClientDashboardFavorite[];                                                 // legacy, not consumed by the new dashboard
  notifications: ClientDashboardNotification[];                                                 // legacy

  // new:
  upcoming: ClientDashboardUpcomingBooking[];        // status in (PENDING, CONFIRMED, IN_PROGRESS), scheduledDate >= now, sorted asc, max 5
  completed: ClientDashboardCompletedBooking[];       // status = COMPLETED, sorted by completedAt desc, max 5, each carries hasReview + reviewScore
  providers: ClientDashboardProviderRow[];           // merged favorites + most-booked, max 4
  todos: {
    reviews: ClientDashboardReviewTodo[];            // completed bookings without a Review, sorted desc by completedAt
    unreadMessages: ClientDashboardMessageTodo[];     // conversations where unreadCount > 0 and last message inbound, sorted desc by lastMessageAt
  };
  hasAnyBookingEver: boolean;                        // for the empty/calm distinction
};
```

The legacy fields (`stats`, `recentBookings`, `favoriteProviders`, `notifications`) **stay** for now so other callers don't break. The new dashboard page reads only the new fields. A follow-up can prune the legacy fields after auditing callers.

### §7.2 New row shapes

```ts
type ClientDashboardUpcomingBooking = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS";
  title: string;
  scheduledDate: string;     // ISO
  durationMinutes: number | null;
  price: number;              // FC
  hasOffer: boolean;
  commune: string | null;
  ref: string;                // existing booking ref / shortcode
  provider: { id: string; firstName: string; lastName: string; profession: string; rating: number; verified: boolean };
};

type ClientDashboardCompletedBooking = {
  id: string;
  title: string;
  completedAt: string;        // ISO
  price: number;
  provider: { id: string; firstName: string; lastName: string };
  hasReview: boolean;
  reviewScore: number | null; // 1-5 when hasReview, else null
};

type ClientDashboardProviderRow = {
  id: string;
  firstName: string;
  lastName: string;
  profession: string;
  avatar: string | null;
  rating: number;
  verified: boolean;
  isFavorite: boolean;
  bookingCount: number;       // completed bookings between this client and this provider
};

type ClientDashboardReviewTodo = {
  bookingId: string;
  title: string;
  completedAt: string;
  price: number;
  provider: { firstName: string };
};

type ClientDashboardMessageTodo = {
  conversationId: string;
  unreadCount: number;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  provider: { id: string; firstName: string; lastName: string };
};
```

### §7.3 Service work

In `dashboard.service.ts`, `getClientDashboard` gains these parallel queries:

1. **`upcoming`** — replace the existing `recentBookings` query (orderBy `createdAt desc`) with a separate query: `findMany({ where: { clientId, status: { in: ["PENDING","CONFIRMED","IN_PROGRESS"] }, scheduledDate: { gte: now } }, orderBy: { scheduledDate: "asc" }, take: 5, include: clientBookingsInclude })`. Map each through a new `mapUpcomingBooking` that also sets `hasOffer` based on whether `booking.finalOffer` is non-null (the Prisma include already pulls it).
2. **`completed`** — `findMany({ where: { clientId, status: "COMPLETED" }, orderBy: { completedAt: "desc" }, take: 5, include: clientBookingsInclude })`. For each, separately fetch (in a single batched `review.findMany({ where: { bookingId: { in: completedIds }, clientId: actor.id } })`) and map by `bookingId` to fill `hasReview` and `reviewScore`.
3. **`providers`** — a single Prisma query:
   ```ts
   const favoriteRows = await prisma.favorite.findMany({ where: { userId: actor.id }, include: providerIncludeForRow });
   const bookedCounts = await prisma.booking.groupBy({
     by: ["providerId"],
     where: { clientId: actor.id, status: "COMPLETED" },
     _count: { providerId: true },
     orderBy: { _count: { providerId: "desc" } },
     take: 8,
   });
   ```
   Then merge in service code: favorites first (sorted by `createdAt desc`), then `bookedCounts` items where the provider is not already in the list, sorted by `_count.providerId desc`. Cap at 4. Hydrate provider data (firstName, profession, rating, verified) from one additional `provider.findMany({ where: { id: { in: providerIds } } })` call.
4. **`todos.reviews`** — `findMany({ where: { clientId, status: "COMPLETED" }, orderBy: { completedAt: "desc" }, take: 10, select: { id, title, completedAt, price, provider: { firstName } } })`. Then `review.findMany({ where: { bookingId: { in: ids }, clientId: actor.id }, select: { bookingId } })`. Filter out bookings that already have a review. Cap the result at 5.
5. **`todos.unreadMessages`** — `conversation.findMany({ where: { participants: { some: { userId: actor.id } } }, include: { messages: { take: 1, orderBy: { createdAt: "desc" } }, _count: { select: { messages: { where: { readAt: null, senderId: { not: actor.id } } } } } }, orderBy: { lastMessageAt: "desc" }, take: 10 })`. Map to `ClientDashboardMessageTodo` keeping only those with `_count.messages > 0` and the last message's `senderId !== actor.id`. Cap at 5.
   - **Verify at implementation time**: `Conversation`'s exact schema (`participants`, `messages.readAt`, `senderId`) may differ. The existing messaging service in `messaging.service.ts` already does the same kind of read at line 251-331; reuse that query shape.
6. **`hasAnyBookingEver`** — `prisma.booking.count({ where: { clientId: actor.id } }) > 0`. Could derive from `stats.totalBookings > 0` but adding it explicitly avoids the consumer needing to read the legacy stats payload.

All six queries run inside the existing `Promise.all` — no extra round-trips beyond what the new data requires.

### §7.4 DTO / shared schemas

In `packages/schemas/src/dto.ts` (Zod), add the new response shapes. They're **additive** to the existing `clientDashboardSchema` — new fields, no removals. The `@kayu/api` typed client (`packages/api/src/endpoints.ts`) regenerates its types from the DTO and the web client picks them up automatically.

Field names must match the TypeScript shape above 1:1 so the client can consume them without remapping.

### §7.5 Tests

Follow the existing pattern in `apps/backend/src/modules/dashboard/dashboard.service.spec.ts` (hand-rolled Prisma fakes + `node:test`). Add `dashboard.service.client.spec.ts` (or extend the existing file) with at least these cases:

1. Brand new client (no bookings) → `hasAnyBookingEver: false`, `upcoming: []`, `completed: []`, `providers: []`, `todos: { reviews: [], unreadMessages: [] }`.
2. Client with 1 PENDING upcoming → `upcoming` has 1 row with status PENDING and `hasOffer: false`.
3. Client with 1 CONFIRMED upcoming that has a FinalOffer → `upcoming[0].hasOffer: true`.
4. Client with 4 completed bookings, 2 reviewed → `completed` returns all 4, with `hasReview: true` on the 2 reviewed; `todos.reviews` returns the 2 unreviewed.
5. Client with 1 favorite + 2 booked-not-favorited providers → `providers` returns 3 rows with `isFavorite: true` first, then by `bookingCount desc`.
6. Client with 1 conversation containing 3 unread inbound messages → `todos.unreadMessages` returns 1 row with `unreadCount: 3` and the last preview.
7. Client whose only "unread" conversation had the last message outbound (sent by them) → `todos.unreadMessages` is empty.
8. ForbiddenException when actor.role !== "CLIENT".

---

## §8. Loading + error states

### §8.1 Skeleton

The page-level skeleton mirrors the section structure 1:1 so the layout never jumps:

- Greeting: one `Skeleton h-7 w-64`, one `Skeleton h-4 w-48`.
- Hero: a full-width skeleton matching the hero card (ribbon row + tall headline line + sub line + a 36 px tall avatar-row strip + two button-shaped pills).
- TodoStrip: 2 rows of skeleton (head + 2 todo rows). Always rendered while loading — once loaded, it hides if there are no todos.
- DashboardGrid: two side-by-side skeleton cards. Each has a head row + 3 child rows.
- ActivityList: head row + 3 child rows.

Skeleton atoms reuse the existing `<Skeleton />` component (`apps/web/src/components/ui/skeleton.tsx`).

### §8.2 Error state

If the dashboard query errors, the page replaces all section content with a single centred block:

```
<div className="k-cd-error">
  <I.alertCircle />
  <h2>Impossible de charger ton tableau de bord.</h2>
  <p>Vérifie ta connexion et réessaie.</p>
  <button className="k-btn k-btn-primary" onClick={() => refetch()}>Réessayer</button>
</div>
```

- Container: white card with hairline border, centered text, 32 px padding, 16 px vertical gap.
- Icon: `I.alertCircle` at 36 px, `var(--k-text-muted)` (not red — the page-level failure is not destructive).
- The Greeting remains rendered above the error block (the user's first name + a generic "Tableau de bord" line so we don't lose orientation).

### §8.3 Auth guard

The page-level `useQuery` is gated on `!!user`. If `user` is null while `isLoading: false`, redirect to `/` (the existing dashboard layout's redirect already covers this, but the page guards explicitly to prevent flicker).

---

## §9. Mobile vs desktop

| | Mobile (< 768) | Desktop (≥ 768) |
|---|---|---|
| Layout | Single column | Hero full-width; DashboardGrid as 1.4fr/1fr; ActivityList full-width |
| Outer padding | 12px 16px 32px | 20px 24px 40px |
| Hero headline | 22 px | 28 px (all variants share one size pair) |
| Hero price | Inlined into Sub | Right-aligned `PriceBlock` (2-col hero-row) |
| TodoStrip | Same composition, slightly tighter padding (10 px) | 11 px padding |
| UpcomingList | Same composition | Same composition (rows are already compact) |
| ProvidersList | Horizontal scroll of 140 px cards | Vertical list |
| ActivityList | Same composition; price formatted as "25k" instead of "25 000 FC" to fit | Full "25 000 FC" |
| Sticky elements | None on the dashboard page itself; AppShell's bottom tab bar stays present | None |

The dashboard does **not** introduce its own sticky bar. The AppShell already provides navigation; the dashboard's job is to make every row tappable.

---

## §10. Tokens, atoms, file map

### New components

All in `apps/web/src/components/dashboard/client/` (new subfolder — keeps the redesign isolated from the existing `components/dashboard/*` modules that the provider dashboard still uses):

| Component | Purpose |
|---|---|
| `Greeting.tsx` | Salutation + summary line. Receives `firstName`, `summaryLine`. |
| `DashboardHero.tsx` | State-aware hero. Receives the whole `ClientDashboardData`, dispatches internally to the right variant. |
| `HeroStatusChip.tsx` | StatusChip atom with all 5 variants. Re-used by inline cards if needed. |
| `CalmProviderPills.tsx` | Horizontal pill list for the Calm variant. Receives `providers: ProviderRow[]`. |
| `CategoryTilesRow.tsx` | 4-tile category grid for the Empty variant. Receives `categories`. |
| `TodoStrip.tsx` | "À FAIRE" card. Receives interleaved `todos` (review + message rows). |
| `TodoRow.tsx` | Single row. Receives `kind: "review" \| "message"` + payload. |
| `UpcomingList.tsx` | "À VENIR" section. |
| `UpcomingRow.tsx` | Single row in `UpcomingList`. |
| `ProvidersList.tsx` | "TES PRESTATAIRES" section. Owns the mobile/desktop layout swap. |
| `ProviderRow.tsx` + `ProviderCard.tsx` | Vertical row (desktop) + horizontal card (mobile). |
| `ActivityList.tsx` | "ACTIVITÉ RÉCENTE" section. |
| `ActivityRow.tsx` | Single row in `ActivityList`. |
| `DashboardSkeleton.tsx` | Replaces the existing inline `DashboardSkeleton` in `page.tsx`. |

### Reused

- `Skeleton` from `components/ui/skeleton`.
- `I` icon registry from `@kayu/ui/web`. Icons used: `I.star`, `I.messageCircle`, `I.badgeCheck`, `I.clock`, `I.arrowRight`, `I.alertCircle`, `I.mapPin` (not needed here, listed for clarity). No new icons added.
- `formatMoneyFc` from `@kayu/ui`.
- `formatWhen`, `formatRelativeFR` from `lib/booking-v2.ts`.
- `useAuth`, `apiClient`, `dashboardApi`, `queryKeys` — unchanged.

### Removed / superseded (from the existing dashboard page)

- `DashboardStats` import and usage — replaced by the hero + sections.
- `QuickActions` import and usage — sidebar already covers these.
- `BookingCard` (the dashboard variant) — replaced by `UpcomingRow`.
- `NotificationList` (the dashboard panel) — notifications now live in their own page; the dashboard surfaces them only as `todos.unreadMessages` for messaging and via the `hasOffer` info strip for accord events. **Other notification types (status changes, etc.) are not surfaced** — clients see them in `/notifications` or in the booking-detail page.
- `FavoriteList` — replaced by `ProvidersList`.

These components stay in `components/dashboard/*` because the provider dashboard still uses them. We only stop importing them in `dashboard/client/page.tsx`.

### CSS class prefix

All new atoms use the `k-cd-*` prefix (client-dashboard) to stay clear of `k-bd-*` (booking-details), `k-bk-*` (booking flow), `k-pd-*` (provider details).

### Tokens used

- Colors: `--k-surface`, `--k-surface-muted`, `--k-border`, `--k-border-subtle`, `--k-text-primary`, `--k-text-body`, `--k-text-muted`, `--k-text-subtle`, `--k-success`, `--k-success-subtle`, `--k-warning`, `--k-warning-subtle`.
- Radii: `--k-r-sm`, `--k-r-md`, `--k-r-lg`, `--k-r-pill`.
- Font: `--k-font-mono`. Display font is loaded globally via the existing typography setup; no new font imports.

---

## §11. State × component matrix

The state of the page derives from `(hasAnyBookingEver, upcoming, completed, providers, todos)` and selects the hero variant + which sections render.

| Hero variant | Greeting summary | TodoStrip | UpcomingList | ProvidersList | ActivityList |
|---|---|---|---|---|---|
| `in_progress` | "{date} · {n} à venir" | render if any | render (excluding hero booking) | render if non-empty | render if any completed |
| `upcoming_confirmed` | "{date} · {n} à venir" | render if any | render (excluding hero booking) | render if non-empty | render if any completed |
| `upcoming_pending` | "{date} · {n} à venir" | render if any | render (excluding hero booking) | render if non-empty | render if any completed |
| `calm` | "Aucune réservation active · dernière mission il y a {relative}" | render if any | hidden (no upcoming) | render if non-empty | render |
| `empty` | "Bienvenue sur KAYOU" | hidden | hidden | hidden | hidden |

---

## §12. Edge cases

- **Stale hero booking**: the hero's IN_PROGRESS booking might have been completed between the dashboard fetch and the user's view. The hero CTA still routes to `/bookings/{id}` which will render the post-completion state correctly. No special handling.
- **Booking with no provider data** (corrupt FK): hero falls back to "—" name, hides the avatar fallback initials, and hides the message button. Matches `BookingHero.tsx` behavior.
- **Provider in `providers` list has no `firstName`** (corrupt data): fall back to `"Prestataire"`. Avatar initials use `"?"`. CTA stays.
- **Reviewed booking but no `reviewScore`** (data corruption): treat as unreviewed (`hasReview = false`) and surface the "À NOTER ★" pill. Defensive — should never happen.
- **`scheduledDate` missing on an upcoming booking** (data issue): exclude from `upcoming`. The hero falls back to the next valid one.
- **Conversation without `lastMessage`** (empty thread): skip — these don't generate to-dos.
- **Conversation where `_count.messages` is non-zero but all unread messages were sent by the client**: skip. Filtering is `senderId !== actor.id`.
- **More than 5 review-to-dos**: list shows 5, no overflow link in v1 (no good destination). Acceptable — every completed booking ages out of "actionable" eventually.
- **Calm state with 0 providers in the merged list**: hide ProvidersList; show the primary CTA in the hero ("Réserver un nouveau service →") as the only path forward. Theoretically impossible (Calm means history exists, which means at least one provider), but defended for robustness.
- **react-query cache**: a single key `queryKeys.dashboard.client` covers everything. Refetched on window focus (existing default) and on mutation success in other parts of the app (no new invalidation work — same key as today).

---

## §13. Acceptance criteria

1. New client (no bookings) → empty hero with welcome chip + 4 category tiles + discover CTA. Other sections hidden.
2. Client whose only upcoming booking is PENDING → `upcoming_pending` hero with amber chip + "{firstName} n'a pas encore confirmé." info strip. À venir hidden (the only booking is in the hero).
3. Client with 1 IN_PROGRESS booking → `in_progress` hero with pulsing green chip "EN COURS · {time}".
4. Client with 3 upcoming bookings, soonest is CONFIRMED tomorrow with an offer → `upcoming_confirmed` hero with "CONFIRMÉE · DEMAIN" chip + "Accord enregistré · espèces à la fin de la mission." info strip. À venir lists the other 2.
5. Client with 0 upcoming, 5 completed historical → `calm` hero with neutral "AUCUNE RÉSERVATION ACTIVE" chip + 3 provider pills + primary CTA to `/`. ActivityList shows 3 most-recent completed.
6. Client with 2 completed bookings, neither reviewed → TodoStrip renders 2 review rows. ActivityList shows both with the "À NOTER ★" pill.
7. Client with 1 conversation containing 3 unread inbound messages → TodoStrip renders 1 message row at the top with preview snippet.
8. Client with 2 favorited providers + 3 booked-not-favorited → ProvidersList shows 4 rows: 2 favorites first (★ in meta), then 2 most-booked.
9. Mobile 375 px and desktop 1280 px viewports render without horizontal overflow.
10. No gradients anywhere (visual sweep / DOM grep for `gradient`).
11. Hero state transitions correctly when the dashboard query refetches mid-session (e.g. after a booking is created elsewhere in the app).
12. Skeleton matches the loaded layout 1:1 — no layout shift between loading and loaded states.

---

## §14. Out-of-scope follow-ups

- Realtime updates via websockets / supabase channels for live message + booking-status changes.
- Push / SMS reminders when a hero booking is < 1 h away.
- A separate "rebook" suggestion engine for recurring services (ménage hebdomadaire, etc.).
- Spending insights ("Tu as dépensé X FC ce mois") — could earn its place later but not in v1.
- Pruning the legacy `stats`, `recentBookings`, `favoriteProviders`, `notifications` fields from the dashboard response after auditing other callers.
- Mobile (Expo) implementation — separate spec when the Expo app catches up.
- Removing the existing `DashboardStats`, `QuickActions`, `FavoriteList`, `BookingCard` (dashboard) components after the provider dashboard is also redesigned. For now they stay.
- A configurable "what to surface" preference (e.g. let the user hide ActivityList). Not needed v1.

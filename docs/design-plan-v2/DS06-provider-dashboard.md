# DS06 — Provider Dashboard

## Goal

Ship the pro's home screen: greeting header with avatar + trust chip + rating, availability toggle, 4-stat card row with sparklines (revenue, missions, response rate, rating), 2-column body with today's schedule on the left and new requests on the right. Mobile compacts to a vertical stack.

## Why it matters

ProviderDashboard is where a pro spends most of their session time. It's the home screen of the pro app. Without it the pro tab in the mobile bottom nav has nothing to show, and the web `/pro` route 404s.

## Scope

### In scope
- `ProviderDashboard` component with web + mobile variants
- 4 `StatCard` tiles with `Sparkline` SVG mini-trend
- `JobCard` for today's schedule (time | body | fee+CTA on web)
- `RequestCard` for new inbound requests (avatar + client + match% + urgency + "Envoyer un devis" → DS07)
- Availability toggle (green dot + label + switch)
- Greeting header with avatar, trust chip, rating, "Créer un devis" primary CTA (web) / inbox bell button (mobile)
- Web route `/pro`; mobile screen `ProviderDashboardScreen`
- `StatCard` + `Sparkline` promoted to `@kayu/ui` (used again in Earnings DS08)

### Out of scope
- The full requests list view (DS07 owns that)
- Calendar view (deferred; the "Calendrier" button is a TODO link)
- Earnings details (DS08)
- Onboarding prompts for unverified pros (DS09)

## Reference files
- `prototype/components/ProviderDashboard.jsx` — 372 lines
  - `PRO_ME`, `TODAY_JOBS`, `NEW_REQUESTS`, `STATS` mock data
  - `StatusPill` (job status chip — confirmed / en_route / completed)
  - `JobCard` (today's schedule row)
  - `RequestCard` (inbound request card)
  - `Sparkline` (100×30 SVG polyline)
  - `StatCard` (label + big value + delta + mini sparkline)

## Layout

### Web

```
┌──────────────────────────────────────────────────────────┐
│ [Avatar 64] Bonjour, Jean Mubake                          │
│             [EXPERT] ⭐4.9 (127) · 284 missions           │
│                                      [Calendrier][Créer un devis] │
├──────────────────────────────────────────────────────────┤
│ [availability bar — success-subtle, full-width]           │
│ 🟢 Disponible aujourd'hui · reçoit des demandes           │
│    Tu apparais dans les résultats · zone: Kinshasa 10 km  │
│                                    [Modifier zone] [toggle] │
├──────────────────────────────────────────────────────────┤
│ [StatCard × 4]                                            │
│ Revenus / Missions / Taux réponse / Note moyenne          │
├──────────────────────────────────────────────────────────┤
│  PLANNING DU JOUR (1.3fr)      NOUVELLES DEMANDES (1fr)   │
│  [JobCard × 3]                  [RequestCard × 3]         │
└──────────────────────────────────────────────────────────┘
```

- Max 1280, padding 28 36 60
- Stat grid: 4 columns, 14px gap
- Two-column body: `grid: 1.3fr 1fr`, 24px gap

### Mobile

```
┌──────────────────────────────────────────┐
│ [header with Sky-subtle → Sand gradient] │
│ [Avatar 40] Bonjour  Jean 👋    [bell]   │
│                                           │
│ [Availability pill — full-width]         │
├──────────────────────────────────────────┤
│ [2-col mini stats]                       │
│   Aujourd'hui 3 missions / Recette 49k FC│
├──────────────────────────────────────────┤
│ PLANNING DU JOUR          [Calendrier →] │
│ [JobCard × 3]                            │
├──────────────────────────────────────────┤
│ NOUVELLES DEMANDES (3)                   │
│ [RequestCard × 3]                        │
├──────────────────────────────────────────┤
│ CE MOIS                                  │
│ [2×2 StatCard grid with sparklines]      │
└──────────────────────────────────────────┘
```

- 100px bottom padding (clears floating tab bar)
- Top header bg: `linear-gradient(180deg, var(--k-surface-primary) 0%, var(--k-bg) 100%)`

## StatCard

Props: `label`, `value` (string), `sub` (delta string like "+15%" or "Excellent"), `trend` (1 for up, -1 for down, null for no sparkline), `mobile`

- Surface bg, 1px Slate-200 border, radius 12, padding 14/18, `elev.e1`
- Overline label at top
- Bottom row: value (Display 22/26, 700, -0.02em tracking, tabular nums) + delta pill (inline-flex, small up/down svg, sub copy, weight 600, Emerald if up / Rose if down) + `<Sparkline up={trend > 0}/>` right-aligned

## Sparkline

100×30 SVG polyline, 2px stroke, rounded caps, no fill. Two built-in variants (up / down) — just toggling stroke color and point path. Not an interactive chart — decorative trend indicator.

## JobCard

Grid: `60px | 1fr | auto` (web) or `auto | 1fr` (mobile, no fee column)

- Time block (60px, center-aligned, 1px right border): big display-700 time + duration caption
- Body: kind (Display 15) + status pill + client mini (22px Avatar + name + "·" + address + "· {distance} km" caption)
- Fee block (web only): mono price + "Détails →" primary-sm button

`StatusPill` 3 states: `confirmed` (success chip), `en_route` (warning chip + clock icon), `completed` (neutral chip)

Hover on web: -1 translateY + bump to elev.e2.

## RequestCard

- Surface bg, 1px border (Rose-200 if urgent else Slate-200), radius 12, `elev.e1`, padding 14/18, relative
- "Urgent" badge absolute top -8 left 14 — Rose-primary bg, white text, 10px weight 700 letter-spacing 0.06 uppercase
- Row 1: 36px Avatar + client name + "received / distance" caption + Match% on right (small overline + big mono success color)
- Row 2: service Display 15 600
- Row 3: message preview (2-line clamp, 14.5 Body-M, italic quotes)
- Row 4: chip cloud — calendar chip "{when}", mapPin chip "{address}"
- Row 5: 2-button row — "Décliner" secondary-sm (flex 1) + "Envoyer un devis →" primary-sm (flex 2)

Tapping "Envoyer un devis" → `nav("quote", requestId)`.

## Availability bar

### Web
- 14 20 padding, radius 12, success-subtle bg, 1px `#A7F3D0` border
- Row: 12×12 pulsing green dot (shadow `0 0 0 4px rgba(16,185,129,0.25)`) + text "Disponible aujourd'hui · reçoit des demandes" (600 `#065F46`) + caption under (`#047857`) + "Modifier zone" secondary-sm + 44×26 toggle

### Mobile
- Compact pill style: white bg, radius 999, 1px Slate-200 border, 10 14 padding
- Row: 10×10 dot + "Disponible aujourd'hui" + toggle right

Toggle is a placeholder switch (static visual, no backend wiring yet).

## Role-aware routing

Web `/pro` is accessible only when `user.role === "PROVIDER"`. Middleware or server-side check: if CLIENT, redirect to `/` with a toast "Accès réservé aux pros". If PROVIDER but not verified, show an onboarding banner at top of dashboard linking to `/pro/onboarding` (TODO — DS09 refines this).

## StatCard promoted to `@kayu/ui`

Create `packages/ui/src/{web,mobile}/StatCard.tsx` with the signature above. Used here and in Earnings (DS08). Don't build it locally in this chunk and move later — build it in the right place from the start.

Similarly `Sparkline` lives in `@kayu/ui`.

`JobCard` and `RequestCard` stay local to the dashboard (DS06) — they're only used here.

## Dependencies
- Depends on DS01 (icons + role-aware tab bar)
- Blocks: DS07 (RequestCard's "Envoyer un devis" needs QuoteCompose to exist)

## Acceptance criteria

1. Web `/pro` renders the dashboard only for PROVIDER role (CLIENT gets redirected)
2. Mobile ProviderDashboard is the `provider` tab's root screen when role === "PROVIDER"
3. 4 `StatCard` tiles show correct values from mocked data (desktop) or backend (prod)
4. Sparklines render without jank on scroll
5. Availability toggle is visually present and responsive (even if not wired to backend)
6. JobCard "Détails →" navigates to BookingDetail (pro perspective)
7. RequestCard "Envoyer un devis" → QuoteCompose with correct requestId
8. `StatCard` + `Sparkline` exported from `@kayu/ui` and re-used in DS08

## QA checklist
- [ ] Greeting uses `user.firstName`; fallback to "Pro" if missing
- [ ] TrustChip renders correctly (EXPERT badge in v1 `@kayu/ui`)
- [ ] Stat cards show tabular numerals (no digit jitter)
- [ ] Sparkline colors are Emerald (up) / Rose (down), same as delta pill colors
- [ ] JobCard time block uses Display font weight 700, 19px
- [ ] RequestCard urgent badge is absolute and doesn't overlap parent border on render
- [ ] Mobile mini stats grid (1×2) shows correct labels + values — "Aujourd'hui" with mission count, "Recette prévue" with FC amount
- [ ] Availability pulsing dot respects reduced-motion (fall back to solid)
- [ ] "Créer un devis" primary CTA (web) → `nav("quote")` with no requestId (new blank quote)
- [ ] Inbox button (mobile) shows a red dot when notifications unread
- [ ] Empty states: if no `TODAY_JOBS`, show "Aucune mission aujourd'hui" caption; if no `NEW_REQUESTS`, "Pas de demande en attente"

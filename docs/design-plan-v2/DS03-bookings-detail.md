# DS03 — My Bookings + Booking Detail (client)

## Goal

Ship the client's bookings list with 4 filter tabs (À venir / En cours / Terminées / Annulées) and the unified `BookingDetail` page that works for **both** the client and the pro (different `perspective` prop, same component). Web gets routes at `/bookings` and `/bookings/[id]`; mobile gets full-screen replacements for the v1 `BookingsScreen` and `BookingDetailScreen`.

## Why it matters

MyBookings is the primary landing for returning clients (once they've booked once, it replaces Home in daily usage). BookingDetail is the pro's most-visited screen too, so making it a single unified component prevents drift.

## Scope

### In scope
- `MyBookings` screen (client list with 4 tabs, status chips, work-tile photo cards)
- `BookingDetail` screen (dual-perspective: client view vs pro view via `perspective` prop)
- Mobile: upgrade/replace existing `apps/mobile/src/screens/bookings/BookingsScreen.tsx` and `BookingDetailScreen.tsx`
- Web: new routes `/bookings` and `/bookings/[id]`
- `BookingCard` component (promote to `@kayu/ui` if not already there) — used by this chunk and the JobRequests chunk

### Out of scope
- WriteReview (DS05) — this chunk only wires the "Laisser un avis" CTA
- Real-time mission tracking — the "En route · arrivée dans ~15 min" text is static
- Chat → deep link (DS04 owns the Messages screen; this chunk just routes to it)

## Reference files
- `prototype/components/MyBookings.jsx` — list, tabs, BookingCard, BOOKINGS mock data, EmptyBookings per-tab variants
- `prototype/components/BookingDetail.jsx` — 660 lines, the entire unified detail page with Timeline, QuoteBreakdown, CounterpartyCard, ActionButtons, AddressCard, ChatPreview
- `prototype/components/JobRequests.jsx` — defines `PRO_ACTIVE_JOBS` (referenced by `BookingDetail.lookupBooking`)

## MyBookings

### Layout

**Mobile:**
```
┌──────────────────────────────────────┐
│ Mes réservations       (sticky h)    │
├──────────────────────────────────────┤
│ [À venir 1] [En cours 1] [Terminées 2] [Annulées 1]  (sticky scroll pills)
├──────────────────────────────────────┤
│ <BookingCard/>                        │
│ <BookingCard/>                        │
│ <BookingCard/>                        │
└──────────────────────────────────────┘
```

**Web:** 960px centered, H1 + subtitle, bottom-border tabs (not pills), 2-column grid of cards (`repeat(2, 1fr)`, 16px gap), empty state centered across both columns.

### BookingStatusChip — 4 states
- `upcoming`: primary chip "À venir"
- `active`: success chip with pulsing dot "En cours"
- `completed`: neutral grey chip "Terminée"
- `cancelled`: rose-subtle chip "Annulée"

### BookingCard structure

```
┌────────────────────────────────────────┐
│ 📅 Demain · 09:00          [À venir]   │  ← header row
├────────────────────────────────────────┤
│ [work tile]  Réparation fuite sous…    │  ← body
│   56×56      👤 Jean Mubake ✓          │
│              📍 Av. Kasa-Vubu, Gombe   │
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│ 🟢 En route · arrivée dans ~15 min    │  ← progress banner (active only)
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│ 15 000 FC · Estimation    Laisser un avis →  │  ← footer
└────────────────────────────────────────┘
```

- Outer: white, 1px Slate-subtle border, radius 16, padding 14 (mobile) / 18 (web), `elev.e1`
- Header row: calendar icon + `when` + `BookingStatusChip` aligned right
- Work tile: 56×56 PhotoTile with radial gradient + category icon + category accent color
- Avatar mini: 18px inline with provider name + verified badge
- Progress banner: success-subtle bg, 10px radius, map-pin icon, success color text. Shown only when `booking.progress` is set (active status)
- Footer row: divided by dashed 1px border, price on left, context action on right:
  - completed + !reviewed → "Laisser un avis →" in primary-hover
  - completed + reviewed → star icon + rating value
  - cancelled → "Par le pro" or "Par vous" caption
- Click handler: `nav("detail", b.id)` → web push, mobile push

### EmptyBookings per-tab
Each tab has its own copy + CTA (see prototype file):
- `upcoming`: "Aucune réservation à venir" / "Trouver un pro" → nav search
- `active`: "Rien en cours" / "Parcourir les catégories"
- `completed`: "Pas encore de missions terminées" / "Réserver un pro"
- `cancelled`: "Aucune annulation" / "Bon signe — tout roule." (no CTA)

Illustration: 64×64 rounded-square (radius 20), Sky-subtle bg, calendar icon (28px Sky).

## BookingDetail

### Key concept: dual perspective
`lookupBooking(id)` tries `BOOKINGS` (client list) first, then `PRO_ACTIVE_JOBS` (pro list). The resulting record has `perspective: "client" | "pro"`. Everything downstream (counterparty card, action buttons, quote breakdown) branches on that flag.

### Layout

**Mobile:**
```
┌─────────────────────────────────────┐
│ ← Réservation #B1        [À venir]   │  sticky top, blurred bg
├─────────────────────────────────────┤
│ DEMAIN · 09:00                      │  hero card
│ Réparation fuite sous évier         │
│ Estimation             15 000 FC    │
├─────────────────────────────────────┤
│ [Primary action]  [Secondary]        │
├─────────────────────────────────────┤
│ CLIENT/PRO COUNTERPARTY  🟢          │  counterparty card
│ Jean Mubake                          │
│ ⭐ 4.9 (127 avis)     📞   💬        │
├─────────────────────────────────────┤
│ [Chat preview card]                 │
├─────────────────────────────────────┤
│ SUIVI                               │  section title
│ ● Réservation créée                 │
│ ● Devis accepté                     │
│ ● En route                          │
│ ● Intervention (current)            │
│ ○ Terminée                          │
├─────────────────────────────────────┤
│ OÙ / ADRESSE CLIENT                 │
│ [address card with mini map]        │
├─────────────────────────────────────┤
│ DEVIS (Accepté)                     │
│ [quote breakdown with totals]       │
├─────────────────────────────────────┤
│ DÉTAILS                             │
│ N° réservation · #B1                │
│ Créée · Il y a 2h                   │
│ Paiement · M-Pesa ·• 4521           │
├─────────────────────────────────────┤
│ [Shield] Un problème ? Contactez KAYOU  │
└─────────────────────────────────────┘
```

**Web:** 1080px centered, `grid: 1fr 340px` main + sticky sidebar:
- Main: 4 `WebCard` sections (Suivi / Devis / Adresse / Conversation)
- Sidebar: CounterpartyCard + ActionButtons, then Détails card, then Garantie KAYOU tip

### Timeline
5 steps (`booked / confirmed / enroute / inprogress / done`) plus `paid` for completed and `cancelled` for cancelled. Each step is a 32×32 circle (done = success bg with check, current = primary bg with primary-subtle ring glow, pending = slate-100 bg with grey icon) connected by a vertical 2px line from the circle's center (success color when behind the head, grey when ahead). Current step shows a progress note below (e.g. "En cours · maintenant" or the booking's `progress` string).

### QuoteBreakdown
Grid of line items: `label / qty × unit / total` in mono, Slate-subtle dividers. Subtotal above, total below (bold 20px). **If pro perspective:** additionally show Commission KAYOU (10%) subtracted and the final "Votre payout" in primary color.

### CounterpartyCard
Avatar + role caption + name + (client view: rating + reviews; pro view: "N missions" or "Nouveau client"). Two 36×36 icon buttons on the right: phone + message.

### ActionButtons (context-aware)
- `upcoming` status:
  - Primary full-width: "Contacter le pro" (client) / "Contacter le client" (pro)
  - Secondary: "Annuler" (client) / "Se désister" (pro)
- `active` / `in_progress` status:
  - Pro: primary lg "Marquer comme terminée"
  - Both: "Message" secondary + (client) "Suivre en temps réel" secondary
- `completed` status:
  - Client + !reviewed: primary "Laisser un avis" → nav("review", providerId)
  - Client + reviewed: primary "Réserver à nouveau" → nav("profile", providerId)
  - Secondary: "Facture"

### AddressCard
Line 1: map-pin icon + full address + caption ("Adresse d'intervention" / "Adresse client")
Below: 110px mini map with gradient background + decorative SVG roads + centered pin pill showing commune + "Itinéraire ↗" button bottom-right

### ChatPreview
Single button card opening Messages: circle icon + "Conversation" title + last message snippet with ellipsis + chevron right.

### StatusChip (local)
Defined inline as `BdStatusChip` to avoid collision with MyBookings' `BookingStatusChip`. Same 6 states but slightly different labels.

## Mobile vs web differences
- Mobile uses `MobileSection` wrapper: section title (overline style) + optional subtitle + card content
- Web uses `WebCard` wrapper: section title + optional subtitle + optional count chip + content; cards are 24px-padded, 1px Slate-200 border, 20px radius
- Mobile has a top safe-area + blurred sticky header with ID + status chip
- Web has a top back-link + big H1 (service name) + right-aligned big price

## What to retire

Mobile:
- `apps/mobile/src/screens/bookings/BookingsScreen.tsx` — rewrite in place matching v2
- `apps/mobile/src/screens/bookings/BookingDetailScreen.tsx` — rewrite in place, introduce `perspective` prop

Web: no retirement; these are new routes.

## Dependencies
- Depends on DS01 (icons, routing)
- Does NOT depend on DS02 (auth can ship in parallel)
- Unblocks DS05 (WriteReview is launched from a completed booking's "Laisser un avis" CTA)

## Acceptance criteria

1. MyBookings renders 4 tabs with correct counts per tab
2. BookingCard shows work-tile photo, status chip, progress banner (active only), appropriate footer action per status
3. BookingDetail loads for any valid booking id from either list (client or pro perspective)
4. Pro perspective shows Commission KAYOU + payout in QuoteBreakdown; client does not
5. ActionButtons switch correctly across 4 status values for both perspectives
6. Mobile: tap on BookingCard opens BookingDetail; back returns to same tab with same scroll position
7. Web: `/bookings` → list; `/bookings/[id]` → detail
8. EmptyBookings renders the correct copy + CTA per tab
9. `Laisser un avis` on a completed booking → WriteReview for that booking's providerId
10. Mobile v1 BookingsScreen and BookingDetailScreen are replaced (same file paths, new content)

## QA checklist
- [ ] Pulsing green dot on "En cours" chip respects reduced-motion
- [ ] 4-tab counts are derived from data, not hardcoded
- [ ] Tab pills on mobile scroll horizontally if space is tight
- [ ] Work tile accent color matches category (plomberie = sky, coiffure = rose, etc.)
- [ ] "Laisser un avis →" on completed+!reviewed links to `/review/[providerId]`
- [ ] "Réserver à nouveau" on completed+reviewed links to `/pros/[providerId]`
- [ ] BookingDetail timeline shows "current" step pulsing (animate the primary-subtle ring)
- [ ] QuoteBreakdown totals are correct: Σ(qty × unitPrice) = subtotal; total = booking.price (explicit override) or subtotal
- [ ] Pro perspective: commission is 10% of total, payout = total − commission
- [ ] Mobile sticky header uses `backdrop-filter: blur(12px)` with `rgba(250,250,249,0.94)` background
- [ ] Web sidebar is truly sticky with `top: 24` and doesn't escape the main column
- [ ] ChatPreview opens `/messages` on click (deep-link to specific thread is nice-to-have but out of scope for DS03)
- [ ] Address mini-map is hand-drawn SVG, not a real map widget
- [ ] "Signaler un problème" button in Garantie KAYOU card is a placeholder — clicks go to a static /help page (can be a TODO link)

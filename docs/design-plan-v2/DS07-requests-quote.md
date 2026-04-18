# DS07 — Job Requests + Quote Compose (pro)

## Goal

Ship two tightly coupled pro screens: `JobRequests` (inbox of inbound requests + active jobs, with accept/decline and "Envoyer un devis" actions) and `QuoteCompose` (the devis builder with editable line items, discount %, Kayou commission breakdown, start-date radio, validity days, message to client). Together they form the quote flow.

## Why it matters

`JobRequests` is the pro's counterpart to `MyBookings` — it's where they discover and triage work. `QuoteCompose` is the conversion screen: how many quotes get sent and accepted determines a pro's income. The design specifically shows the KAYOU commission (10%) so pros understand their payout up-front.

## Scope

### In scope
- **JobRequests screen** (route `/pro/requests`, mobile screen `JobRequestsScreen`):
  - Two sections: "Nouvelles demandes" + "Mes missions actives"
  - `InboundRequestCard` with client info, service, urgency, budget, expiration, competing-pros count, photos count, match %
  - `ActiveJobRow` linking to `BookingDetail` (pro perspective)
- **QuoteCompose screen** (route `/pro/devis/new?requestId=...`, mobile screen `QuoteComposeScreen`):
  - Request-context card at top (category-tinted, shows service + when + address + client budget)
  - Line items editor (add from presets per métier, blank add, edit label/qty/unit/price, delete)
  - Discount % input (0-100)
  - Validity days selector (3 / 7 / 14 / 30)
  - Start-date radio (Today / Tomorrow / This week / Custom)
  - Free-text message to client (prefilled with name reference + service)
  - Live totals: subtotal → discount → total; commission KAYOU (10%) subtracted → **Votre payout**
  - vs Budget delta indicator (green if within, amber if over)
  - Sticky submit CTA "Envoyer le devis"
  - `QuoteSent` success state after submit
- Shared `PRESET_LINE_ITEMS` record per category (plomberie / electricite / default)

### Out of scope
- Rescheduling active jobs (BookingDetail owns that)
- Counter-offers / quote revisions
- Provider-initiated direct bookings (outside the request flow)
- Calendar picker for "Custom" start-date — placeholder date input only

## Reference files
- `prototype/components/JobRequests.jsx` — 370 lines, `INCOMING_REQUESTS`, `PRO_ACTIVE_JOBS` mock data + `InboundRequestCard`
- `prototype/components/QuoteCompose.jsx` — 722 lines, everything for the devis flow including `QuoteSent` success state

## JobRequests

### Layout

**Mobile:**
```
┌──────────────────────────────────────┐
│ Demandes                 (sticky h)  │
├──────────────────────────────────────┤
│ NOUVELLES DEMANDES (3)               │
│ [InboundRequestCard × 3]             │
├──────────────────────────────────────┤
│ MES MISSIONS ACTIVES (2)             │
│ [ActiveJobRow × 2] (grouped card)   │
└──────────────────────────────────────┘
```

**Web:**
Same two sections stacked, full width, max 1080.

### InboundRequestCard

```
┌──────────────────────────────────────┐
│ [Avatar] Marie Kabongo   ⭐4.9 · 14  │  ← client identity
│          il y a 4 min · 2.1 km  Match 94% │
│                                      │
│ Fuite sous évier cuisine             │  ← service title
│ « L'eau goutte depuis ce matin… »    │  ← msg preview (2-line clamp)
│                                      │
│ [📅 Dès que possible] [📍 Gombe] [📷 2]  │  ← chip row
│                                      │
│ Budget client      15 000 FC         │
│ ⏱ Expire dans 27 min · 3 pros voient │  ← urgency + competition
│                                      │
│ [Décliner]  [Envoyer un devis →]     │  ← 2-button row
└──────────────────────────────────────┘
```

- Surface bg, 1px border (Rose-200 if `urgent`, else Slate-200), radius 18, padding 14/18
- Client avatar 40
- "Nouveau client" chip (Accent-subtle) if `newClient`, else rating + missions count
- Match % (top right): overline + mono bold big (success color)
- Service line Display 15 600
- Preview: body-m with clamp-2, italic quotes
- Chip row: calendar + mapPin + camera (photos count); all k-chip-sm
- Meta row: "Budget client" caption + mono amount + "Expire dans {X}" warning-colored + competing caption
- 2-button row: Décliner secondary-sm (flex 1) + "Envoyer un devis →" primary-sm (flex 2)

Tapping "Envoyer un devis" → `nav("quote", request.id)`.

### ActiveJobRow

Single grouped card wrapping N rows with dividers (same pattern as v1 NearbyCard):
- 1 row per active job: avatar + service + when + client name + payout + chevron
- Tapping → `nav("detail", job.id)` (pro perspective of BookingDetail)

## QuoteCompose

### Layout

**Mobile (full-bleed):**
```
┌──────────────────────────────────────┐
│ ← Nouveau devis · Pour Marie         │ ← sticky header
├──────────────────────────────────────┤
│ [Request context card — tinted bg]   │ ← shows service + when + budget
├──────────────────────────────────────┤
│ PRESTATIONS (3)              [+ Ajouter] │
│ [LineItemRow × 3]                     │
│ [+ Ajouter depuis un modèle]          │
├──────────────────────────────────────┤
│ RÉDUCTION            [0] %            │ ← input
├──────────────────────────────────────┤
│ DÉBUT                                │
│ [Today] [Tomorrow] [This week] [Custom] │
│                                      │
│ VALIDITÉ                             │
│ [3j] [7j] [14j] [30j]                │
├──────────────────────────────────────┤
│ MESSAGE AU CLIENT                    │
│ [textarea prefilled]                 │
├──────────────────────────────────────┤
│ RÉCAPITULATIF                        │
│ Sous-total                 42 000 FC │
│ Réduction (10%)          − 4 200 FC  │
│ ────────────────────────────────     │
│ Total client              37 800 FC  │
│ (vs budget client 15 000 · +22 800)  │
│ Commission KAYOU (10%)   − 3 780 FC  │
│ Votre payout              34 020 FC  │
├──────────────────────────────────────┤
│ [sticky: Envoyer le devis →]         │
└──────────────────────────────────────┘
```

**Web (1080 centered, single column):**
Same sections, but the Récapitulatif is a sticky sidebar on the right (sticky top 24), main content on the left. Compose + preview side-by-side.

### LineItemRow

- Surface bg, 1px Slate-200 border, radius 12, padding 12
- Grid: `1fr 60px 80px 100px 24px` (web): label input | qty input | unit select | unit price input | delete button
- Mobile: stacks label on top, then `qty / unit / price / delete` in a row
- Delete: trash icon ghost button (only shown if lines.length > 1 — can't delete the last line)
- Adding lines: either blank row or from a preset picker (bottom sheet / dropdown)

### Presets

`PRESET_LINE_ITEMS` per category:
```
plomberie: [Diagnostic+déplacement 5000, Main-d'œuvre 8000/h, Remplacement joint 4500, Débouchage 12000]
electricite: [Diagnostic 5000, Main-d'œuvre 8500/h, Fourniture matériel 0]
default: [Déplacement 5000, Main-d'œuvre 7500/h, Matériel 0]
```

Pick from a presets picker → row is added with label + unit + unitPrice; qty defaults to 1.

### Totals

```
subtotal = Σ(line.qty × line.unitPrice)
discountAmt = round(subtotal × discountPct / 100)
total = subtotal − discountAmt
kayouFee = round(total × 0.10)
payout = total − kayouFee
vsBudget = total − request.budget  // signed
```

Show:
- Subtotal (plain)
- Réduction (if > 0)
- Total client (bold, ink, big)
- vs Budget delta: ≤ 0 (at or under budget): emerald "Dans le budget"; > 0 (over): amber "+X FC vs budget" pill
- Commission KAYOU 10% (muted)
- Votre payout (primary color, Display 700, biggest in breakdown)

### Request context card
- Category-tinted bg (from `PORTFOLIO_BG`)
- 1px `{accent}30` alpha border, radius 14, padding 14
- Row: 40×40 white rounded-square with category icon + column with service + date + address + budget

### Message to client
- Prefilled with:
  ```
  Bonjour {clientFirstName}, merci pour votre demande. Voici mon devis pour
  « {service} ». Je peux intervenir dès que ça vous arrange. — {proFirstName}
  ```
- Editable textarea 4 rows; placeholder if cleared

### Start-date radio
4 radio-style pill options: Today / Tomorrow / This week / Custom. Custom opens a placeholder date input (no real picker needed for DS07).

### Validity days
4 button options: 3 / 7 / 14 / 30 (days). Default 7.

### QuoteSent success state

Full-screen takeover after submit:
- Success circle (emerald glow, check icon)
- H2 "Devis envoyé !"
- Body "Marie va recevoir votre devis et a {validityDays} jours pour répondre."
- Sticky action row: "Voir mes demandes" primary + "Retour au dashboard" ghost

## Routing

Entry points to QuoteCompose:
1. ProviderDashboard RequestCard → "Envoyer un devis" → `/pro/devis/new?requestId=r1`
2. JobRequests InboundRequestCard → same
3. ProviderDashboard header "Créer un devis" CTA → `/pro/devis/new` (no requestId — blank quote)

If no `requestId`, the Request context card is hidden and the first line item is empty; the user can select any active thread to attach the quote to, or compose standalone.

## Dependencies
- Depends on DS01, DS06 (ProviderDashboard exists and has the RequestCard CTA)
- Blocks: DS11 audit

## Acceptance criteria

1. Web `/pro/requests` renders both sections (new requests + active jobs)
2. Mobile JobRequests is reachable from the "Demandes" tab (DS01 tab bar)
3. InboundRequestCard "Envoyer un devis" opens QuoteCompose with correct requestId
4. QuoteCompose with a `requestId` prefills the Request context card, message, and one sensible default line item
5. Adding / editing / removing line items updates totals live
6. Discount % updates totals live; clamped [0, 100]
7. Commission KAYOU (10%) always visible, always in muted color
8. Submit navigates to QuoteSent success state
9. Back from QuoteSent returns to JobRequests

## QA checklist
- [ ] Preset picker shows only the presets for the request's category; defaults (`default`) if no category match
- [ ] Blank line item cannot be submitted (disable Envoyer if any line has empty label)
- [ ] Totals use mono font and tabular numerals
- [ ] "Vs budget" delta sign: negative (under budget) is emerald "Dans le budget"; positive (over) is amber + signed value
- [ ] Active jobs section on JobRequests uses grouped card (one outer card, N divided rows)
- [ ] Urgent requests float to the top of the list visually (maybe sort `urgent=true` first)
- [ ] Competing-pros count ("3 pros voient") doesn't render if undefined or 0
- [ ] Expiration chip uses Amber-subtle if > 30 min left, Rose-subtle if < 30 min
- [ ] Message textarea auto-grows up to 8 rows, scrollable after
- [ ] Start-date "Custom" radio shows a date input below the radio row; the other 3 hide it
- [ ] QuoteSent includes validity days copy dynamically ("N jours pour répondre")
- [ ] Sticky submit bar on mobile doesn't overlap the tab bar (tab bar hidden on `quote` screen per DS01)
- [ ] Web sidebar recap is sticky and collapses to below the form under 900px viewport
- [ ] Decline from JobRequests doesn't navigate; it just removes the row (optimistic, TODO backend)

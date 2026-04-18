# D07 — Booking flow: web stepper + mobile full-screen sheet

## Goal

Ship the booking flow on both platforms. Web is a centered 560px 3-step column with a progress stepper. Mobile is a full-screen modal sheet with big step titles, shadowed cards (not radios), a calendar, and a sticky footer CTA that shows live price.

## Why it matters

Booking is the conversion moment. It's where friendly design earns its keep — if the user aborts at step 2, everything upstream was wasted. The sheet pattern on mobile keeps the flow full-attention (no tab bar, no page chrome) and ends in the Kayou Moment (D08).

## Scope

### In scope
- `apps/web` booking route (after migration chunk 10 this is something like `app/book/[providerId]/page.tsx`)
- `apps/mobile/src/screens/booking/BookingScreen.tsx` — full-screen sheet with 3 steps + footer CTA
- Mini calendar component used on both platforms — shared from `@kayu/ui` or duplicated per platform
- Service option cards, duration segment, time slot grid, summary card, price breakdown card, protected-payment panel
- Navigation wiring: tapping `Réserver` on profile → booking sheet. Confirming step 3 → `KayouMoment` (D08).

### Out of scope
- The Kayou Moment animation itself (D08)
- Saving bookings to the backend (migration chunk 06 — already done by the time we're here)
- Real-time availability from a calendar API — use provider-local availability from the backend

## Reference files
- `prototype/components/BookingFlow.jsx` — the whole flow:
  - Top-level `BookingFlow` function (web branch) — centered 560px column, stepper, provider mini-card, 3 steps
  - `MobileBooking` function near the bottom — full-screen sheet pattern
  - `MiniCalendar` — reusable calendar with month nav, dots for availability, selected state
  - `SumRow`, `MbSumRow`, `MbPriceRow` — tiny row components used in summary

- DESIGN_SYSTEM §9.4 (booking layout), §8.10 (full-screen sheet), §8.11 (grouped list rows for summary)

## Web booking — centered column

File: `apps/web/app/book/[providerId]/page.tsx`

Layout: `Sand bg, min-height 100%, padding 24 0 60`. Inner column 560px max-width, margin 0 auto.

### Header row
- Back IconButton (D02) → if step === 0 navigate back to profile, else decrement step
- `Réserver avec {p.firstName}` (Display-M heading)

### Stepper (visible on steps 0/1/2, hidden on 3 — Kayou Moment takes over)
3 equal columns, each:
- 4px bar top, `background: i <= step ? tokens.color.primary : tokens.color.border`, radius 2, transition background 240ms
- Caption below: `{i+1}. {label}` where `label ∈ ["Service", "Date & heure", "Confirmation"]`. Active step: weight 600, Ink. Inactive: weight 500, muted.

### Provider mini-card
- Paper card, `radius.md`, 1px Slate-200 border, padding 14
- Row: 44px Avatar + name + BadgeCheck + Caption profession + StarRating on the right

### Step 0 — Service
- Heading `Quel service ?`
- Radio-label cards (4):
  - Paper, `radius.md`, 1px Slate-200 border, padding 16, cursor pointer
  - Active: Sky-primary border + `box-shadow: 0 0 0 3px rgba(14,165,233,0.12)`
  - Radio input + service label + (if active) check icon 18px Sky-primary
- Options: `Dépannage urgent`, `Installation nouvelle`, `Devis / diagnostic`, `Rénovation complète`
- Duration segment:
  - Overline "Durée estimée"
  - 4 buttons (1h / 2h / 4h / 8h): flex:1, 44px height, radius.md
  - Active: Sky-subtle bg + Sky-hover text + Sky-primary border
  - Inactive: Paper + Slate-200 border + body text
- Textarea `Décris ton besoin`: 3 rows, 12px padding, Slate-200 border, radius.md, resize vertical
- Primary lg "Continuer →" (full width, margin-top 24)

### Step 1 — Date & heure
- Heading `Quand ?`
- `<MiniCalendar selected={date} onSelect={setDate}/>`:
  - Paper card, radius.md, padding 16, 12px top-margin
  - Header row: back IconButton + month name (Display 600 16px) + forward IconButton
  - 7-column days row (L M M J V S D) as Caption, centered
  - 7×5 grid of day buttons:
    - Invalid (not in month): opacity 0, no content
    - Past days: Slate-subtle text, no cursor
    - Available days: Ink text, green dot at the bottom-center (3×3, Emerald, 6px from bottom)
    - Selected day: Sky-primary bg, white text, weight 700
- Overline "Créneaux disponibles" + 4-col grid of time buttons (`08:00 / 10:00 / 14:00 / 16:00 / 18:00`):
  - 42px height, radius.md, font-mono, Slate-200 border
  - Active: Sky-subtle bg + Sky-hover text + Sky-primary border
- Overline "Adresse d'intervention" + `<Input/>` (D02)
- Primary lg "Continuer →"

### Step 2 — Confirmation
- Heading `Récapitulatif`
- Summary card (Paper, radius.md, 18 padding, 12 top-margin):
  - `<SumRow label="Service" value={service}/>`
  - `<SumRow label="Durée estimée" value={duration + "h"}/>`
  - `<SumRow label="Date" value={`Mer. ${date} avril · ${time}`}/>`
  - `<SumRow label="Adresse" value={address} multiline/>`
  - `<SumRow label="Note" value={note} multiline last/>`
  - Each row: 12px vertical padding, 140px / 1fr grid, 1px Slate-100 divider except last
- Totals card (Sky-subtle bg, 1px `#BAE6FD` border, radius.md, 18 padding, 14 top-margin):
  - Line 1: `{hourly.toLocaleString("fr-FR")} FC × {duration}h` (Slate-700) + price in mono aligned right
  - Line 2: `Frais de service` + 7% of total in mono, muted
  - 1px `#BAE6FD` horizontal divider
  - Line 3: "Total estimé" (Heading weight) + total × 1.07 in mono 22px Sky-hover
  - Caption row: `[ShieldCheck]` + "Paiement à la fin du travail · remboursement garanti"
- Primary lg "Confirmer la réservation" (full width, 18 top-margin)
- Caption row centered: "En confirmant, tu acceptes les [conditions générales]."

Confirming → `step = 3` → `KayouMoment` screen (D08).

## Mobile booking — full-screen sheet

Screen: `apps/mobile/src/screens/booking/BookingScreen.tsx`

Full-screen overlay. The tab bar is hidden (D05's navigator config handles this). Layout: flex column, `background: Sand, minHeight: 100%`.

### Sheet header
Sticky top, zIndex 10, Sand bg, padding 12 16 10, 1px `borderSubtle` bottom border:
- Row (space-between):
  - Close/back: if step 0, show `X` icon (dismissing); else show `ArrowLeft` (back within flow). Uses `mbSheetIconBtn` style (36×36 Paper round, `elev.e1`)
  - Right: mono Caption "Étape {step+1} sur 3" in Slate-500
  - Empty 36px spacer on right for visual balance
- Progress bar row (12 top-margin): 3 equal 3px-tall bars, gap 4, transitions 280ms standard:
  - Filled bars: `background: tokens.color.textPrimary` (Ink)
  - Empty: `background: tokens.color.border`

### Content body
Flex 1, padding 22 20 140 (140 bottom for the sticky footer clearance):

**Provider mini-card** (always shown):
- Paper, `radius.lg` (16), `elev.e2`, no border, padding 12 14, 22 bottom-margin
- Avatar 42 + name + BadgeCheck + Caption profession + `Star + rating` right

**Big step title**: 28px Display 700, letter-spacing -0.02em, 22 bottom-margin. Copy:
- Step 0: `Quel service ?`
- Step 1: `Quand ça t'arrange ?`
- Step 2: `Récapitulatif`

### Step 0 — Service (mobile)
- 4 option cards (not radios — full tap-target shadowed cards):
  - Paper, `radius.lg`, padding 16, flex align-center gap 14, `elev.e1` by default
  - Active state: `box-shadow: 0 0 0 2px {portfolio.accent}, 0 8px 20px -8px rgba(15,23,42,0.12)`
  - Content: 44×44 rounded square (radius 12) with `{portfolio.accent}18` bg (or Slate-100 when inactive) + category icon (Sky/accent on active, Slate-700 on inactive) → then flex-1 column: option name (Display 15px 600) + Caption desc
  - Check icon at right when active
- Options (with icons + descriptions):
  - `Dépannage urgent` (zap, "Problème immédiat")
  - `Installation nouvelle` (wrench, "Nouveau matériel")
  - `Devis / diagnostic` (sparkles, "Évaluation gratuite")
  - `Rénovation complète` (hammer, "Projet de fond")
- Section divider via margin — block label "Durée estimée" (Display 17px 700, 28 top-margin, 12 bottom)
- Duration: 4-cell grid (1h/2h/4h/8h), 48px height, radius 12, **Ink active**, Paper inactive. Active has no shadow, inactive has `elev.e1`.
- "Décris ton besoin" — textarea-shaped card: Paper, radius.lg, padding 14, `elev.e1`, 4 rows, no border, placeholder "Précise le problème, l'urgence, les détails…"

### Step 1 — Date & heure (mobile)
- Calendar card: Paper, radius.lg (18 effective in the prototype, but radius.lg is fine), padding 18, `elev.e2`:
  - Header: 32×32 `mbRoundBtn` (Slate-100 bg) left arrow + "Avril 2026" (Display 700 16px) + right arrow
  - 7-column day-letter row (caption weight 600)
  - 7×5 grid: aspect 1:1, radius 10
    - Selected: `background: Ink, color: white, weight: 700`
    - Available: Ink text + 4×4 Emerald dot below
    - Past/invalid: opacity 0 or Slate-subtle
- Block label "Créneaux disponibles"
- 3-col grid of time buttons (`08:00 / 10:00 / 14:00 / 16:00 / 18:00`):
  - 46px height, radius 12, font-mono 14px
  - Active: Ink bg + white text
  - Inactive: Paper + `elev.e1`
- Block label "Adresse d'intervention"
- Address card: Paper, radius.lg, padding 14 16, `elev.e1`:
  - Pin icon muted + text input (no border, transparent bg)

### Step 2 — Confirmation (mobile)
- **Summary grouped card** (one outer Paper radius.lg `elev.e2`, no border):
  - 5 `MbSumRow`s, padding 14 16 each, 1px `borderSubtle` divider except last:
    - Icon (36×36 Slate-100 rounded square with 16px icon) + column (Caption label above Body-M value semibold)
  - Rows: Wrench "Service" + service string, Clock "Durée" + "{duration} heure(s)", Calendar "Date" + "Mer. {date} avril · {time}", MapPin "Adresse" + address, MessageCircle "Note" + note
- Block label "Détails du paiement"
- Price breakdown card (Paper, radius.lg, padding 16 18, `elev.e2`):
  - `MbPriceRow`s: "{hourly} FC × {duration}h" + subtotal; "Frais de service (7%)" + fee muted
  - 1px `borderSubtle` divider
  - Bold total row: "Total estimé" + total × 1.07 in Display 16px 700
- Protected-payment panel (Emerald-subtle bg, radius 14, padding 12 14, 16 top-margin):
  - ShieldCheck icon Emerald + column: "Paiement protégé" (14px bold) + Caption explainer

### Sticky footer CTA
- `StickyBottomBar` from D05:
  - Left block (flex 1, minWidth 0):
    - Caption (top): "à {hourly} FC/h" on steps 0/1, "Total estimé" on step 2
    - Display 17px 700 amount underline-3px on steps 0/1 (links-like), no underline on step 2. Shows `total` on 0/1, `total × 1.07` on step 2.
  - Primary `Continuer →` button, 48 height, padding 0 22. On step 2: label is `Confirmer`.

Confirming step 2 → Kayou Moment (D08). The screen's step 3 is effectively replaced by the KayouMoment component mount.

## Behavior details
- On step 0 → 1 → 2 progression, scroll position resets to top of content
- On step X → X-1 (back), scroll position restores (cached in state or via ref)
- Close button on step 0 returns to previous screen (usually ProviderProfile)
- Calendar month nav is local-only for MVP (no past-month navigation below the min valid month)
- Time slot selection is single-select
- Duration is single-select
- Service selection is single-select; previously selected persists if user navigates back

## Dependencies
- Depends on D04 (web primitives set up), D05 (mobile shell), D06 (mobile screens — Réserver CTA on profile)
- Blocks D08 (Kayou Moment is triggered from here)

## Acceptance criteria
1. Web booking renders a 560px centered column with a 3-step stepper matching the prototype
2. Mobile booking is a full-screen sheet with tab bar hidden
3. Service options on mobile use full tap-target shadowed cards (not OS radio inputs)
4. Calendar (both platforms) displays availability dots under valid days; selected day has correct highlight
5. Time slot grid renders exactly the 5 options with active state applied to one at a time
6. Summary card (step 2) shows all 5 fields with proper multiline layout
7. Price breakdown shows subtotal, 7% service fee, and total at 107% of subtotal
8. Confirming step 2 advances state to `step = 3`, which triggers the Kayou Moment (D08)
9. Back-navigating decrements step until step 0, then exits the flow

## QA checklist
- [ ] Progress bars fill Sky (web) or Ink (mobile) up to and including the current step
- [ ] Provider mini-card on web has a 1px border; on mobile it has shadow and no border
- [ ] Step 0 mobile: active option card has the `portfolio.accent`-colored ring shadow
- [ ] Step 0 mobile: duration active buttons are Ink with white text
- [ ] Mini-calendar: the pre-selected date is rendered selected on mount
- [ ] Mini-calendar: tapping an unavailable day does nothing
- [ ] Time slots display in mono font
- [ ] Address input is a real editable input, not a static display
- [ ] Summary grouped card shows all 5 rows with proper dividers (none on the last row)
- [ ] Price row "Total estimé" is Display 700 on both platforms
- [ ] Protected-payment panel has Emerald icon and Emerald-subtle bg
- [ ] Web "Confirmer la réservation" advances to step 3 / Kayou Moment
- [ ] Mobile sticky CTA label is "Continuer" on steps 0/1, "Confirmer" on step 2
- [ ] Mobile sticky CTA price updates live when duration changes
- [ ] No v1 patterns remain: no thin 1px-bordered stacks on mobile; all step surfaces use shadows

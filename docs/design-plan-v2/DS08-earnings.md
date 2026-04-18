# DS08 — Earnings (pro, Mobile Money)

## Goal

Ship the pro's earnings screen: a weekly bar chart with today-highlight and future-dim states, summary stats row, a **Mobile Money payout sheet** supporting M-Pesa / Airtel Money / Orange Money / MTN Mobile Money, and a transaction list with type-tagged rows (earning / payout / bonus).

## Why it matters

Mobile Money is the differentiator for DRC / Congo-B. The design makes it first-class — not hidden behind a card or "bank settings". This is how pros get paid; getting the visual right builds trust in the payout promise.

## Scope

### In scope
- `Earnings` screen (route `/pro/earnings`, mobile screen `EarningsScreen`)
- Week bar chart (`MoneyChart`): 7 bars Lun-Dim, today highlighted, future dimmed, hover tooltip on web
- Summary stats row: balance disponible / en attente / lifetime
- Payout request action: "Demander un paiement" primary CTA at top of screen
- Payout sheet (mobile) / modal (web): Mobile Money operator picker (M-Pesa, Airtel, Orange, MTN), masked number, amount input, fees preview, "Valider" CTA (placeholder; no backend)
- Transaction list: 6+ rows with type icon + label + amount + fee/net + status + date
- Transaction types: `earning`, `payout`, `bonus` — each with distinct icon + color

### Out of scope
- Actual Mobile Money payout wiring — backend integration is deferred; design ships the UI
- Export to CSV / PDF — placeholder button
- Custom date range picker — "Cette semaine / Ce mois / Personnalisé" placeholder buttons
- Tax / invoice PDF generation

## Reference files
- `prototype/components/Earnings.jsx` — 569 lines
  - `EARNINGS_WEEKLY` (7-day data)
  - `TRANSACTIONS` (6 sample entries with types)
  - `MoneyBar`, `MoneyChart`, payout sheet, transaction row

## Layout

### Mobile

```
┌──────────────────────────────────────┐
│ Gains               (sticky h)        │
├──────────────────────────────────────┤
│ SOLDE DISPONIBLE                      │
│ 342 000 FC  ↑ +12% cette semaine     │
│ [Demander un paiement]                │
├──────────────────────────────────────┤
│ [MoneyChart — 7 bars, today hilite]  │
│   Lun Mar Mer Jeu Ven Sam Dim        │
├──────────────────────────────────────┤
│ [Stat tiles] En attente · Lifetime   │
├──────────────────────────────────────┤
│ TRANSACTIONS                          │
│ [Filter chips: Tout / Gains / Paiements] │
│ [TransactionRow × N]                  │
│                                      │
│ [Export CSV → ] (ghost link)          │
└──────────────────────────────────────┘
```

### Web

```
┌──────────────────────────────────────┐
│ Gains                                 │
│ [Demander un paiement] secondary      │
├──────────────────────────────────────┤
│  Main (1.4fr)              Sidebar (1fr) │
│  ┌────────────────────┐  ┌──────────────┐│
│  │ Big balance        │  │ Stats         ││
│  │ Chart              │  │ Next payout   ││
│  │ Filter chips       │  │ Ops contact   ││
│  │ Transactions       │  └──────────────┘│
│  └────────────────────┘                   │
└──────────────────────────────────────┘
```

Web max 1200, 2-column `grid: 1.4fr 1fr`, 28px gap.

## MoneyChart

Props: `data: WeekDay[]` with `{ day: 3-letter, amount: number, isToday?, isFuture? }`

Top row: label block (left): "Cette semaine" caption + big Display-700 total + up/down delta pill. Right: "vs semaine dernière" compact.

Bar area: 7 equal columns, 100px tall container. Each bar:
- Height percentage = `max(6, amount / max × 100)` — so zero-value bars still show a 2px sliver
- Future days (`isFuture`): surface-muted solid grey fill
- Today (`isToday`): primary gradient bg + box-shadow ring (primary 2px via `0 0 0 2px bg, 0 0 0 3.5px color`) for emphasis
- Other days: gradient from `accent88` to `accent44` (more muted)
- Animated height on mount using `transition: height 320ms emph`
- Day label below each bar, mono, letter-spacing tracked, weight 500; colored to match its bar state

## Stats row (below chart)

Three compact tiles:
- Solde disponible (Display 22, mono FC suffix, emerald color)
- En attente (commissions on jobs not yet paid out)
- Gains totaux (lifetime, muted)

On web, these are in the sidebar. On mobile, stacked below the chart in a 2-col grid.

## Payout sheet

Opens as a modal on web, a bottom-sheet on mobile (full-screen if content demands it).

### Sheet content

```
Demander un paiement
Votre solde : 342 000 FC

────────────────────────────
Montant
[ 342 000 FC    ]  [Max]
────────────────────────────
Envoyer vers
┌───────────┐ ┌───────────┐
│ M-Pesa    │ │ Airtel M. │  ← operator tiles (radio-like)
│ (M)       │ │ (A)       │
└───────────┘ └───────────┘
┌───────────┐ ┌───────────┐
│ Orange M. │ │ MTN MoMo  │
└───────────┘ └───────────┘

Numéro
+243 810 *** 742   [Modifier]
────────────────────────────
Récapitulatif
Montant              342 000 FC
Frais (1%)             − 3 420 FC
─────────────────────────────
Total à recevoir     338 580 FC

[Valider le paiement]
Délai : 2-5 minutes · sécurisé par KAYOU
```

- Operator tiles: 2×2 grid, radius 14, border colored by operator (M-Pesa emerald, Airtel rose, Orange orange, MTN amber)
- Masked number display; "Modifier" ghost button opens phone-entry sub-step (deferred — TODO link)
- Validation CTA is a placeholder on the front-end (no real payout)

## Transaction list

### Row structure

Icon block (36×36 rounded-square, type-colored bg + fg) | Body column | Amount column

```
┌────────────────────────────────────────┐
│ [🔽] Réparation fuite · Famille Mutombo │  ← type icon + label
│      Il y a 2h · M-Pesa                 │  ← meta caption
│                              +22 000 FC  │
│                              Net 20 460  │  ← fee shown as caption
└────────────────────────────────────────┘
```

Types:
- `earning`: success-subtle bg, trending-up icon, emerald color, `+{amount}` FC, net below
- `payout`: primary-subtle bg, send/arrow-up icon, Sky color, `−{amount}` FC, ref code below
- `bonus`: amber-subtle bg, sparkles icon, Amber color, `+{amount}` FC

Status badge (inline right): `completed` (silent), `pending` (warning pill), `failed` (rose pill).

### Filters

Chip row above list: `Tout / Gains / Paiements / Bonus`. Non-breaking; filters the visible rows.

### Empty state

"Pas encore de transactions." — with a hint to complete missions.

## Dependencies
- Depends on DS01, DS06 (StatCard + Sparkline primitives promoted in `@kayu/ui` already)
- Blocks: DS11 audit

## Acceptance criteria

1. Web `/pro/earnings` renders the 2-column layout; mobile `EarningsScreen` renders stacked
2. `MoneyChart` shows 7 bars with today highlighted and future days dimmed
3. "Demander un paiement" opens the payout sheet
4. Payout sheet 4 operator tiles render with correct brand colors
5. Masked number + "Modifier" placeholder button visible
6. Récapitulatif shows amount / fee (1%) / net-to-receive
7. "Valider le paiement" is a placeholder (no-op)
8. Transaction list renders with icon + body + amount in correct type colors
9. Filter chips correctly narrow the list

## QA checklist
- [ ] Chart total matches sum of `EARNINGS_WEEKLY[*].amount`
- [ ] Today bar has a ring shadow (`0 0 0 2px var(--k-bg), 0 0 0 3.5px color`) — renders cleanly on a Sand background
- [ ] Zero-value days still show a 2px sliver bar (not invisible)
- [ ] Future days use Slate-subtle color (distinct from past days with no data)
- [ ] Payout sheet height on mobile: auto up to 82% viewport, scrolls internally
- [ ] Each operator tile shows its 1-letter initial in brand color
- [ ] Masked phone number only shows last 3 digits
- [ ] Fee (1%) is calculated live from the amount input
- [ ] Transaction amount sign: `+` for earning/bonus, `−` for payout; colored accordingly
- [ ] Net caption (fee-aware) shows under earning amount
- [ ] Reference code (e.g. "MP-7X42ZC") shows under payout label, mono font
- [ ] Bonus rows have distinctive amber tint and sparkles icon
- [ ] "Export CSV" is a ghost link (placeholder — TODO)
- [ ] Pending earnings sum matches the "En attente" tile value

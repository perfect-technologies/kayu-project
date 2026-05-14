# Booking details redesign — design

**Date:** 2026-05-14
**Scope:** `apps/web/src/components/bookings/BookingDetail.tsx`, `apps/web/src/components/bookings/FinalOfferDialog.tsx`, new shared atoms in `apps/web/src/components/bookings/`. No backend changes, no schema changes, no shared-package changes.
**Status:** Pending implementation plan.

## Goal

Rebuild `/bookings/[id]` around a "live mission card" identity. The page should answer two questions immediately, regardless of who's looking:

1. **Where are we in this booking?** — status, when, who.
2. **What do I do next?** — one obvious primary action.

Today's page works but it leads with a small id + title row, then a vertical timeline, a gradient-heavy final-offer card, a fake SVG mini-map, and a fabricated chat preview. It also has no mobile breakpoint (hard-coded `1fr 340px` grid), and it violates the current design direction in two places (gradients in `MiniMap` and the final-offer card).

The redesign:

- Replaces the small text header with a **state-led hero card** that carries status, date/time, service summary, counterparty, and a quick-action button.
- Replaces the vertical timeline with a **slim 4-dot step strip** under the hero.
- Reshapes the final-offer card into the **Accord card**, with three explicit lifecycle states (empty / registered / locked) and per-perspective variants. The empty state for providers becomes the conversion CTA.
- Drops the fake mini-map; the address becomes a clean **AddressRow** with an "Itinéraire ↗" deep link.
- Drops the standalone "Conversation" card; messaging is a button in the hero and in the action rail.
- Adds a real **mobile breakpoint**: single column + sticky bottom action bar below 768 px; 1fr / 300 px grid with sticky right rail at/above 768 px.
- Cleans up **FinalOfferDialog** into a bottom sheet on mobile and a centered dialog on desktop, with duration as chips and a live "Résumé pour toi" preview block.

## Non-goals

- No backend, Prisma, or DTO changes.
- No new endpoints. No real chat preview, no real itinerary/map, no real-time updates.
- No changes to status semantics, payment flow, commission rules, or booking-state transitions.
- No changes to `BookingCard.tsx` (list view) or `BookingStatusChip.tsx` (used by the list view).
- No mobile (Expo) implementation. Web only.
- No new icons added to `@kayu/ui/web`; we use what's already exported in `I`.

## Required reading

Same as `2026-05-14-booking-flow-redesign-design.md`:

1. `docs/design-direction/index.html` — flat surfaces, hairline borders, Lucide icons, restrained color.
2. `packages/ui/src/tokens.ts` — canonical tokens.
3. `2026-05-14-booking-flow-redesign-design.md` — established hero/section conventions for the booking flow, which this spec follows for typography and spacing.

## Global design rules (inherited)

1. No gradient backgrounds anywhere. Flat surfaces only.
2. Lucide icons via `@kayu/ui/web`'s `I`. The mockup emoji placeholders in `.superpowers/brainstorm/.../content/` are stand-ins — production swaps each one (see §9).
3. Plain text for secondary metadata, chips only for status and trust.
4. Restrained color. Status is the only place color carries meaning; everything else uses neutrals (`--k-text-primary`, `--k-text-body`, `--k-text-muted`, `--k-border`, `--k-border-subtle`).
5. Tokens are the source of truth.
6. Avatar fallback ladder unchanged: real `avatar` → initials in display font on the counterparty role colour → fallback Lucide `user` on `--k-beige`. (Current code uses initials on primary blue — keep that for now; the avatar treatment is out of scope.)

---

## §1. Page composition

```
<div className="k-bd-page">
  <BackLink href="/bookings" />                    {/* ← MES RÉSERVATIONS, mono, uppercase */}

  <BookingHero booking={...} perspective={...} />  {/* state-led card */}

  <StepStrip steps={STEPS_BY_V2[v2]} step={step} />

  <BookingGrid>                                    {/* 1fr on mobile, 1fr 300px on desktop */}
    <main>
      <AccordCard booking={...} offer={...} perspective={...} onCreate={...} onAdjust={...} />
      <AddressRow booking={...} perspective={...} />
    </main>
    <aside>                                        {/* desktop only, sticky 20px from top */}
      <ActionsCard ... />
      <DetailsCard ... />
    </aside>
  </BookingGrid>

  <MobileStickyBar ... />                          {/* mobile only, hidden ≥ md */}
  {dialogOpen && <FinalOfferDialog ... />}
</div>
```

- **Breakpoint:** `md` = 768 px. Below: single column + `MobileStickyBar`. At/above: 1fr / 300 px grid + sticky aside (`top: 20px`, `align-self: start`).
- **Outer width:** `max-width: 1080px`, `margin: 0 auto`, padding `12px 16px 32px` on mobile, `16px 24px 40px` on desktop.
- **Background:** the app background (`var(--k-surface-muted)` already in use). All cards sit on `var(--k-surface)` with `1px solid var(--k-border)` hairlines.

---

## §2. BookingHero

The state-led card at the top of the page.

### Composition (mobile)

```
<section className="k-hero">
  <div className="k-hero-ribbon">
    <StatusChip status={v2} />                     {/* see §2.2 */}
    <span className="k-hero-ref">#{ref}</span>     {/* mono, uppercase, muted */}
  </div>
  <h1 className="k-hero-when">{whenLabel}</h1>     {/* k-display, 26px mobile / 32px desktop */}
  <p className="k-hero-sub">{subLine}</p>          {/* see §2.3 */}

  {stateStrip}                                     {/* optional: amber/green/grey/rose strip per state */}

  <div className="k-hero-who">
    <Avatar />
    <div>
      <div className="k-hero-name">{name}{verified && <I.badgeCheck />}</div>
      <div className="k-hero-role">{roleLine}</div>  {/* "Votre coiffeuse · ★ 4.9" or "Client" */}
    </div>
    <button className="k-btn k-btn-secondary k-btn-sm">
      <I.messageCircle /> Message
    </button>
  </div>
</section>
```

### Composition (desktop)

The hero gets a top row that splits left (ribbon + when + sub) and right (price block):

```
<div className="k-hero-row1">
  <div>
    <ribbon /> <when /> <sub />
  </div>
  <div className="k-hero-price">
    <span className="k-hero-price-l">PRIX CONVENU</span>          {/* or "ESTIMATION", "PAYÉ", "ANNULÉE" */}
    <span className="k-hero-price-v">{formatMoneyFc(amount)}</span>
    <span className="k-hero-price-h">Espèces à la fin</span>      {/* state-aware helper */}
  </div>
</div>
```

The counterparty row sits below, full-width.

On mobile the price is inlined into the sub-line (`"Coiffure · Tresses · ≈ 2 h · 35 000 FC"`) to avoid stacking a second display-sized number.

### §2.1 Card surface

- Background: `var(--k-surface)`. White.
- Border: `1px solid var(--k-border)`. No accent bars on any edge.
- Radius: `var(--k-r-lg)` (14 px).
- Padding: 18 px mobile, 22 px desktop.
- Shadow: none. (Other cards on the page get `none`; the page is hairline-only.)
- **Cancelled exception:** border becomes `1px solid #FBD0D7` (rose); background stays white.

### §2.2 StatusChip

Per-state chip used in the ribbon. Reuses existing chip atoms where possible. Six visual variants because `IN_PROGRESS` deserves a distinct "live" feel:

| `V2Status` + flags | Label | Background | Text | Dot |
|---|---|---|---|---|
| `upcoming` + `PENDING` | "En attente" | `var(--k-warning-subtle)` | `#92400E` | amber `var(--k-warning)` |
| `upcoming` + `CONFIRMED` | "Confirmée" | `var(--k-success-subtle)` | `#047857` | green `var(--k-success)`, pulse |
| `upcoming` + `IN_PROGRESS` | "En cours" | `var(--k-success-subtle)` | `#047857` | green, pulse |
| `completed` | "Terminée" | `#F1F5F9` | `var(--k-text-body)` | none |
| `cancelled` | "Annulée" | `var(--k-danger-subtle)` | `#9F1239` | none |

Pulse animation reuses the existing `kPulse` keyframes (already in `BookingStatusChip`).

### §2.3 Sub-line composition

A single line joined by ` · `:

- **Pending / Confirmed:** `{title} · {durationLabel}` (mobile adds ` · {priceLabel}`).
- **In progress:** `{title} · En cours · {durationLabel}`.
- **Completed:** `{title} · {durationLabel}`.
- **Cancelled:** `{title} · {address shorthand}`.

`durationLabel` reuses the booking-flow taxonomy: 60 → "≈ 1 h", 120 → "≈ 2 h", 240 → "½ jour", 480 → "Journée", null → "Durée à confirmer".

`{when}` formatting reuses `formatWhen` from `lib/booking-v2.ts`. Cancelled bookings get the date in a strike-through (`text-decoration: line-through; text-decoration-thickness: 1px; color: var(--k-text-muted)`).

### §2.4 State strip (in-hero)

A 10×12 padded rounded strip below the sub-line, before the counterparty row. Shown only when there's something useful to say:

| State | When shown | Tone | Copy |
|---|---|---|---|
| Pending (client) | always | amber (`#FFFBEB` bg / `#FDE68A` border / `#92400E` text) | "{firstName} n'a pas encore confirmé. Réponse habituelle en moins de 2 h." |
| Pending (provider) | always | amber | "Nouvelle demande. Confirme ou enregistre l'accord pour valider." |
| In progress | when `booking.progress` is set | green (`#F0FDF4` / `#BBF7D0` / `#047857`) | `{booking.progress}` |
| Completed (paid) | always | neutral (`#F1F5F9` / no border / `var(--k-text-body)`) | "Payé en espèces · {amount} FC" |
| Completed (unpaid, provider) | always | amber | "Paiement à confirmer" |
| Cancelled | always | rose (`var(--k-danger-subtle)` / `#FBD0D7` / `#9F1239`) | "Annulée par {actor}{reason && ` · « ${reason} »`}" |

Confirmed gets no strip — the chip + the clean date is enough.

### §2.5 Counterparty row

- 38 px circular avatar (mobile), 42 px (desktop). Fallback initials in the display font, white text, current avatar background colour.
- Name in display font, 14 px (mobile) / 15 px (desktop), 600 weight. Trailing `I.badgeCheck` (success colour) if `verified`.
- Role line, 12 px, muted: `"Votre coiffeuse · ★ 4.9 (38 avis)"` (client view) or `"Client"` (provider view). Rating only shown when `counterparty.rating != null`.
- Trailing small secondary button: `<I.messageCircle /> Message`. 36 px height, `var(--k-r-md)` radius. Triggers the same `onMessageCounterparty` as today.

The counterparty row is separated from the body above by a 14 px gap + `1px solid var(--k-border-subtle)`.

---

## §3. StepStrip

Replaces the existing vertical `Timeline`. A self-contained card directly under the hero.

```
<section className="k-step-strip">
  <div className="k-step-strip-head">
    <span className="k-overline">SUIVI</span>
    <span className="k-step-strip-pct">{step+1} / {steps.length}</span>
  </div>
  <ol className="k-step-row">
    {steps.map((s, i) => (
      <li className={state(s, i)}>
        <span className="k-step-dot" />
        <span className="k-step-label">{labels[s]}</span>
      </li>
    ))}
  </ol>
</section>
```

### Steps per state

Identical to today's `TIMELINE_STEPS`:

| V2 status | Steps |
|---|---|
| upcoming | Réservée → Confirmée → Terminée → Payée |
| active | Réservée → Confirmée → Terminée → Payée |
| completed | Réservée → Confirmée → Terminée → Payée |
| cancelled | Réservée → Annulée |

### Visual rules

- 4 (or 2) equal columns. Each column has a centered dot and a 11 px label underneath.
- A hairline rail (`var(--k-border)`, 2 px tall) runs left↔right behind the dots between the first and last dot centres. A success-coloured rail runs over the rail from the first dot to the centre of the last "done" step (exclusive of "current").
- Dot states:
  - **Done:** filled `var(--k-success)`, 14 px, no border.
  - **Current:** filled `var(--k-text-primary)`, 14 px, with a `0 0 0 4px rgba(15,23,42,0.08)` outer ring.
  - **Pending:** white, 14 px, `2px solid var(--k-border)`.
- Label colour: `var(--k-text-primary)` for done/current, `var(--k-text-muted)` for pending.
- Card padding: 14 px 16 px. Same surface as everything else (white, hairline border, `var(--k-r-lg)`).

The cancelled variant collapses to 2 columns; the success rail becomes a danger-coloured rail and the second dot is rose-filled.

---

## §4. AccordCard

The centerpiece of the body. Three lifecycle states × two perspectives = 6 visual variants, all served from one component.

### §4.1 State derivation

```ts
type AccordState = "empty" | "registered" | "locked";

const accordState = (booking, offer): AccordState => {
  if (booking.status === "COMPLETED" || booking.status === "CANCELLED") return "locked";
  if (offer) return "registered";                       // accepted or pending offer attached
  return "empty";                                       // PENDING/CONFIRMED without offer
};
```

Note: a booking can be `CONFIRMED` without a `FinalOffer` row (the provider confirmed without registering an accord). In that case `accordState = "empty"` and the empty-provider variant offers "Enregistrer l'accord final" but does not gate the confirmation flow.

### §4.2 Empty — client

```
<Card>
  <Head ttl="Accord" meta="EN ATTENTE" metaTone="warn" />
  <EmptyStack>
    <Icon><I.fileText /></Icon>
    <Hl>En attente d'un accord</Hl>
    <Sl>{firstName} revient vers toi pour confirmer le service, la durée et le prix.</Sl>
    <EstimateRow>
      <span>Estimation initiale</span>
      <span className="k-mono">{formatMoneyFc(booking.price ?? 0)}</span>
    </EstimateRow>
  </EmptyStack>
</Card>
```

- `EmptyStack` is a flex-column, centered, ~280 px wide content area inside the card.
- The "Estimation initiale" row is a 10×14 padded `#F8FAFC` rounded block (no border).
- No CTA. The ball is in the provider's court.

### §4.3 Empty — provider

Same composition as §4.2, but:

- Header title becomes "Accord à enregistrer", meta tone amber "À FAIRE".
- Body copy: `"Confirme l'accord avec le client"` / `"Saisis le service final, la durée, le prix et l'adresse. La réservation passera à Confirmée."`
- Estimate row label: `"Estimation initiale du client"`.
- Adds a full-width primary CTA below the estimate: `<button className="k-btn k-btn-primary" onClick={onCreate}>Enregistrer l'accord final</button>`. The button is the conversion path; tapping it opens `FinalOfferDialog`.

### §4.4 Registered — client

```
<Card>
  <Head ttl="Accord final" meta="CONFIRMÉ" metaTone="ok" />
  <TitleBlock>
    <Title>{offer.title}</Title>
    <Description>{offer.description}</Description>
    <PriceBlock label="Prix convenu" value={formatMoneyFc(offer.price)} />
  </TitleBlock>
  <KvGrid>
    <Kv label="Durée" value={durationLabel(offer.duration)} />
    <Kv label="Confirmé" value={formatRelativeFR(offer.acceptedAt ?? offer.createdAt)} />
  </KvGrid>
  <PayNote><I.coins /> Paiement en espèces à la fin de la mission.</PayNote>
</Card>
```

- `TitleBlock` is a flex row: title + description on the left, price block on the right.
  - Title in display font, 16 px, 700.
  - Description in body, 12.5 px, 1.45 line-height.
  - Price label in mono uppercase, 10.5 px, muted. Value in display font, 22 px, 700.
- `KvGrid`: 2 columns on mobile, 3 on desktop (the third slot shows "Référence" with the mono ref). 12 px row gap, 14 px top padding, 1 px dashed `--k-border-subtle` top divider.
- `PayNote`: 9×12 padded `#F8FAFC` rounded block (no border), `I.coins` icon + body text.

### §4.5 Registered — provider

Same as §4.4 plus, below the `PayNote`:

```
<CommissionBlock>
  <Row><span>Commission KAYOU ({pct}%)</span><span className="k-mono">−{formatMoneyFc(amt)}</span></Row>
  <Row net><span>Gain net estimé</span><span className="k-display k-success">{formatMoneyFc(net)}</span></Row>
</CommissionBlock>
<EditLink onClick={onAdjust}><I.pencil /> Ajuster l'accord</EditLink>
```

- `CommissionBlock`: 12 px top padding, 1 px solid `--k-border-subtle` top divider, 5 px row gap, 12.5 px font-size. Net row has body-coloured 600 label and display-font success-coloured 700 value (14 px).
- `EditLink`: 12 px top, right-aligned, underline-on-hover, body-primary colour, 12.5 px, 600. **No big secondary button.** The "adjust" path is deliberately quiet — the registered card is supposed to feel done.

### §4.6 Locked — client

Same composition as §4.4 with:

- Header meta: `"CLÔTURÉ"`, neutral tone.
- Price label: `"Payé"` (if paid) or `"À régler"` (if completed but unpaid — rare).
- Grid: `Durée` reflects actual duration if recorded; second cell becomes `Payé le` with `formatWhen(booking.paidAt)`. On completed-paid bookings the third desktop cell shows `Référence`.
- PayNote text becomes `"Réglé en espèces à la fin de la mission."` with `I.check` instead of `I.coins`.
- No edit affordances anywhere.

### §4.7 Locked — provider

Same as §4.6 plus the `CommissionBlock` (renamed `"Commission KAYOU"` / `"Gain net"`, past tense). No edit link.

### §4.8 Cancelled accord

When `booking.status === "CANCELLED"` and an offer existed: the card renders as **Locked** with the header meta swapped to `"ANNULÉ"` (neutral tone). The price block carries a strike-through and the PayNote is replaced with `"Mission annulée. Aucune transaction."`. If no offer existed: render as **Empty client** with the header meta `"NON CONCLU"` and no estimate row.

---

## §5. AddressRow

Replaces `AddressCard` and `MiniMap`. Same card shell as the rest.

```
<section className="k-section">
  <Head ttl={isClient ? "Adresse d'intervention" : "Adresse client"} meta={commune?.toUpperCase()} />
  <div className="k-addr-row">
    <div className="k-addr-pin"><I.mapPin /></div>
    <div className="k-addr-body">
      <div className="k-addr-v">{streetLine}</div>
      <div className="k-addr-l">{commune}, {city}</div>
      {locationNote && <div className="k-addr-note">{locationNote}</div>}
    </div>
    <a
      className="k-addr-link"
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
      target="_blank"
      rel="noreferrer noopener"
    >
      Itinéraire <I.arrowUpRight />
    </a>
  </div>
</section>
```

- `pin`: 32 px square, `var(--k-r-md)` radius, `#F1F5F9` background, no border, `I.mapPin` in muted colour.
- `body`: street in 13.5 px / 500 weight / text-primary; commune line in 11.5 px / muted; optional note in 12 px / body, with an 8×10 padded `#F8FAFC` rounded sub-block (no border).
- `link`: 12 px / 600 / text-primary, `1px solid var(--k-border)` outline, `var(--k-r-md)`, 8×10 padding. On hover the border becomes `var(--k-text-primary)`. No underline.
- Card padding: 16 px 18 px.

The current data fallback rules from `fullAddress`/`fullAddress(booking)` stay intact: if `address` already contains the commune, the commune line is omitted.

If `booking.locationNote` (currently `clientNotes`) is empty, the note block is hidden.

---

## §6. Mobile sticky bottom bar

Hidden ≥ 768 px. `position: fixed; left: 0; right: 0; bottom: 0`, white background, `1px solid var(--k-border)` top, 12×14 padding (+ `env(safe-area-inset-bottom)`). Two-button layout: a leading ghost/secondary on the left (40 % width) and a leading primary on the right (60 % width). State matrix:

| State / perspective | Left (secondary / ghost-danger) | Right (primary) |
|---|---|---|
| Pending / client | "Annuler" (ghost-danger) | "Message à {firstName}" |
| Pending / provider | "Enregistrer l'accord" (secondary) | "Confirmer la réservation" |
| Confirmed / client | "Annuler" (ghost-danger) | "Message à {firstName}" |
| Confirmed / provider | "Ajuster l'accord" (secondary) | "Marquer comme terminée" |
| In progress / client | — (left hidden, primary spans full) | "Message à {firstName}" |
| In progress / provider | "Message" (secondary) | "Marquer comme terminée" |
| Completed / unpaid / provider | "Message" (secondary) | "Confirmer le paiement reçu" |
| Completed / paid / client (no review) | "Message" (secondary) | "Laisser un avis ★" |
| Completed / paid / client (reviewed) | "Message" (secondary) | "Réserver à nouveau" |
| Completed / paid / provider | — (left hidden) | "Message" (secondary, spans full) |
| Cancelled / client | "Message" (secondary) | "Réserver à nouveau" |
| Cancelled / provider | — (left hidden) | "Message" (secondary, spans full) |

The page reserves `padding-bottom: 80px` on mobile so the sticky bar never overlaps content.

The primary button uses `--k-text-primary` (near-black) background, white text, 600 weight — matching the booking flow's primary CTAs. The ghost-danger uses transparent background, `var(--k-danger)` text, 500 weight, no border.

---

## §7. Desktop right rail

At/above 768 px. 300 px column, sticky `top: 20px`. Two cards:

### §7.1 ActionsCard

```
<aside>
  <Card>
    <Head>ACTIONS</Head>
    <PrimaryCta />        {/* same label as the mobile sticky right button for this state */}
    {secondaryCta && <SecondaryCta />}
    {destructiveCta && <DestructiveCta />}
  </Card>
  ...
</aside>
```

Buttons are all `width: 100%`, stacked with 8 px gaps. The ghost-danger "Annuler la réservation" sits at the bottom with `margin-top: 6px` (slightly tighter to feel less primary).

The exact buttons mirror §6.

### §7.2 DetailsCard

```
<Card>
  <Head>DÉTAILS</Head>
  <MetaRow label="Réservation" value={`#${ref}`} mono />
  <MetaRow label="Créée" value={formatRelativeFR(createdAt)} />
  <MetaRow label="Paiement" value={paymentStatusLabel(booking)} />
  {!isClient && <MetaRow label="Zone" value={city ?? "—"} />}
</Card>
```

- Card padding: 16 px 18 px.
- Each `MetaRow`: 7 px vertical padding, `1px solid var(--k-border-subtle)` top divider (first row omits), 12.5 px font, label muted left / value text-primary right (500 weight). Mono values use `var(--k-font-mono)`, 11.5 px.

The current "Paiement en espèces" explainer card is **removed**. Its content is covered by the `PayNote` in the Accord card.

---

## §8. FinalOfferDialog redesign

Provider-only. Triggered from `AccordCard` (empty-provider "Enregistrer l'accord final" CTA, or registered-provider "Ajuster l'accord" link).

### §8.1 Chrome

- Overlay: `rgba(15,23,42,0.42)` fixed full-screen.
- Mobile (< 768 px): bottom sheet. `position: fixed; left: 0; right: 0; bottom: 0;` rounded top corners (`20px 20px 0 0`), `max-height: calc(100vh - 24px)`, scrollable. 4 px × 36 px grabber centred at the top.
- Desktop (≥ 768 px): centred 520 px wide dialog, `border-radius: 16px`, `box-shadow: 0 24px 60px -16px rgba(15,23,42,0.35)`.

### §8.2 Header

```
<header>
  <div>
    <div className="k-overline">ACCORD FINAL · {adjusting ? "AJUSTEMENT" : "NOUVEAU"}</div>
    <h2 className="k-display">{adjusting ? "Ajuster l'accord" : `Confirme l'accord avec ${firstName}`}</h2>
    <p className="k-body-m k-muted">{subheading}</p>
  </div>
  <button aria-label="Fermer"><I.x /></button>
</header>
```

- Overline: mono uppercase, 10.5 px, muted, letter-spacing 0.08em.
- Title: display font, 20 px mobile / 22 px desktop, 700 weight, letter-spacing -0.01em.
- Subheading copy:
  - New: `"Indique ce que tu vas faire, la durée, le prix convenu et l'adresse. Le client recevra une confirmation immédiate."`
  - Adjust: `"L'accord précédent sera remplacé par cette mise à jour."`

### §8.3 Field set

Order (top-to-bottom):

1. **Service** — text input, single line. Required. Pre-fills with the offer title (or the booking title on a fresh open). Min length 3.
2. **Description** — textarea, 60 px min height. Optional. Pre-fills with offer description / booking description.
3. **Prix convenu** + **Durée** — two-column row on both viewports.
   - Price: numeric input with `FC` suffix inside the input (mono, muted). Required, ≥ 0.
   - Durée: chip row (`1 h` / `2 h` / `½ jour` / `Journée`) → `60 / 120 / 240 / 480` minutes. **No free decimal input.** If the offer was previously saved with a non-canonical duration, the closest chip is selected.
4. **Date et heure** — single input. Mobile uses native `datetime-local` for ergonomics; desktop styles the same control to match other inputs. Required.
5. **Adresse** — text input. Optional. Pre-fills.
6. **Commune** — text input on mobile (single field below the address), select on desktop (two-column row sharing the address row).
   - On mobile, the address row stays one-column to avoid cramped chips on 320 px screens.
   - On desktop, address (1fr) + commune (200 px) sit side-by-side. Commune is a native `<select>` styled to match the input, options = `KIN_COMMUNES`.
7. **Précision utile** — textarea, 50 px min height. Optional.

All labels follow the same atom:

```
<span className="k-field-label">SERVICE<span className="k-field-opt">facultatif</span></span>
```

- Label: mono uppercase, 10.5 px, muted, letter-spacing 0.08em, 6 px bottom margin.
- "facultatif" suffix in display font, 10.5 px, `var(--k-text-subtle)`, no transform, 6 px left margin.

Inputs:

- Default: white, `1px solid var(--k-border)`, `var(--k-r-md)` radius, 11×12 padding, 42 px min-height, 14 px font.
- Focus: border becomes `var(--k-text-primary)`, plus `box-shadow: 0 0 0 3px rgba(15,23,42,0.06)`.
- Error: border `var(--k-danger)`, no shadow.

### §8.4 Résumé block

Appears below the field set, before the footer. 14 px padding, `#F8FAFC` background, `var(--k-r-lg)` radius, no border.

```
<div className="k-offer-preview">
  <span className="k-overline">RÉSUMÉ POUR TOI</span>
  <div className="k-offer-preview-grid">
    <span>Total convenu</span>          <span>{formatMoneyFc(price)}</span>
    <span>Commission KAYOU ({pct}%)</span><span>−{formatMoneyFc(commission)}</span>
    <hr />
    <span>Gain net estimé</span>         <span className="k-display k-success">{formatMoneyFc(net)}</span>
  </div>
  <div className="k-helper">💵 Paiement en espèces. Le gain est crédité après confirmation du paiement reçu.</div>
</div>
```

- Live: recomputes on every price input change. Commission percentage comes from the booking (`booking.commissionPct ?? 10`).
- The icon in the helper is the existing `I.coins` (not an emoji).

### §8.5 Footer

- Sticky inside the sheet on mobile (the sheet's last block), normal flow on the dialog.
- Two buttons, full-row width split: secondary "Annuler" (40 %) + primary "Confirmer l'accord" (60 %). On adjust, primary becomes "Mettre à jour l'accord".
- Disabled when: title length < 3, price not parseable / negative, scheduledDate invalid, or `busy`.

### §8.6 Errors

The existing `formError` flow is kept (inline rose-tinted alert block above the footer). Touching any field clears the error.

### §8.7 Behaviour parity

The submission shape, mutation hook, query invalidations, and bookingId/clientId/providerId wiring all stay the same as today. **No backend or DTO changes.** The dialog's contract with the caller is unchanged (`onSubmit` accepts the same `CreateFinalOfferInput`).

---

## §9. Tokens, atoms, and file map

### New components (all in `apps/web/src/components/bookings/`)

| Component | Purpose |
|---|---|
| `BookingHero.tsx` | The state-led hero card. Receives `booking`, `perspective`, `onMessage`. Renders all state variants internally. |
| `StepStrip.tsx` | Slim horizontal 4-dot strip. Receives `steps: string[]` + `step: number`. |
| `AccordCard.tsx` | Lifecycle-aware accord card. Receives `booking`, `offer`, `perspective`, `onCreate`, `onAdjust`. Renders empty/registered/locked × client/provider. |
| `AddressRow.tsx` | Pin + body + Itinéraire link. Receives `booking`, `perspective`. |
| `MobileStickyBar.tsx` | Sticky bottom action bar. Receives the state matrix from a shared `useBookingActions` hook (or inline derivation). |
| `ActionsCard.tsx` | Desktop right rail Actions block. Same state matrix. |
| `DetailsCard.tsx` | Desktop right rail Details block. |

### Reused / kept

- `formatWhen`, `formatRelativeFR`, `fullAddress`, `initialsFromName`, `paymentStatusLabel`, `priceLabelFor`, `toV2Status`, `V2Status` from `lib/booking-v2.ts`.
- `Avatar` / `AvatarFallback` from `components/ui/avatar`.
- `I` icon registry from `@kayu/ui/web`.
- `bookingsApi`, `finalOffersApi`, `queryKeys` from `@kayu/api`.
- `BookingStatusChip.tsx` stays as-is (used by the list view) — `BookingHero` defines its own status chip inline because its state map is richer (`PENDING` vs `CONFIRMED` are both "upcoming" in v2 but get different chips here).
- `formatMoneyFc` from `@kayu/ui`.

### Removed / rewritten

- `BookingDetail.tsx` is rewritten end-to-end. The inline `WebCard`, `MetaRow`, `BdStatusChip`, `Timeline`, `BookingFinalOfferCard`, `OfferDetailRow`, `QuoteBreakdown`, `CounterpartyCard`, `ActionButtons`, `AddressCard`, `MiniMap`, `ChatPreview` go away (functionality redistributed to the new atoms above, or dropped entirely as per the design direction).
- `FinalOfferDialog.tsx` is rewritten in place. The export and props contract stay the same so `BookingDetail` is the only caller affected.

### CSS class prefix

All new atoms use the `k-bd-*` prefix (booking-details) to avoid colliding with the booking-flow `k-bk-*` and the provider-details `k-pd-*` namespaces. CSS lives in the existing global stylesheet (or component-level `<style jsx>` if the existing pattern is inline — match what `BookingDetail.tsx` does today, which is inline style objects + `className`).

### Icons (Lucide via `I`)

| Use | Icon |
|---|---|
| Back link arrow | `I.arrowLeft` |
| Status chip (in progress / confirmed) — pulse dot is CSS-only, no icon | — |
| Verified check on counterparty | `I.badgeCheck` |
| Rating star | `I.star` |
| Message button (hero, sticky bar, rail) | `I.messageCircle` |
| Call action (desktop "Appeler" pill) — out of scope v1, no icon | — |
| Pin in AddressRow | `I.mapPin` |
| Itinéraire arrow | `I.arrowUpRight` (fallback `I.arrowRight` if not present) |
| Accord empty icon | `I.fileText` |
| PayNote — pending/active | `I.coins` |
| PayNote — completed paid | `I.check` |
| Edit accord link | `I.pencil` |
| Modal close | `I.x` |
| Step strip done dot — CSS-only, no icon | — |

If `I.arrowUpRight` is not in the icon registry, fall back to `I.arrowRight` (already used elsewhere) and verify in `@kayu/ui/web`. No new icons get added.

---

## §10. Mobile vs desktop

| | Mobile (< 768) | Desktop (≥ 768) |
|---|---|---|
| Layout | Single column | 1fr / 300 px grid; sticky aside `top: 20px` |
| Hero date | 26 px display | 32 px display |
| Hero price | Inlined in sub-line | Right-aligned block in the hero top row |
| Hero counterparty | Below the sub-line/strip, full-width | Same — single column below the top row |
| Step strip | 4 columns full-width | 4 columns full-width (constrained by main column) |
| Accord `KvGrid` | 2 columns | 3 columns (adds Référence) |
| Address row | Pin + body stacked left; link on right (auto-wraps below on < 360) | Pin + body left; link right, single row |
| Actions | `MobileStickyBar` fixed-bottom | `ActionsCard` in right rail |
| Details | Hidden (replaced by sub-line content) | `DetailsCard` in right rail |
| FinalOfferDialog | Bottom sheet, scrollable, grabber | Centred 520 px dialog |

Sticky bar uses `padding-bottom: env(safe-area-inset-bottom)` on iOS Safari.

---

## §11. State × perspective matrix (canonical)

This matrix governs the hero state strip, the Accord card variant, the mobile sticky bar, and the desktop actions rail. The implementation derives everything from `(v2Status, backendStatus, isClient, isPaid, offer != null, reviewed)`.

| (v2, backend, isPaid) | Client primary | Client left/aux | Provider primary | Provider left/aux |
|---|---|---|---|---|
| upcoming, PENDING, false | Message à {firstName} | Annuler (ghost-danger) | Confirmer la réservation | Enregistrer l'accord (secondary) |
| upcoming, CONFIRMED, false | Message à {firstName} | Annuler (ghost-danger) | Marquer comme terminée | Ajuster l'accord (secondary) |
| upcoming, IN_PROGRESS, false | Message à {firstName} | — | Marquer comme terminée | Message (secondary) |
| completed, COMPLETED, false | Message | — | Confirmer le paiement reçu | Message (secondary) |
| completed, COMPLETED, true (no review) | Laisser un avis ★ | Message (secondary) | Message | — |
| completed, COMPLETED, true (reviewed) | Réserver à nouveau | Message (secondary) | Message | — |
| cancelled, CANCELLED, * | Réserver à nouveau | Message (secondary) | Message | — |

"Marquer comme terminée" preserves the current two-step mutation (transition CONFIRMED → IN_PROGRESS → COMPLETED in one optimistic flow); no behavioural change.

---

## §12. Edge cases

- **Booking with no provider data** (corrupt foreign-key, very rare): counterparty row falls back to "—" + a generic role label. Message button is hidden when no `userId` is available.
- **Provider viewing their own client-side booking** (the user.id matches `clientId`): perspective stays `"client"` per existing rule in `BookingDetailPageClient`. No change.
- **No `scheduledDate`**: hero shows `"Date à confirmer"` in muted display style at 22 px instead of 26 px. Step strip and the rest are unchanged.
- **Long titles / descriptions**: title clips at 2 lines (`-webkit-line-clamp: 2`); description at 3 lines on mobile, full on desktop.
- **Address contains the commune already**: commune row in AddressRow hides (kept consistent with `fullAddress` behaviour today).
- **Empty address**: AddressRow renders the body as `"Adresse à confirmer"` (muted) and hides the Itinéraire link.
- **Verified flag missing on provider user**: hide the trailing check; never fabricate.
- **`commissionPct` missing on a booking**: default to 10 % (matches `QuoteBreakdown`'s fallback today).
- **Offer race**: clicking "Ajuster l'accord" while another tab confirms a different offer can put the dialog into a stale state. We accept this for v1 — the modal already re-seeds on `open: true` from `initialValues`, and a submit failure just surfaces the error inline.
- **react-query cache:** the rebuilt page invalidates the same query keys as today on every mutation. No behavioural change.

---

## §13. Acceptance criteria

The new page can render every state correctly with:

1. PENDING booking, no offer, client view → empty-client Accord, amber hero strip, sticky bar "Annuler" + "Message".
2. PENDING booking, no offer, provider view → empty-provider Accord with primary CTA, amber hero strip, sticky bar "Enregistrer l'accord" + "Confirmer la réservation".
3. CONFIRMED booking with offer, client view → registered-client Accord, green pulse chip, sticky bar "Annuler" + "Message".
4. CONFIRMED booking with offer, provider view → registered-provider Accord with commission block + "Ajuster" link, sticky bar "Ajuster l'accord" + "Marquer comme terminée".
5. IN_PROGRESS booking with `booking.progress`, client view → green hero strip with progress copy.
6. COMPLETED + paid booking, client view → neutral chip, receipt-style hero strip, "Laisser un avis ★" CTA until reviewed → "Réserver à nouveau" after.
7. COMPLETED + unpaid booking, provider view → amber "Paiement à confirmer" strip + "Confirmer le paiement reçu" CTA.
8. CANCELLED booking → rose-bordered hero, struck-through date, cancel reason strip, "Réserver à nouveau" CTA for client.
9. FinalOfferDialog → opens as a bottom sheet on mobile / centred dialog on desktop, validates the same way as today, shows the live Résumé block, submits the same payload as today.
10. Mobile 375 px and desktop 1280 px viewports render without horizontal overflow.
11. No gradients anywhere in the page (visual sweep / DOM grep for `gradient`).
12. No fake mini-map, no fake chat preview.

---

## §14. Out-of-scope follow-ups

- Real maps / itinerary in the AddressRow.
- Real chat last-message preview in the hero (needs a `lastMessage` field or a query against the messages module).
- "Appeler" call action (would need phone numbers on the user profile).
- Push / SMS reminders when the booking is < 1 h away.
- Receipt download / share for completed bookings.
- Mobile (Expo) implementation — separate spec when the Expo app catches up.
- Realtime updates via websockets / supabase channels — currently we rely on react-query refetches.

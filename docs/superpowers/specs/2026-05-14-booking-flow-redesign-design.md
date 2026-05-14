# Booking flow redesign — design

**Date:** 2026-05-14
**Scope:** `apps/web/src/app/book/[providerId]/`, `apps/web/src/components/booking/`, new shared task taxonomy in `packages/schemas`, new availability endpoint on `apps/backend/src/modules/providers/`, two new optional columns on `Booking`.
**Status:** Pending implementation plan.

## Goal

Rebuild the booking creation flow at `/book/[providerId]` so a client can move from "I want to book this person" to a confirmed booking in 4 explicit, well-scoped steps:

1. **Service** — pick a subcategory (when the provider has 2+) and a concrete task within that subcategory, with an optional duration estimate and free-text details.
2. **Date & heure** — pick a real, available slot, computed from the provider's weekly schedule, exceptions, and existing bookings.
3. **Adresse** — pick a Kinshasa commune, optional street, optional landmark.
4. **Récapitulatif** — review every block, jump back to edit, confirm.

Today's flow asks only for a vague "service type" (Dépannage urgent / Installation / Diagnostic / Rénovation), a fixed-options time picker that doesn't reflect availability, and a single free-text address. The redesign replaces hardcoded service pills with a category-aware taxonomy, wires the calendar to real provider availability, and structures the address.

The web app is the mobile experience until the Expo app ships. **Both viewports are designed as first-class layouts** — the design covers mobile (375 px) and desktop (≥768 px) explicitly; mockups for each are in `.superpowers/brainstorm/72420-1778746310/content/`.

## Non-goals

- No change to the post-confirm `KayouMoment` celebration screen.
- No change to `Provider` matching/discovery, search, or category browsing.
- No payment integration. Cash-at-end stays the model.
- No quote / final-offer flow changes (those are post-PENDING).
- No new admin tooling for managing the task taxonomy in v1 (it's a code constant).
- No expansion past Kinshasa for v1.
- No GPS / map-picker for address. Free text + commune dropdown only.
- No notifications redesign — backend already fires `BOOKING_NEW` on create.

## Required reading

Same as `2026-05-13-provider-details-redesign-design.md`:

1. `docs/design-direction/index.html` — visual direction (no gradients, Lucide icons, restrained color, etc.).
2. `packages/ui/src/tokens.ts` — canonical tokens.
3. The provider details spec for established patterns (avatar fallback ladder, trust ribbon styling, button conventions).

## Global design rules (inherited)

1. No gradient backgrounds. Flat surfaces.
2. Lucide icons only. Mockups use emoji placeholders for prototyping; production swaps each one for the matching Lucide icon (see "Icon mapping" §10).
3. Plain text for secondary metadata; chips for selection state and trust signals only.
4. Restrained color. Primary blue (`var(--k-primary)`) for selection; success green for availability dots and trust check; muted grey for off-states.
5. Tokens are the source of truth (`packages/ui/src/tokens.ts`).
6. Avatar fallback ladder: real `avatar` → initials in mono on beige `#F5F2E9` → Lucide `user` icon on beige.

## Page composition

```
<Layout>
  <BookingShell>                                 {/* sticky shell, every step */}
    <BookingTopBar />                            {/* back arrow + title */}
    <BookingStepper steps={4} current={n} />     {/* progress strip */}

    <BookingGrid>                                {/* 1fr on mobile, 1fr 320px on desktop */}
      <main>
        {step === 0 && <Step1Service />}
        {step === 1 && <Step2DateTime />}
        {step === 2 && <Step3Address />}
        {step === 3 && <Step4Recap />}
      </main>

      <aside>                                    {/* desktop only, sticky 20px from top */}
        <SidebarRail provider={...} draft={...} step={n} />
      </aside>
    </BookingGrid>

    <MobileStickyBar step={n} canAdvance={...} /> {/* mobile only */}
  </BookingShell>
</Layout>
```

- **Breakpoint** for the grid switch: `md` (768 px). Below: single column + `MobileStickyBar`. At/above: 1fr / 320 px grid + sticky aside.
- The aside is **not** rendered on Step 4 desktop in its summary form — it shows the price card + Confirm CTA only, because the main column is already the full recap (see §4).

## Client state

A single `useReducer` (or `useState` object) holds the draft until submit:

```ts
type BookingDraft = {
  // Step 1
  subcategoryId: string | null;
  taskKey: string | null;            // canonical key from CATEGORY_TASKS, or "__custom__"
  taskLabelOverride: string | null;  // when taskKey === "__custom__"
  durationMin: number | null;        // 60 | 120 | 240 | 480 | null ("À discuter")
  description: string;               // free text, optional

  // Step 2
  scheduledDate: string | null;      // YYYY-MM-DD
  scheduledTime: string | null;      // HH:mm

  // Step 3
  city: "Kinshasa";                  // hardcoded v1
  commune: string | null;            // one of KIN_COMMUNES
  street: string;                    // optional
  locationNote: string;              // optional
};
```

State persists in `sessionStorage` keyed by `providerId` so a refresh doesn't lose the draft. Cleared on successful submit or when the user navigates away from `/book/`.

## Submit payload

Final POST to existing `bookingsApi.create`:

```ts
{
  providerId: string,
  title: string,             // = task label (e.g. "Coupe") or taskLabelOverride
  description: string,       // = description (Step 1)
  address: string,           // = "{street}, {commune}, Kinshasa" (street omitted if empty)
  city: "Kinshasa",
  scheduledDate: Date,       // scheduledDate + scheduledTime combined
  duration: number | null,   // durationMin
  price: provider.hourlyRate || 0,  // unchanged
  clientNotes: string,       // = description + (locationNote ? `\nRepère: ${locationNote}` : "")
  // NEW optional structured fields:
  subcategoryId: string,
  commune: string,
}
```

The two new fields are accepted by the existing `CreateBookingBody` Zod schema (additive, optional) and persisted to two new `Booking` columns (see §6).

---

## §1. Step 1 — Service

### Composition

```
<Step1Service>
  <SectionLabel>Spécialité</SectionLabel>
  <SubcategoryChips />        {/* hidden if provider has only 1 subcategory */}

  <SectionLabel>Prestation</SectionLabel>
  <TaskRadioList>
    {tasks.map(task => <TaskRadioCard ... />)}
    <TaskRadioCard task="__custom__">Autre (préciser)…</TaskRadioCard>
  </TaskRadioList>

  {selectedTask === "__custom__" && (
    <Input placeholder="Décris la prestation en quelques mots" />
  )}

  <SectionLabel>Durée estimée</SectionLabel>
  <DurationChips>1h | 2h | Demi-journée | Journée | À discuter</DurationChips>

  <SectionLabel optional>Détails</SectionLabel>
  <Textarea placeholder="Précise le style, la longueur, les particularités…" />
  <Helper>Plus c'est précis, plus le pro arrive préparé.</Helper>
</Step1Service>
```

### Subcategory chips

- Source: `provider.subcategories` (already on the provider DTO).
- Hidden entirely when `subcategories.length <= 1`.
- Default selection: the subcategory with `isPrimary === true`. If none flagged, the first one.
- Visual: rounded pill, white surface + neutral border by default; black background + white text when active. 8 px gap, wraps freely.
- Interaction: tapping a chip switches the task list immediately and resets `taskKey` to `null`.

### Task radio list

- Source: `SUBCATEGORY_TASKS[subcategorySlug]` from the new shared constant (see §5).
- Each entry rendered as a card:
  - 14 px padding, 12 px gap between cards.
  - 1 px neutral border, white surface, `var(--k-r-md)` radius.
  - Selected state: 1 px primary border + 3 px primary glow ring (`box-shadow: 0 0 0 3px rgba(30,74,214,.12)`), trailing `Check` icon in primary.
  - Radio dot: 18 × 18 outline; selected becomes a filled primary dot (CSS-only, no native `<input>`).
- Always include `Autre (préciser)…` as the last entry (muted text). Selecting it reveals an `<input>` immediately below the list (single-line, max 60 chars). The custom label becomes `Booking.title`.
- Mobile: 1 column; Desktop: 2 columns. The "Autre" row spans the full width on desktop.

### Duration chips

- 5 options: `1 h`, `2 h`, `Demi-journée`, `Journée`, `À discuter`.
- Maps to `durationMin`: `60 | 120 | 240 | 480 | null`.
- **Default selection: `À discuter`** (no friction). Stored as `null`.
- Visual: same chip pattern as anywhere else (white + neutral border default, primary-subtle background + primary border + primary-hover text when active).
- Mobile: 3 columns; the 4th and 5th wrap to a second row (Journée gets one column, À discuter spans 2).
- Desktop: 5 equal columns on a single row.

### Description textarea

- Optional. `min-height: 80 px` mobile, `110 px` desktop.
- Placeholder copy is task-aware where useful (future polish; v1 uses one generic placeholder per category vertical: a `PLACEHOLDER_BY_CATEGORY[categorySlug]` map with sensible defaults). For v1 ship, accept the generic "Précise le style, la longueur, les particularités…" everywhere.
- Helper line below: `"Plus c'est précis, plus le pro arrive préparé."`

### Validation

- `Continuer` enabled when `taskKey != null` AND (`taskKey !== "__custom__"` OR `taskLabelOverride.trim().length >= 3`).
- Other fields always optional.

---

## §2. Step 2 — Date & heure

### Composition

```
<Step2DateTime>
  <SectionLabel>Mois</SectionLabel>
  <AvailabilityCalendar provider={...} onSelectDate={...} />

  <SectionLabel>Créneaux le {dayLabel}</SectionLabel>
  <PeriodFilter>Tout | Matin | Après-midi</PeriodFilter>
  <SlotGrid slots={slotsForSelectedDay} />
  <Helper>{provider.firstName} travaille de {workStart} à {workEnd}, créneaux d'1 h.</Helper>
</Step2DateTime>
```

Mobile stacks calendar then slots vertically. Desktop puts them in a 2-column grid (each panel boxed with white surface + neutral border).

### Availability calendar

- Component: `<AvailabilityCalendar />` (new, in `apps/web/src/components/booking/`).
- Renders one month at a time. Default visible month = today's month.
- Day states (computed from API response, see §6):
  - `available`: tappable; small green dot under the number.
  - `full`: tappable but selecting it shows an empty slots panel (rare; happens when partial day is taken). Number stays normal color, dot replaced with a thin grey bar.
  - `off`: dimmed grey, not tappable.
  - `past`: dimmed grey, not tappable.
  - `selected`: filled primary circle, white text.
- `< / >` controls in the header navigate months; refetches.
- Legend below: green dot "Disponible", grey bar "Complet". (No legend entry for "off" — that's just visually dim and self-evident.)
- On mount, the first `available` day at-or-after today is auto-selected.

### Period filter

- 3 chips: `Tout` (default), `Matin` (slots `< 12:00`), `Après-midi` (slots `>= 12:00`).
- Client-side only.

### Slot grid

- 4 columns (mobile + desktop).
- Each slot: `HH:mm` in monospace, 42 px height, `var(--k-r-md)` radius.
- States:
  - Default: white + neutral border.
  - Selected: primary-subtle background + primary border + primary-hover text.
  - Taken: muted background + struck-through text + `cursor: not-allowed`. Still rendered (so the user sees what's gone).
- Empty state: when no slots after period filtering, show:
  - "Aucun créneau libre ce jour" (muted)
  - "Voir le prochain disponible →" link that advances the calendar to the next `available` day in the API response.

### Validation

- `Continuer` enabled when `scheduledDate && scheduledTime` are both set.

---

## §3. Step 3 — Adresse

### Composition

```
<Step3Address>
  <CityPill>📍 Kinshasa · zone v1</CityPill>

  {recentAddresses.length > 0 && (
    <>
      <SectionLabel>Adresses récentes</SectionLabel>
      <RecentAddressChips />
    </>
  )}

  <SectionLabel>Commune</SectionLabel>
  <Select options={KIN_COMMUNES} />

  <SectionLabel optional>Avenue / rue, numéro</SectionLabel>
  <Input placeholder="Av. de la Justice, n° 42" />
  <Helper>Comme tu l'écrirais à un livreur.</Helper>

  <SectionLabel optional>Repère pour trouver l'endroit</SectionLabel>
  <Textarea placeholder="Ex. en face de la pharmacie Wenge, portail bleu…" />
</Step3Address>
```

### City pill

- Read-only. Beige background `#F5F2E9`, brown text `#7a5e2b`, MapPin icon.
- v1 only. When we add Brazzaville / Lubumbashi, this becomes a select with the same visual.

### Commune select

- Native `<select>` styled with custom chevron (no third-party library).
- Source: `KIN_COMMUNES` constant (new, in `packages/schemas`):

```ts
export const KIN_COMMUNES = [
  "Bandalungwa", "Barumbu", "Bumbu", "Gombe", "Kalamu", "Kasa-Vungu",
  "Kimbanseke", "Kinshasa", "Kintambo", "Kisenso", "Lemba", "Limete",
  "Lingwala", "Makala", "Maluku", "Masina", "Matete", "Mont Ngafula",
  "Ndjili", "Ngaba", "Ngaliema", "Ngiri-Ngiri", "Nsele", "Selembao",
] as const;
```

- Required to advance.
- Default: empty (placeholder "Choisir une commune"). Pre-filled from `User.address` when parseable (see "Pre-fill" below).

### Street input

- Optional, free text. Single line, 48 px height.

### Repère textarea

- Optional, 70 px min height.
- Helper on desktop: "Plus tu donnes de détails, plus le pro arrive sans appeler."

### Recent addresses

- Source: previous `Booking.address` for this client, deduped by `commune + street`, last 3, most recent first.
- Fetched via a new lightweight client-side query (see §6).
- Rendered as small pills above the form fields. Tapping one fills `commune`, `street`, and `locationNote` from the parsed previous booking.
- Active pill (matches current draft) is highlighted in primary-subtle.
- Hidden entirely when no prior bookings.

### Pre-fill (v1)

- New clients have `User.address = null` and `User.city = null` (no client onboarding step captures address today). So default pre-fill = blank fields with the Kinshasa pill, no recent chips on first booking.
- If `User.city === "Kinshasa"` and `User.address` parses as `"{street}, {commune}"`, pre-fill both fields. Otherwise leave blank.
- A future client onboarding step (out of scope here) will populate `User.address` and that pre-fill path will start firing.

### Validation

- `Continuer` enabled when `commune != null`. Street + locationNote always optional.

---

## §4. Step 4 — Récapitulatif

### Composition

```
<Step4Recap>
  <ProviderMiniCard />              {/* mobile only — desktop shows it in the rail */}
  <RecapCard title="Service" onEdit={() => goTo(0)}>
    <strong>{taskLabel}</strong> · {subcategoryName}
    <small>Durée estimée : {durationLabel}</small>
    {description && <em>"{description}"</em>}
  </RecapCard>
  <RecapCard title="Date & heure" onEdit={() => goTo(1)}>
    <strong>{dateLabel}</strong> · {scheduledTime}
  </RecapCard>
  <RecapCard title="Adresse" onEdit={() => goTo(2)}>
    <strong>{street || "(Adresse à préciser sur place)"}</strong>
    <small>{commune}, Kinshasa</small>
    {locationNote && <em>"{locationNote}"</em>}
  </RecapCard>
  <PriceCard />                     {/* mobile only — desktop shows it in the rail */}
  <TermsLine />
</Step4Recap>
```

### Recap cards

- Same surface treatment as form sections (white, 1 px neutral border, `var(--k-r-lg)` radius, 14×16 padding).
- Header row: tiny uppercase label on the left (with a Lucide icon), `Modifier` link on the right (`var(--k-primary)`, 12 px, semibold).
- Body: 3 lines max per card. Long descriptions clip with ellipsis after 3 lines on mobile (full on desktop).
- "Modifier" sets the step index back to the matching step but keeps all other state intact. Stepper bars adjust.

### Price card

- Same composition as today's Step 3 price block (kept). Surface `var(--k-surface-primary)`, border `#BAE6FD`.
- Lines:
  - "Prix de départ" — monospace `{startingPrice} FC`.
  - "Paiement" — "Espèces à la fin".
  - Divider.
  - "Prix indicatif" total — large monospace `≥ {startingPrice} FC` in primary-hover color.
- Trust line below: green Check icon + "Le prix final est convenu avec {firstName} avant l'intervention. Aucun paiement en ligne."

### Confirm action

- Mobile: Confirm CTA in the sticky bottom bar (label "Confirmer ✓"). Retour stays alongside.
- Desktop: Confirm sits inside the right rail's price card (label "Confirmer la réservation ✓"). Retour as a smaller secondary button below.
- Loading: button disables, label becomes "Envoi…" (existing pattern).

### On submit error

- Generic error: toast in place, draft preserved.
- 409 (slot conflict — slot was taken between Step 2 fetch and confirm): show a banner at the top of Step 4 ("Ce créneau vient d'être pris. Choisis un autre horaire."), then auto-jump back to Step 2 with the same date pre-selected (slots refetched).

### On success

- Redirect to the existing `KayouMoment` celebration screen (no change). Clear the `sessionStorage` draft.

---

## §5. Shared task taxonomy (`packages/schemas`)

New file `packages/schemas/src/tasks.ts`:

```ts
export const SUBCATEGORY_TASKS: Record<string, readonly string[]> = {
  // Bâtiment & Construction
  "maconnerie":         ["Travaux neufs", "Réparation", "Rénovation", "Devis sur place"],
  "platrerie":          ["Pose", "Réparation", "Devis sur place"],
  "carrelage":          ["Pose", "Réparation", "Devis sur place"],
  "peinture":           ["Intérieur", "Extérieur", "Retouche", "Devis sur place"],
  "toiture":            ["Réparation urgente", "Étanchéité", "Inspection", "Refonte"],
  // Plomberie & Sanitaire
  "plomberie-generale": ["Dépannage urgent", "Installation", "Diagnostic", "Devis"],
  "sanitaires":         ["Pose WC / lavabo", "Réparation fuite", "Détartrage", "Devis"],
  // Électricité
  "electricite-generale":   ["Dépannage urgent", "Installation", "Diagnostic", "Mise aux normes"],
  "electricite-automobile": ["Diagnostic", "Réparation", "Pose accessoires"],
  "climatisation":          ["Installation", "Entretien", "Réparation", "Recharge gaz"],
  // Menuiserie & Ébénisterie
  "menuiserie-bois":      ["Sur mesure", "Pose porte / fenêtre", "Réparation", "Devis"],
  "menuiserie-aluminium": ["Pose porte / fenêtre", "Réparation", "Devis"],
  "agencement":           ["Cuisine", "Dressing", "Bureau", "Devis"],
  // Métallerie & Serrurerie
  "serrurerie":          ["Dépannage urgent", "Changement serrure", "Pose blindage", "Devis"],
  "metallerie":          ["Portail / grille", "Réparation", "Sur mesure", "Devis"],
  // Automobile
  "mecanique-auto":      ["Vidange", "Diagnostic", "Réparation", "Révision"],
  "carrosserie":         ["Bosse / rayure", "Peinture", "Devis"],
  "pneumatiques":        ["Changement", "Équilibrage", "Réparation crevaison"],
  // Beauté & Bien-être
  "coiffure":            ["Coupe", "Tresses", "Coloration", "Soin"],
  "esthetique":          ["Manucure", "Pédicure", "Soin visage", "Maquillage"],
  "bien-etre":           ["Massage", "Spa"],
  // Mode & Textile
  "couture":             ["Sur mesure", "Retouches", "Réparation"],
  "nettoyage-textile":   ["Lavage", "Pressing", "Détachage"],
  // Maison & Entretien
  "nettoyage":           ["Ménage standard", "Grand nettoyage", "Vitres", "Après chantier"],
  "jardinage":           ["Tonte", "Taille", "Entretien régulier", "Aménagement"],
  "demenagement":        ["Petit volume", "Grand volume", "Démontage / montage"],
  // Enfance & Garde
  "garde-enfants":       ["Ponctuel", "Régulier", "Soir / week-end"],
  "education":           ["Soutien scolaire", "Cours particuliers", "Aide aux devoirs"],
  // Santé & Sport
  "soins-domicile":      ["Soin infirmier", "Visite médicale", "Suivi régulier"],
  "sport":               ["Coaching personnel", "Programme régulier", "Cours d'essai"],
  // Informatique & Tech
  "developpement":       ["Site web", "Application", "Maintenance", "Devis"],
  "support-informatique":["Dépannage urgent", "Installation", "Formation"],
  "reseaux":             ["Installation", "Dépannage", "Diagnostic"],
  // Transport & Logistique
  "transport-personnes": ["Course unique", "Aller-retour", "Trajet long"],
  "livraison":           ["Course express", "Standard", "Volumineux"],
  // Événementiel
  "organisation-evenements": ["Mariage", "Anniversaire", "Événement pro"],
  "animation":               ["DJ", "MC", "Spectacle"],
  "traiteur":                ["Cocktail", "Buffet", "Service complet"],
  // Sécurité
  "gardiennage":         ["Ponctuel", "Régulier", "Événement"],
  "protection":          ["Garde rapprochée", "Surveillance", "Conseil"],
};

export const CUSTOM_TASK_KEY = "__custom__";

export function getTasksForSubcategory(slug: string): readonly string[] {
  return SUBCATEGORY_TASKS[slug] ?? [];
}
```

- Imported by both `apps/web` and (later) `apps/mobile`.
- The "Autre" entry is added in the UI layer, not in the constant.
- Subcategories not in this map (none in the current seed, but defensively) get an empty array → Step 1 would only show "Autre", which is acceptable.

---

## §6. Backend changes

### 6.1 New `Booking` columns

Migration adds two optional columns:

```prisma
model Booking {
  // … existing fields …
  subcategoryId String?
  subcategory   Subcategory? @relation(fields: [subcategoryId], references: [id])
  commune       String?

  @@index([subcategoryId])
}
```

- Both nullable for backwards compatibility (existing rows have neither).
- `subcategoryId` is a real FK, not just a slug string, so admin / analytics can join.
- `commune` is a free string (kept loosely typed at the DB layer; the Zod schema enforces membership in `KIN_COMMUNES`).

### 6.2 New availability endpoint

```
GET /providers/:id/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Response:

```ts
{
  days: Array<{
    date: string;                            // YYYY-MM-DD
    status: "available" | "off" | "full" | "past";
    slots: string[];                         // HH:mm, only when status === "available"
  }>;
  workWindow: { start: string; end: string } | null;  // e.g. { start: "08:00", end: "18:00" }
}
```

Computation per day in range:

1. Look up `AvailabilitySchedule` for the day's `dayOfWeek`. If none or `isAvailable === false` → `status: "off"`.
2. Look up `AvailabilityException` for that exact date. If found and `isAvailable === false` → `status: "off"` (overrides #1). If found and `isAvailable === true` → use the schedule window from #1; if #1 had `isAvailable === false`, the exception alone is not enough to open the day → still `off`. (v1 rule: the weekly schedule defines the window; exceptions can only narrow availability, never invent new hours.)
3. Past days (date < today, server local) → `status: "past"`.
4. Generate 1-hour slot starts in `[start, end - 60min]`. For today, drop slots whose start is in the past (server local time).
5. For each slot, check overlap with existing `Booking`s for this provider where `status IN ('PENDING','CONFIRMED','IN_PROGRESS')`. A booking with `scheduledDate = T` and `duration = D` (minutes; default 60 if null) blocks slots in `[T, T + D)`. Any slot whose `[slotStart, slotStart + 60min)` intersects a booked range is dropped.
6. If any slots remain → `status: "available"`, `slots: [...]`. If none → `status: "full"`.

`workWindow` is computed from the most recent `AvailabilitySchedule` entry across the queried days (purely informational for the "Sarah travaille de … à …" helper line). Returns `null` when the provider has no schedule entries.

Implemented in a new file `apps/backend/src/modules/providers/providers-availability.service.ts` (the `providers` module already exists; adding a new service avoids bloating any existing file). Controller route lives in `providers.controller.ts`.

Tested via `node:test` with hand-rolled Prisma fakes, per backend convention.

### 6.3 Slot conflict at create time

`bookings.service.ts#create` gains a check before insert:

- Compute the slot window `[scheduledDate, scheduledDate + (duration ?? 60)min)`.
- Find any `Booking` for this provider with `status IN ('PENDING','CONFIRMED','IN_PROGRESS')` whose `[scheduledDate, +duration)` intersects.
- If found: throw `ConflictException` (HTTP 409) with code `SLOT_TAKEN`.

Frontend recognises 409 + `SLOT_TAKEN` and triggers the "slot got taken" recovery flow (banner + jump to Step 2).

### 6.4 New "recent addresses" endpoint

```
GET /me/recent-addresses?limit=3
```

Returns:

```ts
Array<{
  commune: string | null;
  street: string | null;          // best-effort parse
  raw: string;                    // raw Booking.address as fallback
  lastUsedAt: string;             // ISO
}>;
```

Implementation: `SELECT DISTINCT address, commune, MAX(createdAt) FROM bookings WHERE clientId = ? AND address IS NOT NULL GROUP BY address, commune ORDER BY MAX(createdAt) DESC LIMIT N`. Parse `address` string into `street` by splitting on the first `,` and removing the commune segment.

Lives in a new endpoint in `apps/backend/src/modules/users/` (existing module).

### 6.5 DTO updates (`packages/schemas`)

`CreateBookingBody` Zod schema gains two optional fields:

```ts
{
  // … existing fields …
  subcategoryId: z.string().optional(),
  commune: z.enum(KIN_COMMUNES_TUPLE).optional(),
}
```

`AvailabilityQuery` and `AvailabilityResponse` schemas added.

`RecentAddressesResponse` schema added.

Typed client wrappers added in `packages/api/src/endpoints.ts`:

- `providersApi.availability(id, { from, to })`
- `usersApi.recentAddresses({ limit })`

---

## §7. Component breakdown

New components, all in `apps/web/src/components/booking/`:

| Component | Purpose |
|---|---|
| `BookingShell` | Top bar + stepper + grid + mobile sticky bar. Owns the step state. |
| `BookingStepper` | 4-bar progress strip with active/done states. |
| `MobileStickyBar` | Fixed-bottom CTA row for mobile. Hidden ≥ md. |
| `SidebarRail` | Sticky right rail for desktop (provider mini + live recap + price + CTA). Variant prop switches between "summary" (Steps 1–3) and "confirm" (Step 4). |
| `Step1Service` | Subcategory chips + tasks + duration + description. |
| `Step2DateTime` | AvailabilityCalendar + period filter + slot grid. |
| `Step3Address` | City pill + recents + commune + street + repère. |
| `Step4Recap` | Recap cards + price card + terms. |
| `AvailabilityCalendar` | Month view with availability dots. Generic enough that future flows can reuse it. |
| `RecapCard` | `{ title, icon, children, onEdit }`. Used 3× on Step 4. |

The existing `BookingFlowClient.tsx` is rewritten end-to-end. The existing inline `MiniCalendar` and `SumRow` helpers go away (replaced by `AvailabilityCalendar` and `RecapCard`).

`apps/web/src/components/booking/BookingCalendar.tsx` (today's only file in that folder) is unrelated to this redesign — it's the **provider's** schedule view, not the client's pick-a-slot calendar. Untouched.

---

## §8. Mobile vs desktop

| | Mobile (< 768) | Desktop (≥ 768) |
|---|---|---|
| Layout | Single column, full-width content | 1fr / 320 px grid; sticky aside |
| Provider card | Top of every step | In the right rail |
| Stepper | Compact labels (`1 · Service`) | Full labels (`1 · Service`, `2 · Date & heure`, `4 · Récapitulatif`) |
| CTA | Sticky bottom bar (Retour + Continuer / Confirmer) | Inside right rail (Continuer / Confirmer + Retour underneath) |
| Step 1 tasks grid | 1 column | 2 columns |
| Step 1 duration chips | 3 columns, wraps to 2 rows | 5 columns, single row |
| Step 2 calendar/slots | Stacked vertically | Side-by-side panels |
| Step 3 commune + street | Stacked | One row (200 px / 1fr) |
| Step 4 right rail | n/a | Price card + Confirm CTA only (main column is the recap) |

Sticky bottom bar uses `padding-bottom: env(safe-area-inset-bottom)` on iOS Safari.

---

## §9. Edge cases

- **Provider with zero subcategories**: hide the chip row, show only "Autre (préciser)…" in the task list. Custom title becomes `Booking.title`. Acceptable for v1; in practice every provider will have at least one subcategory after onboarding.
- **Provider with no `AvailabilitySchedule`**: `/availability` returns all days as `off`. UI shows "Ce pro n'a pas encore configuré son agenda" with a fallback CTA "Demander un créneau" that lets the client send the booking with `scheduledDate = null`. (Backend already accepts null `scheduledDate`.)
- **Selected slot duration overflows day**: if a 4 h or 8 h duration is chosen and not enough consecutive slots are free, we still let the user confirm that single-hour slot — the duration is indicative, the provider sorts out the actual scheduling. (No tighter validation in v1; revisit when we add real calendar integration.)
- **Description length**: capped at 500 chars in the textarea (counter shown when > 400).
- **User unauthenticated** (current behavior, kept): on Confirm, redirect to `/auth` and bounce back.
- **Past date selection via deep-link**: ignored; calendar auto-advances to the next month.
- **No internet on submit**: existing `useMutation` toast catches `Error`; we keep that.

---

## §10. Icon mapping (Lucide)

Mockups use emoji as quick stand-ins. Production uses Lucide:

| Mockup | Lucide |
|---|---|
| 📅 | `Calendar` |
| 📍 | `MapPin` |
| ✂︎ | `Scissors` (or category icon, see below) |
| ✓ in trust line | `Check` (success color) |
| ★ rating | `Star` (filled, warning color) |
| ← back | `ArrowLeft` |
| → continue | `ArrowRight` |
| Lock on city pill | `Lock` (subtle) |

The Step 4 "Service" recap card uses the **subcategory's category icon** (already in `Category.icon` as a Lucide name like `"Sparkles"`, `"Zap"`, etc.) instead of a generic scissors. Falls back to `Briefcase` when icon name is unknown.

---

## §11. Acceptance criteria

A booking can be created successfully through the new 4-step flow with:

1. A provider that has 2+ subcategories (chips visible).
2. A provider that has 1 subcategory (chips hidden, list jumps straight in).
3. A provider with zero `AvailabilitySchedule` rows (fallback "demander un créneau" path works).
4. A custom "Autre" task with override label.
5. Each duration option (60 / 120 / 240 / 480 / null).
6. Each commune from `KIN_COMMUNES`.
7. A simulated 409 race condition (taken-mid-flow) routes back to Step 2 with a banner.
8. After confirm, the existing `KayouMoment` screen renders with the new booking ID.
9. Both mobile (375 px / 414 px) and desktop (1280 px / 1440 px) viewports render without horizontal overflow and with the documented layout differences.
10. Refreshing mid-flow restores the draft from `sessionStorage`.
11. Backend tests (Vitest / `node:test`) cover: availability computation (off / full / available / past), 1-h slot generation, exception override, and slot-conflict 409.

---

## §12. Out-of-scope follow-ups (intentionally deferred)

- Map picker for address (GPS or pin drop).
- Multi-city support.
- Per-task pricing or duration metadata in the taxonomy.
- Admin UI to edit the task constants without a deploy.
- Saved client addresses as a first-class profile field (currently relies on past bookings).
- Variable slot length per provider (15 / 30 / 60 / 90 min).
- Notification / SMS preview ("on enverra un SMS à Sarah à 11:00 jeudi").
- Pre-fill from past bookings beyond address (e.g. last task chosen).

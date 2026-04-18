# DS05 — Write Review upgrade

## Goal

Rewrite the review submission flow: 5-dimension KAYOU rating (Ponctualité · Qualité · Communication · Rapport qualité-prix · Professionnalisme), quick-tags chip cloud, optional photo upload, and a written review. Web is a single-page form with an overall-score banner; mobile is a 3-step wizard.

## Why it matters

KAYOU's differentiator is the 5-dimension rating system. The v1 `ReviewScreen` on mobile predates this design — it was a placeholder with overall stars only. The review loop is how trust signals accumulate in the marketplace; getting this flow right is launch-critical for pro quality.

## Scope

### In scope
- New `WriteReview` screen, web route `/review/[providerId]`, mobile screen replacing v1 `ReviewScreen`
- 5-dimension rating with `DimensionRow` component — icon + label + description + 5-star row + live numeric score
- Overall-score banner (web only) — computed from the 5 dimensions, displayed with 5 big stars and a large numeric
- Quick-tags chip cloud (10 preset tags) — multi-select
- Optional photos — dashed-border uploader + tile previews (placeholder: no real upload, just a UI state)
- Required written review ≥ 10 characters
- Submit → success screen with green check circle + "Merci pour ton avis !" + CTA "Retour à l'accueil"
- Navigation from: MyBookings "Laisser un avis", BookingDetail "Laisser un avis", Booking flow after Kayou Moment

### Out of scope
- Actual photo upload to cloud storage — this chunk is UI-only, upload endpoints come later
- Review editing after submit
- Pro responses to reviews — client-side only here
- Admin moderation of reviews — part of DS10

## Reference files
- `prototype/components/WriteReview.jsx` — 408 lines. Contains `REVIEW_DIMENSIONS`, `QUICK_TAGS`, `DimensionRow`, `ReviewForm`, `ReviewSuccess`
- Existing `apps/mobile/src/screens/bookings/ReviewScreen.tsx` — v1 placeholder, retire

## Data contract

```ts
type ReviewPayload = {
  providerId: string
  bookingId?: string  // if coming from a booking context
  ratings: {
    punctuality: 1..5
    quality: 1..5
    communication: 1..5
    value: 1..5
    professionalism: 1..5
  }
  tags: string[]  // subset of QUICK_TAGS
  text: string   // min 10 chars
  photoCount: number  // placeholder for real file count later
}
```

`overall` is computed on submit: `avg(ratings) rounded to 1 decimal`.

## DimensionRow

Props: `dim: Dimension`, `value: 0..5`, `onChange(v)`, `mobile: boolean`

```
┌─────────────────────────────────────────┐
│ [icon]  Ponctualité                 4.0 │  ← top row with numeric on right
│         Arrivé à l'heure ?              │
│                                         │
│         [★][★][★][★][☆]                 │  ← 5 rating buttons at paddingLeft 48
└─────────────────────────────────────────┘
```

- Icon: 18px, Sky-hover color, on 36×36 Sky-subtle rounded-square (radius 10)
- Label: Display 16px (web) / 15px (mobile), 600 weight
- Description: caption below label
- Numeric on right: mono, 15px, 600 weight, only shown when value > 0
- Rating buttons: 40×40 (web) / 36×36 (mobile), radius 10
  - Filled (value >= n): Amber border, amber-subtle bg, Amber star icon
  - Empty (value < n): Slate-200 border, surface bg, Slate-subtle star icon
- Divider: 1px Slate-subtle bottom

## QUICK_TAGS (10 tags)

```
"Ponctuel", "Travail propre", "Bon communicant", "Prix honnête",
"Je recommande", "Expert dans son domaine", "Conseils utiles",
"Matériel de qualité", "Chantier bien rangé", "Réactif"
```

Tags render as pills:
- Unselected: 1px Slate-200 border, surface bg, Slate-body text
- Selected: 1px Sky-primary border, Sky-subtle bg, Sky-hover text, leading check icon (13px)

## Layouts

### Web (single-page)

```
┌──────────────────────────────────────────┐
│ ← Retour                                  │
│                                           │
│ [Avatar 64]  Mission terminée             │
│              Comment était Jean ?         │
│              Plomberie · Gombe · aujourd'hui │
│                                           │
│ ┌─ Overall banner ─────────────────┐      │
│ │ Note globale                      │      │
│ │ 4.8 / 5      ★★★★★               │      │
│ │              Calculée automatiquement   │
│ └──────────────────────────────────┘      │
│                                           │
│ NOTE DÉTAILLÉE                           │
│ 5 dimensions. Touchez où c'est important. │
│                                           │
│ [DimensionRow × 5]                        │
│                                           │
│ QU'EST-CE QUI S'EST BIEN PASSÉ ?          │
│ [Quick tags chip cloud]                    │
│                                           │
│ VOTRE AVIS ÉCRIT                          │
│ [Textarea, min 120px tall]                │
│ xxx caractères                           │
│                                           │
│ PHOTOS (OPTIONNEL)                        │
│ [80x80 tiles + dashed-border + button]    │
│                                           │
│ ─────────────────────                    │
│ [Plus tard]   [Publier l'avis → ]         │
└──────────────────────────────────────────┘
```

- Max width 680, padding 32 32 64
- Overall banner: amber-subtle → surface-amber gradient bg, 1px `#FCD34D` border if any rating is filled; Sky-subtle if all empty
- Provider block at top: 64px Avatar + caption "Mission terminée" + H1 question + body-muted context

### Mobile (3-step wizard)

```
Step 1: Notez la mission
Step 2: Ce qui a fonctionné (+ optional photos)
Step 3: Ajoutez un avis écrit
```

Each step:
- Top row: back arrow (step 1 → onCancel, later steps → decrement) + "Étape N / 3" caption
- 3-segment progress bar (3px tall, primary-filled up to current step)
- Provider tag row (44px Avatar + name/profession)
- H2 heading (step-specific title)
- Step content
- Sticky submit button at bottom: "Continuer" for steps 1/2, "Publier l'avis" for step 3

### Step 1 (mobile) — Rating
Just the 5 `DimensionRow` components stacked. `canAdvance` = all 5 rated.

### Step 2 (mobile) — Tags + optional photos
Quick tags cloud; photos block below.

### Step 3 (mobile) — Written review
Textarea (minHeight 180) + character counter. `canAdvance` = `text.length >= 10`.

## Photos uploader

Placeholder behavior:
- Tile state: 80×80 (web) / 72×72 (mobile), radius 12, light blue gradient background (`linear-gradient(135deg, #E0F2FE, #BAE6FD)`)
- Add tile: same dimensions, 2px dashed Slate-strong border, transparent bg, plus icon + "Ajouter" caption
- Click: pushes a placeholder value to the `photos` array. No actual upload yet.

The backend endpoint for photo upload is deferred; DS05 ships the UI only. Flag this in PROGRESS if the upload endpoint doesn't exist.

## Success state

After submit:
- Full screen, Sand bg, centered
- 88×88 success circle (success-subtle bg, success color, 44px check icon, emerald shadow)
- H2 "Merci pour ton avis !"
- Body-L muted "Ta note aide la communauté à trouver les bons pros. Jean sera notifié."
- Primary lg button "Retour à l'accueil" → nav("home") OR nav("bookings") depending on entry point

## Routing

Entry points:
1. MyBookings completed card → "Laisser un avis →" → `/review/:providerId?bookingId=...`
2. BookingDetail completed client view → "Laisser un avis" button → same
3. Kayou Moment confirm → `/review/:providerId?fromBooking=1` (via DS01's booking→review chain)

All three pass a `providerId` param; `bookingId` is optional but helps scope the review to a specific job. On submit, POST to backend review endpoint with `{ providerId, bookingId?, ratings, tags, text, photoCount }`.

Back behavior:
- If from MyBookings: back returns to MyBookings
- If from BookingDetail: back returns to BookingDetail
- If from booking flow (replace, not push): back bounces out to home (expected — booking is done)

## What to retire

Mobile:
- `apps/mobile/src/screens/bookings/ReviewScreen.tsx` — rewrite in place with the v2 3-step wizard

Web: new route.

## Dependencies
- Depends on DS01 (icons, booking→review routing)
- Depends on DS03 (the "Laisser un avis" CTAs originate from MyBookings/BookingDetail)
- Blocks: DS11 audit

## Acceptance criteria

1. Web `/review/[providerId]` renders the single-page form with overall-score banner that updates live as ratings fill
2. Mobile 3-step wizard with correct titles per step
3. 5 dimensions each require an independent rating; submit disabled until all 5 rated AND `text.length >= 10`
4. Quick tags are multi-select; selected state shows check icon + Sky styling
5. Photo uploader is a placeholder (UI only); clicking "Ajouter" adds a tile to the array
6. Success screen renders after submit with the correct provider's first name
7. Back navigation respects the entry-point rules

## QA checklist
- [ ] Overall score updates immediately when a rating changes (no debounce)
- [ ] "X caractères" counter updates live on textarea
- [ ] Submit is disabled (50% opacity + `not-allowed` cursor) until valid
- [ ] Progress bar on mobile fills primary for the current + past steps
- [ ] DimensionRow icons match the 5 dims (clock, sparkles, messageCircle, coins, shieldCheck)
- [ ] Unselected star in rating button uses Slate-subtle color, not Amber
- [ ] Tapping a filled star unfills it? (Spec choice: tapping a rating sets it; tapping the same rating keeps it. Alt: tapping score N with current = N could clear. Default = set-only.)
- [ ] Photo tiles use `linear-gradient(135deg, #E0F2FE, #BAE6FD)` bg (not a random color)
- [ ] Mobile sticky submit doesn't overlap the bottom tab bar (tab bar is hidden on this screen per DS01 hide list)
- [ ] Submit payload includes `overall = avg(ratings).toFixed(1)` for server convenience
- [ ] Success state "Retour à l'accueil" sends to `/` (client) or `/pro` (pro — unlikely but handle it)
- [ ] If the review already exists for this booking (returning user re-visits), show a read-only version with a "Votre avis précédent" badge instead of the form (backend-driven, add TODO)

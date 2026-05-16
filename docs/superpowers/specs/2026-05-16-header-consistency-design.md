# Header consistency redesign

**Date:** 2026-05-16
**Status:** Approved (design)
**Surface:** `apps/web/src/components/layout/Header.tsx`

## Problem

The global header has three defects:

1. **Duplicate wordmark.** The header renders the `kayou-logo-transparent.png`
   image (which *is* the full "kayou" wordmark) and an additional
   `<span>KAYOU</span>` text node beside it. The brand reads twice.
2. **Duplicated / wrong nav destinations.** The nav array is:
   - `Trouver un pro` → `/services`
   - `Catégories` → `/services`  *(duplicate of the above)*
   - `Comment ça marche` → `/#how-it-works`
   - `Devenir pro` → `/services`  *(wrong — should lead to signup)*

   There is no categories-index route in the app (`/categories` only has
   `[slug]`), and `/pro` is the logged-in provider space, not a "become a pro"
   landing.
3. **No defined behavior across audiences.** The nav is the same array for
   everyone, including showing `Devenir pro` to users who are already
   providers.

## Decisions

| Question | Decision |
|---|---|
| Logo | Remove the redundant `KAYOU` text span. Keep the image only, rendered slightly larger for crispness. Logo remains a link to `/`. |
| Nav items | Three items only. Drop `Catégories` (pure duplicate of `Trouver un pro`; the homepage already has the full category grid + "Voir toutes les catégories"). |
| Consistency model | Identical header for guests, clients, and providers — with **one** exception: logged-in providers do not see `Devenir pro`. |
| `Devenir pro` destination | `/auth?mode=signup` (was `/services`). |

## Specification

### Logo

- Remove the `<span>` wordmark element entirely.
- Keep `<Image src="/kayou-logo-transparent.png">` as the only brand element,
  linking to `/`. Render at 36px height (was 30px) with `w-auto`; keep
  `priority`. Increase the intrinsic `width`/`height` props proportionally so
  Next.js serves a sharp asset.

### Navigation list

The single source of truth becomes a derived list, computed from auth state,
consumed by **both** the desktop bar and the mobile drawer (so they can never
drift apart again):

| Label | Destination | Shown to |
|---|---|---|
| `Trouver un pro` | `/services` | everyone |
| `Comment ça marche` | `/#how-it-works` | everyone |
| `Devenir pro` | `/auth?mode=signup` | everyone **except** logged-in providers (`user?.role === "PROVIDER"`) |

`Catégories` is removed.

### Right-side control (unchanged behavior)

- Guests: `Se connecter` (ghost) + `S'inscrire` (primary).
- Logged-in (client / provider / admin): existing avatar dropdown on desktop,
  existing avatar block in the mobile drawer.

### Per-audience visual states

```
DESKTOP (≥lg)
Guest     [kayou]  Trouver un pro  Comment ça marche  Devenir pro   [Se connecter] [S'inscrire]
Client    [kayou]  Trouver un pro  Comment ça marche  Devenir pro                     ( AM ▾ )
Provider  [kayou]  Trouver un pro  Comment ça marche                                  ( AM ▾ )

MOBILE (<lg) collapsed
All       [kayou]                                                                         [≡]

MOBILE drawer open
Guest                 Client                 Provider
• Trouver un pro      • Trouver un pro       • Trouver un pro
• Comment ça marche   • Comment ça marche    • Comment ça marche
• Devenir pro         • Devenir pro          ──────────────
──────────────        ──────────────          (avatar · name/email)
[Se connecter]        (avatar · name/email)  [Tableau de bord]
[S'inscrire]          [Tableau de bord]      [Déconnexion]
                      [Déconnexion]
```

## Files touched

- `apps/web/src/components/layout/Header.tsx` — remove text wordmark; replace
  the static `navigation` constant with an auth-derived list; render that list
  in the desktop nav (lines ~90–101) and the mobile drawer (lines ~200–214);
  fix the `Devenir pro` href.
- `docs/DESIGN_SYSTEM.md` §9.1 — update the documented nav list
  (currently `Trouver un pro · Catégories · Comment ça marche · Devenir pro`)
  to match the new 3-item nav, so the doc stays truthful.

## Non-goals

- The desktop avatar dropdown lists more items (réservations, favoris,
  paramètres) than the mobile drawer (dashboard, logout). This pre-existing
  mismatch is unrelated to this request and is intentionally left untouched.
- No change to header styling, sticky/blur behavior, or the hamburger
  animation.
- No new routes or pages (no categories-index, no dedicated `Devenir pro`
  landing).

## Acceptance criteria

- Header shows the logo image once, with no adjacent "KAYOU" text.
- Nav has exactly: `Trouver un pro`, `Comment ça marche`, `Devenir pro`
  (the last hidden when the logged-in user is a provider).
- `Devenir pro` navigates to `/auth?mode=signup`.
- Desktop bar and mobile drawer show the same nav items for the same user.
- Guest sees login/signup; logged-in users see the avatar control — unchanged.
- `npm run type-check` passes in `apps/web`.

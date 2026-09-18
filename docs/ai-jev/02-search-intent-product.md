# Search intent in `/rechercher`: product spec

Status: built and verified 2026-09-19 on `experiment/jev-search`, uncommitted, awaiting owner review. Screenshots replace mockups (owner, 2026-09-19): the only UI change is one chip on an existing page.
Evidence: `01-search-intent.md` and `results/2026-09-19/report.md` (`flat-fr` passes the bar; Lingala is a nice-to-have).

## Behaviour

A client types "fuite d'eau sous l'évier". Today they get nothing. With this change, the results also include every provider in Bâtiment › Plomberie. Above the results, a chip reads « Inclut aussi : Plomberie », with a button to remove it.

### Widen, never narrow

Jev's answer is added to the text search with an OR; it never replaces it:

```
text matches (unchanged)  OR  providers in the interpreted subcategory (or category)
```

- A provider whose profile matches the typed text is always in the results, as today. A wrong interpretation adds irrelevant providers; it cannot hide the right one. The experiment's wrong-filter rate (1.4%) becomes a rate of "some extra results", not of lost results.
- With nothing to hide, a "filtered search found nothing" fallback is unnecessary.
- The other filters (place, rating, verified, premium, language, mode) still apply to the whole set.

### When Jev is asked

Every condition must hold, otherwise the search runs exactly as today and makes no call:

- The `feat_jev_search` setting is on. It defaults to off and has a toggle under Admin › Contenu › Fonctionnalités.
- `TYPESAFE_API_KEY` is set on the server.
- `q` is at least 3 characters after trimming.
- The client has not picked a category, specialty or service in the filters; an explicit choice wins.
- The request does not carry `interpret=false`, which the chip's remove button sends.

The assistant's `search_providers` tool calls `ProvidersService.search` directly and never goes through this path.

### The decision

`flat-fr` with the thresholds tuned on 2026-09-19: name ≥ 0.5 gives no interpretation; top subcategory ≥ 0.95 gives that subcategory; best category total ≥ 0.55 gives that category; otherwise nothing. Every threshold is pinned to `jev-1.13.0`. A version change means a rerun of the eval, not an alias bump.

### Latency and failure

- The search waits at most 800 ms for Jev (the experiment's p95 bar). A slower answer does not hold the search but keeps running, up to a 5 s request timeout, and lands in the cache for the next identical search. On any error the search runs without an interpretation, logs a warning, and caches nothing. No retry.
- The first build aborted the request at 600 ms. An aborted request closes its TLS connection, the next call paid a cold handshake (700–960 ms measured from the development laptop against 280 ms warm), timed out in turn, and every search ran without Jev. Hence the budget above, and the next point.
- The Jev client uses an undici agent that keeps idle connections for 5 minutes (Node's fetch default is 4 s), and makes one warm-up call at boot. A search after more than 5 idle minutes can still miss the budget once.
- Answers are cached in memory for 10 minutes, keyed by the lower-cased, space-collapsed query, up to 1,000 entries. Concurrent identical requests share one call. Page 2 of a search therefore reuses page 1's answer.
- The debounce on the search field (250 ms) plus the cache keeps calls well under the 1,200 requests per minute of the account.
- Measured on the verification stack: 320–650 ms for a first search including Jev, about 40 ms for a cached one.

### Response

`GET /providers` gains an optional field:

```ts
interpretation?: { level: "subcategory" | "category"; slug: string; label: string } | null
```

`label` is the subcategory or category name as the taxonomy spells it. The field is absent or null when Jev was not asked or did not decide.

### Web

- When `interpretation` is present, a pill appears between the filter chips and the results header: a Lucide `Sparkles` icon, « Inclut aussi : Plomberie », and an ✕ button labelled « Retirer Plomberie de la recherche ».
- ✕ sets `brut=1` in the URL, which sends `interpret=false` and reruns the text-only search. Editing the query clears `brut`, so each new query is interpreted again.
- The label wraps rather than truncating, so a long name (« Désinsectisation & Dératisation ») stays readable at 320 px.
- The pill uses the mint surface (`bg-secondary`, `text-primary`), `rounded-3xl` so a wrapped label keeps its shape (fully round on one line), and a 44 px touch target on the button. It carries no motion beyond the global press scale.
- Copy lives in `apps/web/src/copy/search.ts`.

### Logging

One line each time Jev answers: level, top probability, latency (flagged `late` past the budget), the query's length and the model version, never the query text. Cache hits log nothing. Retention of query text is the owner's open decision (see `01-search-intent.md`); nothing here stores it.

## Build

| Area | Files |
| --- | --- |
| Backend | `modules/jev/search-intent.service.ts` (+ spec), `modules/jev/jev.module.ts`, `ProvidersController.search`, `ProvidersService.search` (optional `widenTo`) (+ spec), `config/env.validation.ts`, `common/contract/{public,admin}.dto.ts` (the backend's copy of the contract), `undici` dependency |
| Contract | `SITE_SETTING_BOOLEAN_KEYS` + default (`packages/schemas/src/models.ts`), `ProviderSearchParams.interpret`, `ProviderSearchResponseSchema.interpretation` (`dto.ts`), seed row |
| Web | `components/search/search-state.ts`, `components/search/InterpretationChip.tsx`, `SearchClient.tsx` (chip, and `history.replaceState`), `copy/search.ts`, admin toggle in `admin/_sections/Content.tsx` + `copy/admin.ts` |
| Tests | Backend specs (widening in `providers.service.spec.ts`; `search-intent.service.spec.ts`, both in `test:launch`); `e2e/search.intent.spec.ts` against a backend with live Jev, tag `@viewports` |

### A fix outside the feature

In production builds, `router.replace` on `/rechercher` dropped search-param changes: the list/map toggle never reached the URL, and neither did `brut=1`. The same happens on a clean build of `main` (verified 2026-09-19); `next dev` is not affected. `SearchClient.update` now calls `window.history.replaceState`, which Next.js syncs into `useSearchParams`. `e2e/search.intent.spec.ts` covers the toggle.

## Screenshot states (desktop and mobile)

Captured 2026-09-19 against live Jev, at 320, 390 and 1440 px and with reduced motion: `screenshots/02/`.

1. Subcategory interpretation, with results.
2. Category interpretation.
3. No interpretation (a provider's name).
4. After ✕: text-only results, no chip.
5. Interpretation present and still no results: the chip shows above the existing empty state.

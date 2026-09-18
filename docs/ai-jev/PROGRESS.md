# Jev at KAYOU: progress

## Status

| Experiment | Status | Owner, date | Notes |
| --- | --- | --- | --- |
| 1: Search intent | First run 2026-09-19: `flat-fr` passes the bar; Lingala downgraded to nice-to-have | Claude, 2026-09-19 | `results/2026-09-19/report.md` |
| 1b: Search intent in `/rechercher` | Built and verified 2026-09-19, uncommitted, awaiting owner review. Off by default (`feat_jev_search`) | Claude, 2026-09-19 | `02-search-intent-product.md`, `screenshots/02/` |

## Decisions

| Date | Decision | Why |
| --- | --- | --- |
| 2026-09-18 | Experiment on `experiment/jev-search`; docs in `docs/ai-jev/` | Owner's request; Jev is a separate vendor from the agent concierge's gateway |
| 2026-09-18 | Search intent goes first, before the assistant pre-router | Reaches every visitor, not only signed-in clients; the smallest shape to prove French and Lingala quality |
| 2026-09-18 | Pin `jev-1.13.0`, not `jev-latest` | Aliases move; thresholds are tuned per version (docs, Models) |
| 2026-09-18 | Use `@typesafe-ai/sdk` instead of a hand-written HTTP client | Typed answers, retries and `retry-after` handling; ships CommonJS for the backend |
| 2026-09-18 | Pass bar fixed before the first run; thresholds tuned on `dev`, reported on `test` | 164 queries are few; tuning and reporting on the same half would flatter the result |
| 2026-09-18 | TypeSafe agent skill installed by the owner (`typesafe@typesafe-ai`) | Points agents at the live docs |
| 2026-09-18 | Owner approved the spec: pass bar as written, native Lingala review, demo data may go to TypeSafe, the two pre-spec drafts deleted | Answers to the four questions of the spec review |
| 2026-09-18 | Thresholds use the top option's probability, not the Choice `confidence` | `fanout-fr` has no single confidence, and the docs say confidence summarizes the spread, not correctness; one rule for every variant |
| 2026-09-18 | The runner is a script outside `src/` (`apps/backend/scripts/`), reading the seed taxonomy | No database or server needed; the build is untouched |
| 2026-09-19 | One unrecorded warm-up call per variant before timing | The smoke test's first four parallel calls took 870–1,200 ms against 270–370 ms once connected; a server keeps its connection open, so cold TLS handshakes would misstate production latency |
| 2026-09-19 | `flat-fr` is the variant carried forward | Passes the bar; cheapest; `flat-en` and `fanout-fr` add cost without better results |
| 2026-09-19 | Lingala is a nice-to-have for search, not a requirement: the `ln_mix` line of the pass bar is reported but no longer gates the decision. The native review is no longer a prerequisite for the product spec | Owner's call after the first run; French, unaccented French and English carry search traffic |
| 2026-09-19 | Screenshots of the running app replace mockups for the search chip | Owner: one chip on an existing page; the real page shows it better than a mockup |
| 2026-09-19 | Jev widens the text search (OR) and never narrows it | A wrong interpretation can only add providers, never hide a text match; no empty-result fallback needed |
| 2026-09-19 | Only `GET /providers` (the controller) asks Jev; `ProvidersService.search` takes an optional `widenTo` | The assistant's `search_providers` tool calls the service and stays unchanged |
| 2026-09-19 | 800 ms search budget, 5 s request timeout, late answers cached; undici keep-alive 5 min; warm-up call at boot | A 600 ms abort closed the TLS connection and every later call paid a cold handshake and timed out too (all searches ran without Jev in the first live test) |
| 2026-09-19 | `SearchClient.update` uses `history.replaceState` instead of `router.replace` | Production builds dropped search-param changes on `/rechercher` (list/map toggle included), reproduced on a clean `main` build |
| 2026-09-19 | Logs carry the decision, probability, latency and query length, never the query text | Retention of query text is still the owner's open decision |
| 2026-09-19 | `app/(shell)/not-found.tsx` renders the 404 content without its own `Layout` | Outside the feature, owner's request: `notFound()` in a (shell) page (provider, provider edit, dev tokens) rendered the root `not-found.tsx` inside the shell layout, so two navbars; reproduced on `main`. Covered by `e2e/not-found.spec.ts` |

## Results

Record where each run was made (laptop, Railway region) beside its link: latency depends on it.

### 2026-09-19, first full run (`results/2026-09-19/report.md`)

Run from the owner's development laptop (location to record), concurrency 4, one warm-up call per variant, 492 calls, 0 errors, all answered by `jev-1.13.0`.

| On `test` | `flat-fr` | `flat-en` | `fanout-fr` | Today's search |
| --- | --- | --- | --- | --- |
| Coverage, all service | 94.2% (65/69) | 94.2% | 92.8% | 1.4% (1/69) |
| `fr` / `fr_plain` / `en` | 40/40, 12/12, 5/5 | same | same | 0/40, 1/12, 0/5 |
| `ln_mix` | 8/12 | 8/12 | 7/12 | 0/12 |
| Wrong filter | 1.4% (1/69) | 1.4% | 2.9% | — |
| False filter (names, off-topic) | 0/12 | 1/12 | 0/12 | — |
| Latency p50 / p95 | 330 / 668 ms | 337 / 604 ms | 371 / 935 ms | — |
| USD per 10,000 searches | $1.53 | $1.92 | $2.45 | — |

Findings:

- **`flat-fr` passes all seven lines of the pass bar** and is the variant to carry forward: cheapest, no false filter, simplest. English instructions (`flat-en`) bought nothing; the fan-out costs more, is slower and does slightly worse.
- **French is solved on this set.** Top-1 over all 164 queries, both splits: 80/80 `fr`, 25/25 `fr_plain`, 10/10 `en`, 24/24 names and off-topic.
- **Calibration is good.** When the top probability is 0.9 or more, the answer is right 120 times out of 121.
- **Lingala is the weak spot, and the failures have one shape.** Queries succeed when the meaning rides on a French loanword (frigo, coiffeuse, courant, groupe, toilette) and fail when it rides on Lingala vocabulary: kolamba bilei (cook), kokata suki (cut hair), nzoloko (cockroaches), kobatela lopango (guard the compound), nsoso (chicken), bilamba (clothes). Lingala `moto` ("person") is read as a motorbike: "moto ya kosala bilamba" went to `mecanique_moto` at 0.90. That is why tuning chose `T_sub` 0.95.
- **`ln_mix` passes by one query** (8/12 against a 60% bar; 7/12 would fail). Treat it as unproven.
- **The one wrong filter** on `test` is `ln-016` ("ba nzoloko ezali mingi na cuisine"): the French word "cuisine" pulled it to Cuisine & Restauration at category level.
- **Tokens:** about 3,640 per `flat-fr` search, not the 2,100 the dry run estimated from character count. It is still $1.53 per 10,000 searches.

Limits of this result:

- I wrote every query knowing the taxonomy, so the French set is likely easier than real traffic. 100% on 80 queries says the set is too easy, not that Jev is perfect.
- The `test` split is 69 service queries; one query moves a language's rate by 8 points.
- Latency comes from a laptop, not the Railway host.

Before a product spec: nothing blocking (see the 2026-09-19 Lingala decision). Worth doing alongside it: real French search queries once there is traffic, and a run from the production region.

## Shared-file changes

| Date | File | Change |
| --- | --- | --- |
| 2026-09-18 | `apps/backend/package.json` | `@typesafe-ai/sdk` 0.6.0; scripts `test:jev`, `jev:eval` (not in `test:launch`) |
| 2026-09-18 | `apps/backend/.env.example` | `TYPESAFE_API_KEY`, eval only |
| 2026-09-18 | `pnpm-lock.yaml` | The SDK |
| 2026-09-19 | `packages/schemas/src/{models,dto}.ts`, `apps/backend/src/common/contract/{admin,public}.dto.ts` | `feat_jev_search` setting (default off); `ProviderSearchParams.interpret`; `SearchInterpretationSchema`, `interpretation` on the search response |
| 2026-09-19 | `apps/backend/prisma/seed-settings.ts` | `feat_jev_search` row, false. Existing databases have no row and read the default (off) |
| 2026-09-19 | `apps/backend/src/modules/providers/{providers.service,providers.controller,providers.module}.ts` (+ spec) | Optional `widenTo`; controller asks `SearchIntentService`; `JevModule` import |
| 2026-09-19 | `apps/backend/src/config/env.validation.ts`, `.env.example`, `package.json` | `TYPESAFE_API_KEY` optional; `undici`; the two search-intent specs in `test:launch` |
| 2026-09-19 | `apps/web/src/app/(shell)/rechercher/SearchClient.tsx`, `components/search/search-state.ts`, `copy/search.ts`, `admin/_sections/Content.tsx`, `copy/admin.ts` | Chip, `brut` URL state, `history.replaceState`, admin toggle |

### 2026-09-19, product verification (`screenshots/02/`)

Own stack: backend on 3999 (`kayu_agent01`, `feat_jev_search` on, live Jev), web standalone build on 3100, both from a copy of the working tree in the session scratchpad; the owner's 3000/3001 servers untouched. `pnpm test:launch` green (304 backend tests, 1 skipped by design). `e2e/search.intent.spec.ts`: 24/24 across 320, 390, 1440 px and reduced motion.

Live answers: « coupe de cheveux pour ma fille » → Coiffure (4 providers, 0 before); « installer des caméras chez moi » → Système de sécurité (8, 0 before); « travaux dans ma maison » → category Bâtiment & Construction (15); « Mama Nzuzi » → name, no chip; « il y a des cafards partout dans la cuisine » → Désinsectisation & Dératisation, empty state.

## Open questions for the owner

- Retention of search query text, if it is ever logged (it is not today).
- Turning `feat_jev_search` on in production, after `TYPESAFE_API_KEY` is set on Railway.
- Earlier questions: `01-search-intent.md`, "Open questions for the owner".

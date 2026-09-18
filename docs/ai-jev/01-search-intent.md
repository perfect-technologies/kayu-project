# Experiment 1: search intent

Status: first run 2026-09-19. `flat-fr` passes the bar on invented queries; Lingala downgraded to nice-to-have (see the pass bar). Results and findings are in `PROGRESS.md`.
Branch: `experiment/jev-search`.

## Problem

`/rechercher` matches the typed text as a case-insensitive substring of provider names, descriptions, skill labels and taxonomy names (`ProvidersService.search`, `apps/backend/src/modules/providers/providers.service.ts:205`). A client who describes a need instead of naming a trade gets nothing, or noise:

- "fuite d'eau sous l'évier" does not contain "plomberie".
- "plombier" does not match "Plomberie" either: the query must be a substring of the name, and "plombier" is not a substring of "plomberie".
- "coifeuse" (typo), "electricien" (no accent) and "courant ekatani" (French and Lingala) fail the same way.

The search page already accepts `categorySlug` and `subcategoryId` filters, and the subcategory filter covers level-3 children. Understanding the query is the missing step.

## Hypothesis

One Jev call per search, over the 106 level-2 subcategories, can pick the right one for French, unaccented or misspelled French, and French–Lingala queries. It must be accurate enough, and say "not sure" reliably enough, that applying the filter helps more often than it hides the right provider. It must also be fast enough (p95 under 800 ms) to sit in front of search.

The experiment either confirms this against the pass bar below or stops the idea. It changes no search behaviour: the only product-side file is the pure module that builds the questions and applies the policy.

## What Jev is asked

State is the query alone, as a JSON object so the field has a name: `{ "recherche": "<query>" }`. Following the docs' warning about irrelevant state, nothing else goes in: no location, no user profile.

The flat variants ask two questions in the same request; `fanout-fr` splits the first one (see below). Questions run in parallel at no extra latency.

1. **`service`** (Choice): which service the client needs. One option per level-2 subcategory, keyed by its slug. Each description is `Catégorie › Sous-catégorie` followed by its level-3 names in parentheses, since "Dépannage & fuites" is what a leak query must match. There is also a no-match option, `aucune`: a person's or business's name, text asking for no service, or nothing in the list fits.
2. **`nom`** (Noul): "Is the text the name of a person, a business or a provider, rather than the description of a need?" The docs advise a separate presence judgment when it is independently useful. A name search must bypass the filter even when a name happens to sound like a trade ("Salon Élégance").

### Variants compared

All variants are pinned to `jev-1.13.0` and run on the same queries.

| Id | Questions | Why |
| --- | --- | --- |
| `flat-fr` | `service` and `nom`, French instructions and descriptions | Simplest shape: one Choice |
| `flat-en` | Same, English instructions; each description is the French name plus a short English gloss | Jev's primary language is English; the query stays French |
| `fanout-fr` | `categorie` (Choice over the 19 categories plus `aucune`), 18 speculative `service_<category>` Choices (one per category with subcategories; "Autres services" has none) ("if the need is in this category, which service?"), and `nom`, all in one request | The hierarchical-classification approach, done in one call: code scores each path as `P(category) × P(service given category)`, so no second round trip |

Each option list is built in code from a taxonomy tree, never hand-written, and the count is asserted at 255 or fewer. The eval reads the seed taxonomy (`prisma/seed-categories.ts`); in production the same builder would take `CategoriesService.tree()`, which already leaves inactive nodes out.

## From answers to a search (policy in code)

Jev returns probabilities; code decides. For the flat variants:

1. If `nom` ≥ `T_name`, apply no filter and run today's text search.
2. If the top `service` option is not `aucune` and its probability ≥ `T_sub`, filter by that subcategory.
3. Otherwise, add up the `service` probabilities per parent category in code. If the best category's total ≥ `T_cat`, filter by that category.
4. Otherwise, apply no filter and run today's text search.

Step 3 follows the docs' "classification using confidence" cookbook: when the narrow label is unsure, report the broad one it belongs to, with no second call. For `fanout-fr`, steps 2 and 3 read the path score and the `categorie` answer instead.

`T_name`, `T_sub` and `T_cat` are tuned on the `dev` half of the queries and reported on the `test` half. They are never tuned on the half they are reported on.

## Queries (`eval/search-queries.jsonl`)

164 lines, one JSON object each: 140 service queries (80 `fr`, 25 `fr_plain`, 25 `ln_mix`, 10 `en`), 12 names, 12 off-topic. The service queries reach 74 of the 106 subcategories; the other 32 get queries when real search logs exist.

```json
{"id": "fr-001", "q": "fuite d'eau sous l'évier", "expect": ["plomberie"], "kind": "service", "lang": "fr", "split": "dev"}
```

- `expect`: acceptable level-2 slugs, most likely first. Empty for `name` and `off_topic`. A query with two valid readings ("gâteau d'anniversaire": `patisserie` or `traiteur`) lists both, and either counts as right.
- `kind`: `service`, `name` (a provider or business name) or `off_topic`.
- `lang`: `fr`, `fr_plain` (no accents, typos, SMS spelling), `ln_mix` (French and Lingala), `en`.
- `split`: `dev` or `test`, alternating within each `lang` and `kind`.
- `review: true` marks lines that need a native speaker's check. Every `ln_mix` line carries it; I wrote them and am not a reliable Lingala source.

Names in the file are invented and must not match real businesses.

## Baseline

Today's behaviour, reproduced offline: the expected subcategory counts as reached when the query is a case-insensitive substring of its category, subcategory or level-3 name. This is generous to the baseline, since it ignores that the real query also has to match a provider row. It is still the right comparison for "does the search understand the need". It does not model matches on provider descriptions or skills; the report says so.

## Metrics

Per variant, per `lang`, on the `test` split at the tuned thresholds:

- **Top-1 accuracy**: the top `service` option is in `expect`. Service queries only; this is the raw model quality.
- **Coverage**: service queries that end with a correct filter, subcategory or its parent category.
- **Wrong-filter rate**: service queries that end with a filter excluding every `expect` slug. This is the harm metric: the client sees the wrong trade and not the one they need.
- **False-filter rate**: `name` and `off_topic` queries that end with any filter.
- **Calibration**: top-1 accuracy per bucket of the top answer's probability (0–0.5, 0.5–0.8, 0.8–0.9, 0.9–1), and coverage and wrong-filter rate across `T_sub`.
- **Latency**: p50 and p95 of the full SDK call from the machine running the eval. The report notes where that machine is: a laptop in Europe is not a Railway host.
- **Cost**: input tokens per query and USD per 10,000 searches.

## Pass bar

Fixed now, before any run. The winning variant must meet every line on the `test` split:

| Metric | Bar |
| --- | --- |
| Wrong-filter rate, all service queries | ≤ 5% |
| Coverage, `fr` | ≥ 80% |
| Coverage, `fr_plain` | ≥ 75% |
| Coverage, `ln_mix` | ≥ 60% |
| False-filter rate, `name` and `off_topic` | ≤ 10% |
| Coverage gain over the baseline, all service queries | ≥ 30 points |
| Latency p95 | ≤ 800 ms |

If only `ln_mix` misses its bar, the result is a partial pass: the owner decides between shipping for French only and waiting for a later Jev version.

**Amended 2026-09-19 by the owner:** Lingala is a nice-to-have for search. The `ln_mix` line is still reported but does not gate the decision.

## If it passes: the product change

Sketched here so the experiment measures the right thing; specified in full, with mockups, in a follow-up document.

- **Backend.** A `SearchIntentService` next to `ProvidersService.search` runs only when `q` is present and no category filter is set, behind a `feat_jev_search` `SystemSetting`. It has a 600 ms timeout, caches by normalized query for 10 minutes, and falls back to today's text search on any error. If the filtered search returns nothing, it falls back to the text search too. The response gains an optional `interpretation` (`{ level: "subcategory" | "category", slug, label }`).
- **Web.** `/rechercher` shows the interpretation as a dismissible chip ("Résultats pour Plomberie"), and dismissing it reruns the plain text search. Desktop and mobile mockups come before any UI code.
- **Traffic.** Search runs as the client types (debounced). The cache and the debounce keep calls far under the account's 1,200 requests per minute; the follow-up spec measures this against real search volume.
- **Logging.** Query, variant, decision and confidence, to re-tune thresholds when Jev moves version. How long those logs are kept needs an owner decision (see below).

## Implementation of the experiment

- `@typesafe-ai/sdk` 0.6.0 in `apps/backend`.
- `apps/backend/src/modules/jev/search-intent.ts`: builds each variant's questions from a taxonomy tree, reduces every variant's answers to the same reading, and applies the policy above. It is pure and becomes the product code if the experiment passes. `search-intent.glosses.ts` holds the English glosses for `flat-en`.
- `apps/backend/scripts/jev/scoring.ts`: metrics, threshold tuning on `dev`, the baseline, calibration and the pass bar.
- `apps/backend/scripts/jev-search-eval.ts`: the runner. It reads the queries and the taxonomy from `prisma/seed-categories.ts`, so no database is needed. It writes `docs/ai-jev/results/<date>/report.md` plus one `<variant>.raw.json` of raw Jev answers per variant.
- Tests: `pnpm test:jev` (18 cases with fake answers; no key, no network).

From `apps/backend/`, with `TYPESAFE_API_KEY` in `.env`:

```sh
pnpm jev:eval --dry-run                  # sizes and a sample request, no call
pnpm jev:eval --limit 10 --variants flat-fr   # smoke test, 10 calls
pnpm jev:eval                            # all three variants, 492 calls
pnpm jev:eval --from ../../docs/ai-jev/results/<date>   # re-score saved answers, no call
```

Measured by the dry run: about 2,100 input tokens per search for `flat-fr`, 3,200 for `flat-en` and 4,000 for `fanout-fr`. A full run costs under one US cent.

## Open questions for the owner

1. **Data.** Answered 2026-09-18 for the experiment: the queries are demo data, so sending them is fine. Before production, the owner still decides whether the DPA is acceptable for real search text or zero data retention is needed.
2. **Lingala review.** Optional since 2026-09-19: Lingala is a nice-to-have for search. The `ln_mix` lines stay in the set as a signal.
3. **Real queries.** Are there search logs, from launch leads or support messages, to replace invented queries later? The experiment starts on invented ones.
4. **Log retention**, if it ships.

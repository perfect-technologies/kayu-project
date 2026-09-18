# Experiment 1 results: search intent (2026-09-19)

Spec: `../01-search-intent.md`. Model requested: `jev-1.13.0`; answered by: `jev-1.13.0`.
Queries: 164 (81 in `test`). Thresholds tuned on `dev`, every number below is on `test` unless it says otherwise.
Latency is the full SDK call, retries included, after one unrecorded warm-up call per variant, from the machine that ran the eval; record where that was in `PROGRESS.md`.

## Summary

| Variant | Thresholds (name / sub / cat) | Coverage | fr | fr_plain | ln_mix | en | Wrong filter | False filter | Top-1 | p50 | p95 | USD / 10k | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `flat-fr` | 0.5 / 0.95 / 0.55 | 94.2% (65/69) | 100.0% (40/40) | 100.0% (12/12) | 66.7% (8/12) | 100.0% (5/5) | 1.4% (1/69) | 0.0% (0/12) | 94.2% (65/69) | 330 ms | 668 ms | $1.530 | 0 |
| `flat-en` | 0.5 / 0.95 / 0.6 | 94.2% (65/69) | 100.0% (40/40) | 100.0% (12/12) | 66.7% (8/12) | 100.0% (5/5) | 1.4% (1/69) | 8.3% (1/12) | 95.7% (66/69) | 337 ms | 604 ms | $1.918 | 0 |
| `fanout-fr` | 0.5 / 0.95 / 0.7 | 92.8% (64/69) | 100.0% (40/40) | 100.0% (12/12) | 58.3% (7/12) | 100.0% (5/5) | 2.9% (2/69) | 0.0% (0/12) | 94.2% (65/69) | 371 ms | 935 ms | $2.445 | 0 |
| Baseline (today's search) |  | 1.4% (1/69) | 0.0% (0/40) | 8.3% (1/12) | 0.0% (0/12) | 0.0% (0/5) |  |  |  |  |  |  |  |

## Pass bar: `flat-fr`

| Metric | Bar | Value | Pass |
| --- | --- | --- | --- |
| Wrong-filter rate, service | ≤ 5% | 1.4% (1/69) | yes |
| Coverage, fr | ≥ 80% | 100.0% (40/40) | yes |
| Coverage, fr_plain | ≥ 75% | 100.0% (12/12) | yes |
| Coverage, ln_mix | ≥ 60% | 66.7% (8/12) | yes |
| False-filter rate, name and off-topic | ≤ 10% | 0.0% (0/12) | yes |
| Coverage gain over baseline | ≥ 30 points | 92.8 points | yes |
| Latency p95 | ≤ 800 ms | 668 ms | yes |

## `flat-fr`

Top-1 accuracy by the probability of the top answer (service queries, both splits):

| Top probability | Accuracy |
| --- | --- |
| 0–0.5 | 25.0% (1/4) |
| 0.5–0.8 | 75.0% (9/12) |
| 0.8–0.9 | 100.0% (3/3) |
| 0.9–1 | 99.2% (120/121) |

Subcategory threshold sweep on `test`, other thresholds as tuned:

| T_sub | Coverage | Wrong filter | Subcategory filters |
| --- | --- | --- | --- |
| 0.3 | 94.2% (65/69) | 4.3% (3/69) | 68 |
| 0.4 | 94.2% (65/69) | 1.4% (1/69) | 66 |
| 0.5 | 94.2% (65/69) | 1.4% (1/69) | 66 |
| 0.6 | 94.2% (65/69) | 1.4% (1/69) | 63 |
| 0.7 | 94.2% (65/69) | 1.4% (1/69) | 63 |
| 0.8 | 94.2% (65/69) | 1.4% (1/69) | 60 |
| 0.9 | 94.2% (65/69) | 1.4% (1/69) | 60 |

Wrong filters and misses on `test` (4):

| Id | Query | Expected | Decision | Top answer | Kind |
| --- | --- | --- | --- | --- | --- |
| ln-008 | `moto ya kolamba bilei ya libala` | traiteur, restauration_evenementielle | none (unsure) | livraison_coursier | no filter |
| ln-012 | `nalingi kokata suki` | coiffure, barbier | none (unsure) | aucune | no filter |
| ln-016 | `ba nzoloko ezali mingi na cuisine` | desinsectisation | category cuisine_restauration (0.76) | cuisinier_domicile | wrong filter |
| ln-020 | `moto ya kobatela lopango butu` | gardiennage, agent_securite | none (unsure) | mecanique_moto | no filter |

## `flat-en`

Top-1 accuracy by the probability of the top answer (service queries, both splits):

| Top probability | Accuracy |
| --- | --- |
| 0–0.5 | 50.0% (2/4) |
| 0.5–0.8 | 66.7% (6/9) |
| 0.8–0.9 | 75.0% (3/4) |
| 0.9–1 | 100.0% (123/123) |

Subcategory threshold sweep on `test`, other thresholds as tuned:

| T_sub | Coverage | Wrong filter | Subcategory filters |
| --- | --- | --- | --- |
| 0.3 | 95.7% (66/69) | 2.9% (2/69) | 69 |
| 0.4 | 95.7% (66/69) | 2.9% (2/69) | 69 |
| 0.5 | 94.2% (65/69) | 1.4% (1/69) | 67 |
| 0.6 | 94.2% (65/69) | 1.4% (1/69) | 65 |
| 0.7 | 94.2% (65/69) | 1.4% (1/69) | 64 |
| 0.8 | 94.2% (65/69) | 1.4% (1/69) | 63 |
| 0.9 | 94.2% (65/69) | 1.4% (1/69) | 62 |

Wrong filters and misses on `test` (5):

| Id | Query | Expected | Decision | Top answer | Kind |
| --- | --- | --- | --- | --- | --- |
| ln-008 | `moto ya kolamba bilei ya libala` | traiteur, restauration_evenementielle | none (unsure) | traiteur | no filter |
| ln-012 | `nalingi kokata suki` | coiffure, barbier | none (unsure) | aucune | no filter |
| ln-016 | `ba nzoloko ezali mingi na cuisine` | desinsectisation | category cuisine_restauration (0.74) | cuisinier_domicile | wrong filter |
| ln-020 | `moto ya kobatela lopango butu` | gardiennage, agent_securite | none (unsure) | mecanique_moto | no filter |
| nm-010 | `Studio Nkembo Photo` | — | category evenementiel (0.94) | photographie | wrong filter |

## `fanout-fr`

Top-1 accuracy by the probability of the top answer (service queries, both splits):

| Top probability | Accuracy |
| --- | --- |
| 0–0.5 | 40.0% (2/5) |
| 0.5–0.8 | 69.2% (9/13) |
| 0.8–0.9 | 100.0% (5/5) |
| 0.9–1 | 100.0% (117/117) |

Subcategory threshold sweep on `test`, other thresholds as tuned:

| T_sub | Coverage | Wrong filter | Subcategory filters |
| --- | --- | --- | --- |
| 0.3 | 92.8% (64/69) | 4.3% (3/69) | 67 |
| 0.4 | 92.8% (64/69) | 2.9% (2/69) | 66 |
| 0.5 | 92.8% (64/69) | 2.9% (2/69) | 66 |
| 0.6 | 92.8% (64/69) | 2.9% (2/69) | 65 |
| 0.7 | 92.8% (64/69) | 2.9% (2/69) | 63 |
| 0.8 | 92.8% (64/69) | 2.9% (2/69) | 59 |
| 0.9 | 92.8% (64/69) | 2.9% (2/69) | 56 |

Wrong filters and misses on `test` (5):

| Id | Query | Expected | Decision | Top answer | Kind |
| --- | --- | --- | --- | --- | --- |
| ln-004 | `nazali koluka coiffeuse ya kosala ba tresses` | coiffure | none (name) | coiffure | no filter |
| ln-008 | `moto ya kolamba bilei ya libala` | traiteur, restauration_evenementielle | category transport_logistique (0.71) | livraison_coursier | wrong filter |
| ln-012 | `nalingi kokata suki` | coiffure, barbier | none (unsure) | aucune | no filter |
| ln-016 | `ba nzoloko ezali mingi na cuisine` | desinsectisation | category cuisine_restauration (0.91) | cuisinier_domicile | wrong filter |
| ln-020 | `moto ya kobatela lopango butu` | gardiennage, agent_securite | none (unsure) | maconnerie | no filter |

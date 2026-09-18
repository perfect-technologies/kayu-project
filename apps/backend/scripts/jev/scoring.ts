import {
  decideSearchIntent,
  topAnswer,
  type IntentNode,
  type SearchIntentDecision,
  type SearchIntentReading,
  type SearchIntentThresholds,
} from "../../src/modules/jev/search-intent";

export const LANGS = ["fr", "fr_plain", "ln_mix", "en"] as const;
export type Lang = (typeof LANGS)[number];

export type EvalQuery = {
  id: string;
  q: string;
  expect: string[];
  kind: "service" | "name" | "off_topic";
  lang: Lang;
  split: "dev" | "test";
  review?: boolean;
};

export type EvalRun = {
  id: string;
  latencyMs: number;
  inputTokens: number;
  model: string | null;
  reading: SearchIntentReading | null;
  error: string | null;
};

export type Rate = { hits: number; n: number };

export type Metrics = {
  coverage: Rate;
  coverageByLang: Record<Lang, Rate>;
  wrongFilter: Rate;
  falseFilter: Rate;
  top1: Rate;
  top1ByLang: Record<Lang, Rate>;
  errors: number;
};

export const JEV_PRICE_PER_MTOK = 0.042;

export const rate = (r: Rate) => (r.n === 0 ? null : r.hits / r.n);
export const pct = (r: Rate) => {
  const value = rate(r);
  return value === null ? "n/a" : `${(value * 100).toFixed(1)}% (${r.hits}/${r.n})`;
};

const emptyByLang = (): Record<Lang, Rate> => ({ fr: { hits: 0, n: 0 }, fr_plain: { hits: 0, n: 0 }, ln_mix: { hits: 0, n: 0 }, en: { hits: 0, n: 0 } });

export function isCorrectFilter(query: EvalQuery, decision: SearchIntentDecision, parents: Map<string, string>): boolean {
  if (decision.level === "subcategory") return query.expect.includes(decision.slug);
  if (decision.level === "category") return query.expect.some((slug) => parents.get(slug) === decision.slug);
  return false;
}

// A failed call behaves as the product would: no filter, today's text search.
export function decisionFor(run: EvalRun | undefined, thresholds: SearchIntentThresholds, parents: Map<string, string>): SearchIntentDecision {
  if (!run?.reading) return { level: "none", reason: "unsure" };
  return decideSearchIntent(run.reading, thresholds, parents);
}

export function computeMetrics(
  queries: EvalQuery[],
  runs: Map<string, EvalRun>,
  thresholds: SearchIntentThresholds,
  parents: Map<string, string>,
): Metrics {
  const metrics: Metrics = {
    coverage: { hits: 0, n: 0 },
    coverageByLang: emptyByLang(),
    wrongFilter: { hits: 0, n: 0 },
    falseFilter: { hits: 0, n: 0 },
    top1: { hits: 0, n: 0 },
    top1ByLang: emptyByLang(),
    errors: 0,
  };

  for (const query of queries) {
    const run = runs.get(query.id);
    if (!run?.reading) metrics.errors++;
    const decision = decisionFor(run, thresholds, parents);

    if (query.kind !== "service") {
      metrics.falseFilter.n++;
      if (decision.level !== "none") metrics.falseFilter.hits++;
      continue;
    }

    const correct = isCorrectFilter(query, decision, parents);
    const top1 = run?.reading ? query.expect.includes(topAnswer(run.reading)) : false;
    metrics.coverage.n++;
    metrics.wrongFilter.n++;
    metrics.top1.n++;
    metrics.coverageByLang[query.lang].n++;
    metrics.top1ByLang[query.lang].n++;
    if (correct) {
      metrics.coverage.hits++;
      metrics.coverageByLang[query.lang].hits++;
    } else if (decision.level !== "none") {
      metrics.wrongFilter.hits++;
    }
    if (top1) {
      metrics.top1.hits++;
      metrics.top1ByLang[query.lang].hits++;
    }
  }
  return metrics;
}

export const LIMITS = { wrongFilter: 0.05, falseFilter: 0.1 } as const;

const steps = (from: number, to: number, step: number) => {
  const values: number[] = [];
  for (let value = from; value <= to + 1e-9; value += step) values.push(Math.round(value * 100) / 100);
  return values;
};

export const THRESHOLD_GRID = {
  name: steps(0.5, 0.9, 0.1),
  subcategory: steps(0.2, 0.95, 0.05),
  category: steps(0.3, 0.95, 0.05),
};

export type Tuning = { thresholds: SearchIntentThresholds; metrics: Metrics; withinLimits: boolean };

// Most coverage within the harm limits; ties go to fewer wrong filters, then to stricter thresholds.
export function tuneThresholds(queries: EvalQuery[], runs: Map<string, EvalRun>, parents: Map<string, string>): Tuning {
  let best: Tuning | undefined;
  for (const name of THRESHOLD_GRID.name) {
    for (const subcategory of THRESHOLD_GRID.subcategory) {
      for (const category of THRESHOLD_GRID.category) {
        const thresholds = { name, subcategory, category };
        const metrics = computeMetrics(queries, runs, thresholds, parents);
        const withinLimits =
          (rate(metrics.wrongFilter) ?? 0) <= LIMITS.wrongFilter && (rate(metrics.falseFilter) ?? 0) <= LIMITS.falseFilter;
        const candidate = { thresholds, metrics, withinLimits };
        if (!best || better(candidate, best)) best = candidate;
      }
    }
  }
  return best!;
}

function better(a: Tuning, b: Tuning): boolean {
  if (a.withinLimits !== b.withinLimits) return a.withinLimits;
  if (!a.withinLimits) {
    const harm = (t: Tuning) => (rate(t.metrics.wrongFilter) ?? 0) + (rate(t.metrics.falseFilter) ?? 0);
    if (harm(a) !== harm(b)) return harm(a) < harm(b);
  }
  if (a.metrics.coverage.hits !== b.metrics.coverage.hits) return a.metrics.coverage.hits > b.metrics.coverage.hits;
  if (a.metrics.wrongFilter.hits !== b.metrics.wrongFilter.hits) return a.metrics.wrongFilter.hits < b.metrics.wrongFilter.hits;
  const strictness = (t: SearchIntentThresholds) => t.subcategory + t.category - t.name;
  return strictness(a.thresholds) > strictness(b.thresholds);
}

// Today's search, generously: the query is a case-insensitive, accent-sensitive substring of a taxonomy name on the expected path.
export function baselineReaches(query: EvalQuery, taxonomy: IntentNode[]): boolean {
  const needle = query.q.trim().toLowerCase();
  if (!needle) return false;
  for (const category of taxonomy) {
    for (const sub of category.children ?? []) {
      if (!query.expect.includes(sub.slug)) continue;
      const names = [category.name, sub.name, ...(sub.children ?? []).map((leaf) => leaf.name)];
      if (names.some((name) => name.toLowerCase().includes(needle))) return true;
    }
  }
  return false;
}

export function baselineCoverage(queries: EvalQuery[], taxonomy: IntentNode[]): { all: Rate; byLang: Record<Lang, Rate> } {
  const all = { hits: 0, n: 0 };
  const byLang = emptyByLang();
  for (const query of queries) {
    if (query.kind !== "service") continue;
    const reached = baselineReaches(query, taxonomy);
    all.n++;
    byLang[query.lang].n++;
    if (reached) {
      all.hits++;
      byLang[query.lang].hits++;
    }
  }
  return { all, byLang };
}

export const CALIBRATION_BUCKETS = [0, 0.5, 0.8, 0.9, 1.0001] as const;

/** Top-1 accuracy of service queries grouped by the probability of the top answer. */
export function calibration(queries: EvalQuery[], runs: Map<string, EvalRun>): Array<{ from: number; to: number; rate: Rate }> {
  const buckets = CALIBRATION_BUCKETS.slice(0, -1).map((from, index) => ({
    from,
    to: Math.min(CALIBRATION_BUCKETS[index + 1]!, 1),
    rate: { hits: 0, n: 0 },
  }));
  for (const query of queries) {
    const reading = runs.get(query.id)?.reading;
    if (query.kind !== "service" || !reading) continue;
    const top = Math.max(reading.subcategories[0]?.probability ?? 0, reading.noMatchProbability);
    const bucket = buckets.find((b, index) => top >= b.from && (top < CALIBRATION_BUCKETS[index + 1]!))!;
    bucket.rate.n++;
    if (query.expect.includes(topAnswer(reading))) bucket.rate.hits++;
  }
  return buckets;
}

export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]!;
}

export function costPer10k(runs: EvalRun[]): number | null {
  const ok = runs.filter((run) => run.reading);
  if (ok.length === 0) return null;
  const tokens = ok.reduce((sum, run) => sum + run.inputTokens, 0) / ok.length;
  return (tokens * 10_000 * JEV_PRICE_PER_MTOK) / 1_000_000;
}

export type PassRow = { metric: string; bar: string; value: string; pass: boolean };

// docs/ai-jev/01-search-intent.md, "Pass bar": fixed before the first run.
export function passBar(test: Metrics, baseline: Rate, p95: number | null): PassRow[] {
  const at = (r: Rate) => rate(r) ?? 0;
  const gain = (at(test.coverage) - at(baseline)) * 100;
  return [
    { metric: "Wrong-filter rate, service", bar: "≤ 5%", value: pct(test.wrongFilter), pass: at(test.wrongFilter) <= 0.05 },
    { metric: "Coverage, fr", bar: "≥ 80%", value: pct(test.coverageByLang.fr), pass: at(test.coverageByLang.fr) >= 0.8 },
    { metric: "Coverage, fr_plain", bar: "≥ 75%", value: pct(test.coverageByLang.fr_plain), pass: at(test.coverageByLang.fr_plain) >= 0.75 },
    { metric: "Coverage, ln_mix", bar: "≥ 60%", value: pct(test.coverageByLang.ln_mix), pass: at(test.coverageByLang.ln_mix) >= 0.6 },
    { metric: "False-filter rate, name and off-topic", bar: "≤ 10%", value: pct(test.falseFilter), pass: at(test.falseFilter) <= 0.1 },
    { metric: "Coverage gain over baseline", bar: "≥ 30 points", value: `${gain.toFixed(1)} points`, pass: gain >= 30 },
    { metric: "Latency p95", bar: "≤ 800 ms", value: p95 === null ? "n/a" : `${Math.round(p95)} ms`, pass: p95 !== null && p95 <= 800 },
  ];
}

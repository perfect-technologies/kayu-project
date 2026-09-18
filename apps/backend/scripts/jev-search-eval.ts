// Experiment 1 of docs/ai-jev: runs the search-intent variants over the labelled queries and writes a report.
// From apps/backend/: pnpm jev:eval [--variants flat-fr,flat-en] [--limit 20] [--concurrency 4] [--from <results dir>] [--dry-run]
import { TypeSafeClient } from "@typesafe-ai/sdk";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { taxonomy as seedTaxonomy, type TaxonomyNode } from "../prisma/seed-categories";
import {
  SEARCH_INTENT_MODEL,
  SEARCH_INTENT_VARIANTS,
  buildSearchIntentQuestions,
  categoryOfSubcategory,
  readSearchIntent,
  searchIntentState,
  topAnswer,
  type IntentNode,
  type SearchIntentVariant,
} from "../src/modules/jev/search-intent";
import { SUBCATEGORY_GLOSSES } from "../src/modules/jev/search-intent.glosses";
import {
  LANGS,
  baselineCoverage,
  calibration,
  computeMetrics,
  costPer10k,
  decisionFor,
  isCorrectFilter,
  passBar,
  pct,
  percentile,
  rate,
  tuneThresholds,
  type EvalQuery,
  type EvalRun,
  type Metrics,
  type Tuning,
} from "./jev/scoring";

const DOCS = resolve(__dirname, "../../../docs/ai-jev");
const QUERIES_FILE = join(DOCS, "eval/search-queries.jsonl");

type Args = { variants: SearchIntentVariant[]; limit: number | null; concurrency: number; from: string | null; dryRun: boolean };

function parseArgs(argv: string[]): Args {
  const value = (flag: string) => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  const variants = (value("--variants")?.split(",") ?? [...SEARCH_INTENT_VARIANTS]) as SearchIntentVariant[];
  for (const variant of variants) {
    if (!SEARCH_INTENT_VARIANTS.includes(variant)) throw new Error(`Unknown variant "${variant}"`);
  }
  return {
    variants,
    limit: value("--limit") ? Number(value("--limit")) : null,
    concurrency: Number(value("--concurrency") ?? 4),
    from: value("--from") ?? null,
    dryRun: argv.includes("--dry-run"),
  };
}

const toIntentNode = (node: TaxonomyNode): IntentNode => ({ slug: node.slug, name: node.name, children: node.subs?.map(toIntentNode) });

function loadQueries(limit: number | null): EvalQuery[] {
  const queries = readFileSync(QUERIES_FILE, "utf8")
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as EvalQuery);
  return limit ? queries.slice(0, limit) : queries;
}

async function pool<T, R>(items: T[], size: number, work: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await work(items[index]!, index);
    }
  });
  await Promise.all(workers);
  return results;
}

type RawRecord = EvalRun & { answers: unknown };

async function runVariant(
  client: TypeSafeClient,
  variant: SearchIntentVariant,
  queries: EvalQuery[],
  taxonomy: IntentNode[],
  concurrency: number,
): Promise<RawRecord[]> {
  const questions = buildSearchIntentQuestions(taxonomy, variant);
  // A server keeps its connection open; one unrecorded call keeps the TLS handshake out of the latency figures.
  await client.systemOne({ state: searchIntentState("plombier"), questions, model: SEARCH_INTENT_MODEL }).catch(() => undefined);
  let done = 0;
  return pool(queries, concurrency, async (query) => {
    const startedAt = performance.now();
    let record: RawRecord;
    try {
      const response = await client.systemOne({ state: searchIntentState(query.q), questions, model: SEARCH_INTENT_MODEL });
      record = {
        id: query.id,
        latencyMs: performance.now() - startedAt,
        inputTokens: response.usage.input_tokens,
        model: response.model,
        reading: readSearchIntent(response.answers as never, taxonomy, variant),
        error: null,
        answers: response.answers,
      };
    } catch (error) {
      record = {
        id: query.id,
        latencyMs: performance.now() - startedAt,
        inputTokens: 0,
        model: null,
        reading: null,
        error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
        answers: null,
      };
    }
    done++;
    if (done % 20 === 0 || done === queries.length) process.stdout.write(`  ${variant}: ${done}/${queries.length}\n`);
    return record;
  });
}

function dryRun(variants: SearchIntentVariant[], taxonomy: IntentNode[], queries: EvalQuery[]) {
  const missingGlosses = taxonomy.flatMap((c) => c.children ?? []).filter((sub) => !SUBCATEGORY_GLOSSES[sub.slug]);
  console.log(`Taxonomy: ${taxonomy.length} categories, ${taxonomy.flatMap((c) => c.children ?? []).length} subcategories`);
  console.log(`Queries: ${queries.length}; English glosses missing for: ${missingGlosses.map((s) => s.slug).join(", ") || "none"}`);
  for (const variant of variants) {
    const questions = buildSearchIntentQuestions(taxonomy, variant);
    const options = Object.entries(questions).map(([id, q]) => `${id}=${"criteria" in q && q.type === "choice" ? Object.keys(q.criteria).length : "noul"}`);
    const body = JSON.stringify({ model: SEARCH_INTENT_MODEL, state: searchIntentState(queries[0]!.q), questions });
    console.log(`\n${variant}: ${Object.keys(questions).length} questions (${options.join(", ")}); request body ${body.length} characters (~${Math.round(body.length / 4)} tokens)`);
  }
  const sample = buildSearchIntentQuestions(taxonomy, variants[0]!);
  console.log(`\nSample request (${variants[0]}):\n${JSON.stringify({ model: SEARCH_INTENT_MODEL, state: searchIntentState(queries[0]!.q), questions: sample }, null, 2).slice(0, 2500)}\n…`);
}

type VariantResult = {
  variant: SearchIntentVariant;
  runs: Map<string, EvalRun>;
  tuning: Tuning;
  test: Metrics;
  p50: number | null;
  p95: number | null;
  cost: number | null;
  models: string[];
};

const row = (cells: Array<string | number>) => `| ${cells.join(" | ")} |`;
const ms = (value: number | null) => (value === null ? "n/a" : `${Math.round(value)} ms`);

function report(results: VariantResult[], queries: EvalQuery[], taxonomy: IntentNode[], parents: Map<string, string>, date: string): string {
  const test = queries.filter((q) => q.split === "test");
  const base = baselineCoverage(test, taxonomy);
  const best = [...results].sort((a, b) => {
    const passes = (r: VariantResult) => passBar(r.test, base.all, r.p95).filter((p) => p.pass).length;
    return passes(b) - passes(a) || (rate(b.test.coverage) ?? 0) - (rate(a.test.coverage) ?? 0);
  })[0]!;

  const lines: string[] = [
    `# Experiment 1 results: search intent (${date})`,
    "",
    `Spec: \`../01-search-intent.md\`. Model requested: \`${SEARCH_INTENT_MODEL}\`; answered by: ${[...new Set(results.flatMap((r) => r.models))].map((m) => `\`${m}\``).join(", ") || "n/a"}.`,
    `Queries: ${queries.length} (${test.length} in \`test\`). Thresholds tuned on \`dev\`, every number below is on \`test\` unless it says otherwise.`,
    "Latency is the full SDK call, retries included, after one unrecorded warm-up call per variant, from the machine that ran the eval; record where that was in `PROGRESS.md`.",
    "",
    "## Summary",
    "",
    row(["Variant", "Thresholds (name / sub / cat)", "Coverage", "fr", "fr_plain", "ln_mix", "en", "Wrong filter", "False filter", "Top-1", "p50", "p95", "USD / 10k", "Errors"]),
    row(Array(14).fill("---")),
    ...results.map((r) =>
      row([
        `\`${r.variant}\``,
        `${r.tuning.thresholds.name} / ${r.tuning.thresholds.subcategory} / ${r.tuning.thresholds.category}${r.tuning.withinLimits ? "" : " (limits not met on dev)"}`,
        pct(r.test.coverage),
        pct(r.test.coverageByLang.fr),
        pct(r.test.coverageByLang.fr_plain),
        pct(r.test.coverageByLang.ln_mix),
        pct(r.test.coverageByLang.en),
        pct(r.test.wrongFilter),
        pct(r.test.falseFilter),
        pct(r.test.top1),
        ms(r.p50),
        ms(r.p95),
        r.cost === null ? "n/a" : `$${r.cost.toFixed(3)}`,
        r.test.errors,
      ]),
    ),
    row(["Baseline (today's search)", "", pct(base.all), ...LANGS.map((l) => pct(base.byLang[l])), "", "", "", "", "", "", ""]),
    "",
    `## Pass bar: \`${best.variant}\``,
    "",
    row(["Metric", "Bar", "Value", "Pass"]),
    row(["---", "---", "---", "---"]),
    ...passBar(best.test, base.all, best.p95).map((p) => row([p.metric, p.bar, p.value, p.pass ? "yes" : "**no**"])),
    "",
  ];

  for (const r of results) {
    lines.push(`## \`${r.variant}\``, "", "Top-1 accuracy by the probability of the top answer (service queries, both splits):", "");
    lines.push(row(["Top probability", "Accuracy"]), row(["---", "---"]));
    for (const bucket of calibration(queries, r.runs)) lines.push(row([`${bucket.from}–${bucket.to}`, pct(bucket.rate)]));

    lines.push("", "Subcategory threshold sweep on `test`, other thresholds as tuned:", "");
    lines.push(row(["T_sub", "Coverage", "Wrong filter", "Subcategory filters"]), row(["---", "---", "---", "---"]));
    for (const subcategory of [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
      const thresholds = { ...r.tuning.thresholds, subcategory };
      const m = computeMetrics(test, r.runs, thresholds, parents);
      const subFilters = test.filter((q) => decisionFor(r.runs.get(q.id), thresholds, parents).level === "subcategory").length;
      lines.push(row([subcategory, pct(m.coverage), pct(m.wrongFilter), subFilters]));
    }

    const problems = test.flatMap((q) => {
      const run = r.runs.get(q.id);
      const decision = decisionFor(run, r.tuning.thresholds, parents);
      const wrong = decision.level !== "none" && (q.kind !== "service" || !isCorrectFilter(q, decision, parents));
      const missed = q.kind === "service" && decision.level === "none";
      if (!wrong && !missed) return [];
      const got = decision.level === "none" ? `none (${decision.reason})` : `${decision.level} ${decision.slug} (${decision.probability.toFixed(2)})`;
      const top = run?.reading ? `${topAnswer(run.reading)}` : `error: ${run?.error ?? "no run"}`;
      return [row([q.id, `\`${q.q}\``, q.expect.join(", ") || "—", got, top, wrong ? "wrong filter" : "no filter"])];
    });
    lines.push("", `Wrong filters and misses on \`test\` (${problems.length}):`, "");
    if (problems.length > 0) lines.push(row(["Id", "Query", "Expected", "Decision", "Top answer", "Kind"]), row(Array(6).fill("---")), ...problems);
    lines.push("");
  }
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const taxonomy = seedTaxonomy.map(toIntentNode);
  const parents = categoryOfSubcategory(taxonomy);
  const queries = loadQueries(args.limit);

  if (args.dryRun) return dryRun(args.variants, taxonomy, queries);

  const date = new Date().toLocaleDateString("en-CA");
  const outDir = args.from ? resolve(args.from) : join(DOCS, "results", date);
  mkdirSync(outDir, { recursive: true });

  let client: TypeSafeClient | undefined;
  if (!args.from) {
    if (!process.env.TYPESAFE_API_KEY) throw new Error("TYPESAFE_API_KEY is not set (apps/backend/.env)");
    client = new TypeSafeClient({ defaultModel: SEARCH_INTENT_MODEL, timeout: 10_000, logLevel: "warn" });
  }

  const results: VariantResult[] = [];
  for (const variant of args.variants) {
    const rawFile = join(outDir, `${variant}.raw.json`);
    let records: RawRecord[];
    if (client) {
      console.log(`Running ${variant} on ${queries.length} queries…`);
      records = await runVariant(client, variant, queries, taxonomy, args.concurrency);
      writeFileSync(rawFile, JSON.stringify(records, null, 2));
    } else {
      records = (JSON.parse(readFileSync(rawFile, "utf8")) as RawRecord[]).map((record) => ({
        ...record,
        reading: record.answers ? readSearchIntent(record.answers as never, taxonomy, variant) : null,
      }));
    }

    const runs = new Map<string, EvalRun>(records.map((record) => [record.id, record]));
    const tuning = tuneThresholds(queries.filter((q) => q.split === "dev"), runs, parents);
    const ok = records.filter((record) => record.reading);
    results.push({
      variant,
      runs,
      tuning,
      test: computeMetrics(queries.filter((q) => q.split === "test"), runs, tuning.thresholds, parents),
      p50: percentile(ok.map((record) => record.latencyMs), 50),
      p95: percentile(ok.map((record) => record.latencyMs), 95),
      cost: costPer10k(records),
      models: [...new Set(ok.map((record) => record.model!).filter(Boolean))],
    });
  }

  const markdown = report(results, queries, taxonomy, parents, date);
  writeFileSync(join(outDir, "report.md"), markdown);
  console.log(`\n${markdown.split("\n## `")[0]}\nFull report: ${join(outDir, "report.md")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


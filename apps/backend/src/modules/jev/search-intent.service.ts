import { Inject, Injectable, Logger } from "@nestjs/common";
import type { Questions, TypeSafeClient } from "@typesafe-ai/sdk";
import type { ProviderSearchQuery } from "../../common/contract";
import { CategoriesService } from "../categories/categories.service";
import type { SearchWidening } from "../providers/providers.service";
import { SiteSettingsService } from "../settings/site-settings.service";
import {
  SEARCH_INTENT_MODEL,
  buildSearchIntentQuestions,
  categoryOfSubcategory,
  decideSearchIntent,
  readSearchIntent,
  searchIntentState,
  type IntentNode,
  type SearchIntentThresholds,
} from "./search-intent";

export const JEV_CLIENT = Symbol("JEV_CLIENT");
export type JevClient = Pick<TypeSafeClient, "systemOne">;

// flat-fr as tuned on the dev split, docs/ai-jev/results/2026-09-19. Valid for jev-1.13.0 only.
export const SEARCH_INTENT_THRESHOLDS: SearchIntentThresholds = { name: 0.5, subcategory: 0.95, category: 0.55 };
export const SEARCH_INTENT_LIMITS = {
  // The search waits this long; a slower answer still lands in the cache for the next identical search.
  budgetMs: 800,
  // An aborted request closes its TLS connection, and the next call pays a cold handshake (700–900 ms measured).
  requestTimeoutMs: 5000,
  minQueryLength: 3,
  cacheTtlMs: 10 * 60 * 1000,
  cacheMaxEntries: 1000,
  taxonomyTtlMs: 5 * 60 * 1000,
} as const;

export type SearchInterpretation = { level: "subcategory" | "category"; slug: string; label: string };
export type ResolvedInterpretation = { interpretation: SearchInterpretation; widenTo: SearchWidening };

type TreeNode = Awaited<ReturnType<CategoriesService["tree"]>>["items"][number];

type Catalog = {
  nodes: IntentNode[];
  questions: Questions;
  parents: Map<string, string>;
  categories: Map<string, TreeNode>;
  subcategories: Map<string, TreeNode["children"][number]>;
};

export function normalizeSearchQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

@Injectable()
export class SearchIntentService {
  private readonly logger = new Logger(SearchIntentService.name);
  private readonly cache = new Map<string, { expiresAt: number; value: ResolvedInterpretation | null }>();
  private readonly inFlight = new Map<string, Promise<ResolvedInterpretation | null>>();
  private catalog?: { expiresAt: number; value: Catalog };
  now = () => Date.now();
  budgetMs: number = SEARCH_INTENT_LIMITS.budgetMs;

  constructor(
    private readonly settings: SiteSettingsService,
    private readonly categories: CategoriesService,
    @Inject(JEV_CLIENT) private readonly client: JevClient | null,
  ) {}

  /** Null means "search the text only": not asked, not decided, or Jev failed. */
  async interpret(query: ProviderSearchQuery): Promise<ResolvedInterpretation | null> {
    const q = query.q?.trim() ?? "";
    if (!this.client || query.interpret === false || q.length < SEARCH_INTENT_LIMITS.minQueryLength) return null;
    if (query.categoryId || query.categorySlug || query.subcategoryId) return null;
    if (!(await this.settings.getBoolean("feat_jev_search"))) return null;

    const key = normalizeSearchQuery(q);
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > this.now()) return cached.value;

    let call = this.inFlight.get(key);
    if (!call) {
      call = this.ask(q, key).finally(() => this.inFlight.delete(key));
      this.inFlight.set(key, call);
    }
    return this.withinBudget(call);
  }

  private async withinBudget(call: Promise<ResolvedInterpretation | null>): Promise<ResolvedInterpretation | null> {
    let timer: NodeJS.Timeout | undefined;
    const overBudget = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), this.budgetMs);
    });
    try {
      return await Promise.race([call, overBudget]);
    } finally {
      clearTimeout(timer);
    }
  }

  private async ask(q: string, key: string): Promise<ResolvedInterpretation | null> {
    const startedAt = this.now();
    try {
      const catalog = await this.getCatalog();
      const response = await this.client!.systemOne(
        { state: searchIntentState(q), questions: catalog.questions, model: SEARCH_INTENT_MODEL },
        { timeout: SEARCH_INTENT_LIMITS.requestTimeoutMs, retry: { maxRetries: 0 } },
      );
      const reading = readSearchIntent(response.answers as never, catalog.nodes, "flat-fr");
      const decision = decideSearchIntent(reading, SEARCH_INTENT_THRESHOLDS, catalog.parents);
      const value = this.resolve(decision, catalog);

      const probability = decision.level === "none" ? (reading.subcategories[0]?.probability ?? 0) : decision.probability;
      const elapsed = this.now() - startedAt;
      this.logger.log(
        `decision=${decision.level === "none" ? `none:${decision.reason}` : decision.level} p=${probability.toFixed(2)} ` +
          `ms=${elapsed}${elapsed > this.budgetMs ? " late" : ""} qlen=${q.length} model=${response.model}`,
      );
      this.remember(key, value);
      return value;
    } catch (error) {
      this.logger.warn(`failed after ${this.now() - startedAt} ms: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`);
      return null;
    }
  }

  private resolve(decision: ReturnType<typeof decideSearchIntent>, catalog: Catalog): ResolvedInterpretation | null {
    if (decision.level === "subcategory") {
      const node = catalog.subcategories.get(decision.slug);
      if (!node) return null;
      return {
        interpretation: { level: "subcategory", slug: node.slug, label: node.name },
        widenTo: { subcategoryId: node.id },
      };
    }
    if (decision.level === "category") {
      const node = catalog.categories.get(decision.slug);
      if (!node) return null;
      return {
        interpretation: { level: "category", slug: node.slug, label: node.name },
        widenTo: { categorySlug: node.slug },
      };
    }
    return null;
  }

  private remember(key: string, value: ResolvedInterpretation | null) {
    this.cache.delete(key);
    this.cache.set(key, { expiresAt: this.now() + SEARCH_INTENT_LIMITS.cacheTtlMs, value });
    while (this.cache.size > SEARCH_INTENT_LIMITS.cacheMaxEntries) {
      this.cache.delete(this.cache.keys().next().value!);
    }
  }

  private async getCatalog(): Promise<Catalog> {
    if (this.catalog && this.catalog.expiresAt > this.now()) return this.catalog.value;

    const { items } = await this.categories.tree();
    const toNode = (node: { slug: string; name: string; children: Array<typeof node> }): IntentNode => ({
      slug: node.slug,
      name: node.name,
      children: node.children.map(toNode),
    });
    const nodes = items.map(toNode);
    const value: Catalog = {
      nodes,
      questions: buildSearchIntentQuestions(nodes, "flat-fr"),
      parents: categoryOfSubcategory(nodes),
      categories: new Map(items.map((category) => [category.slug, category])),
      subcategories: new Map(items.flatMap((category) => category.children.map((sub) => [sub.slug, sub] as const))),
    };
    this.catalog = { expiresAt: this.now() + SEARCH_INTENT_LIMITS.taxonomyTtlMs, value };
    return value;
  }
}

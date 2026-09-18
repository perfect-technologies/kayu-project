import assert from "node:assert/strict";
import test from "node:test";
import { ProviderSearchParams } from "../../common/contract";
import { NO_MATCH, SEARCH_INTENT_MODEL } from "./search-intent";
import { SEARCH_INTENT_LIMITS, SearchIntentService, normalizeSearchQuery, type JevClient } from "./search-intent.service";

const tree = {
  items: [
    {
      id: "cat_batiment",
      slug: "batiment",
      name: "Bâtiment & Construction",
      children: [
        { id: "sub_plomberie", slug: "plomberie", name: "Plomberie", children: [{ id: "sub_fuites", slug: "fuites", name: "Dépannage & fuites", children: [] }] },
        { id: "sub_electricite", slug: "electricite", name: "Électricité", children: [] },
      ],
    },
    { id: "cat_beaute", slug: "beaute", name: "Beauté & Bien-être", children: [{ id: "sub_coiffure", slug: "coiffure", name: "Coiffure", children: [] }] },
  ],
};

type Answer = { service: Record<string, number>; nom: number };

function makeService(options: { answers?: (q: string) => Answer | Error; enabled?: boolean; client?: boolean } = {}) {
  const calls: Array<{ request: { state: unknown; model?: string }; options: unknown }> = [];
  let resolveGate: (() => void) | null = null;
  const gate = { hold: false, release: () => resolveGate?.() };

  const client: JevClient = {
    systemOne: (async (request: { state: { recherche: string }; model?: string }, requestOptions: unknown) => {
      calls.push({ request, options: requestOptions });
      if (gate.hold) await new Promise<void>((resolve) => (resolveGate = resolve));
      const answer = (options.answers ?? (() => ({ service: { plomberie: 0.99 }, nom: 0.02 })))(request.state.recherche);
      if (answer instanceof Error) throw answer;
      const [choice] = Object.entries(answer.service).sort((a, b) => b[1] - a[1])[0]!;
      return {
        model: "jev-1.13.0",
        usage: { input_tokens: 3600, output_tokens: 0 },
        answers: {
          service: { type: "choice", choice, confidence: 1, probabilities: answer.service },
          nom: { type: "noul", noul: answer.nom },
        },
      };
    }) as never,
  };
  const settings = { getBoolean: async () => options.enabled ?? true };
  let treeCalls = 0;
  const categories = { tree: async () => (treeCalls++, tree) };

  const service = new SearchIntentService(settings as never, categories as never, options.client === false ? null : client);
  let clock = 1_000_000;
  service.now = () => clock;
  return { service, calls, gate, advance: (ms: number) => (clock += ms), treeCalls: () => treeCalls };
}

const query = (input: Record<string, unknown>) => ProviderSearchParams.parse(input);

test("a confident subcategory widens by its id and reports its label", async () => {
  const { service, calls } = makeService();
  const resolved = await service.interpret(query({ q: "fuite d'eau sous l'évier" }));

  assert.deepEqual(resolved, {
    interpretation: { level: "subcategory", slug: "plomberie", label: "Plomberie" },
    widenTo: { subcategoryId: "sub_plomberie" },
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0]!.request.state, { recherche: "fuite d'eau sous l'évier" });
  assert.equal(calls[0]!.request.model, SEARCH_INTENT_MODEL);
  assert.deepEqual(calls[0]!.options, { timeout: SEARCH_INTENT_LIMITS.requestTimeoutMs, retry: { maxRetries: 0 } });
});

test("an unsure subcategory inside a clear category widens by the category slug", async () => {
  const { service } = makeService({ answers: () => ({ service: { plomberie: 0.5, electricite: 0.45, [NO_MATCH]: 0.05 }, nom: 0.02 }) });
  assert.deepEqual(await service.interpret(query({ q: "travaux maison" })), {
    interpretation: { level: "category", slug: "batiment", label: "Bâtiment & Construction" },
    widenTo: { categorySlug: "batiment" },
  });
});

test("a name, a no-match or a flat answer gives no interpretation", async () => {
  const name = makeService({ answers: () => ({ service: { coiffure: 0.99 }, nom: 0.9 }) });
  assert.equal(await name.service.interpret(query({ q: "Salon Élégance" })), null);

  const noMatch = makeService({ answers: () => ({ service: { [NO_MATCH]: 0.9, coiffure: 0.1 }, nom: 0.1 }) });
  assert.equal(await noMatch.service.interpret(query({ q: "mot de passe oublié" })), null);

  const flat = makeService({ answers: () => ({ service: { plomberie: 0.3, coiffure: 0.3, [NO_MATCH]: 0.4 }, nom: 0.1 }) });
  assert.equal(await flat.service.interpret(query({ q: "bonjour à tous" })), null);
});

test("Jev is not asked when the feature is off, there is no key, the client opted out, the query is short or a category is chosen", async () => {
  const off = makeService({ enabled: false });
  assert.equal(await off.service.interpret(query({ q: "plombier" })), null);
  assert.equal(off.calls.length, 0);

  const noKey = makeService({ client: false });
  assert.equal(await noKey.service.interpret(query({ q: "plombier" })), null);

  const { service, calls } = makeService();
  for (const input of [
    { q: "plombier", interpret: "false" },
    { q: "  ab " },
    {},
    { q: "plombier", categorySlug: "batiment" },
    { q: "plombier", categoryId: "cat_batiment" },
    { q: "plombier", subcategoryId: "sub_plomberie" },
  ]) {
    assert.equal(await service.interpret(query(input)), null, JSON.stringify(input));
  }
  assert.equal(calls.length, 0);
});

test("answers are cached per normalized query for ten minutes, the taxonomy for five", async () => {
  const { service, calls, advance, treeCalls } = makeService();
  await service.interpret(query({ q: "Plombier  Gombe" }));
  await service.interpret(query({ q: "  plombier gombe " }));
  assert.equal(calls.length, 1);
  assert.equal(normalizeSearchQuery("  Plombier   Gombe "), "plombier gombe");

  advance(SEARCH_INTENT_LIMITS.cacheTtlMs + 1);
  await service.interpret(query({ q: "plombier gombe" }));
  assert.equal(calls.length, 2);
  assert.equal(treeCalls(), 2);
});

test("a no-interpretation answer is cached too; a failure is not", async () => {
  let fail = true;
  const { service, calls } = makeService({
    answers: (q) => (q === "boom" && fail ? new Error("timeout") : { service: { [NO_MATCH]: 0.95 }, nom: 0.1 }),
  });

  assert.equal(await service.interpret(query({ q: "bonjour" })), null);
  assert.equal(await service.interpret(query({ q: "bonjour" })), null);
  assert.equal(calls.length, 1);

  assert.equal(await service.interpret(query({ q: "boom" })), null);
  fail = false;
  assert.equal(await service.interpret(query({ q: "boom" })), null);
  assert.equal(calls.length, 3);
});

test("concurrent identical searches share one call", async () => {
  const { service, calls, gate } = makeService();
  gate.hold = true;
  const first = service.interpret(query({ q: "plombier", page: "1" }));
  const second = service.interpret(query({ q: "plombier", page: "2" }));
  await new Promise((resolve) => setImmediate(resolve));
  gate.release();

  const [a, b] = await Promise.all([first, second]);
  assert.equal(calls.length, 1);
  assert.deepEqual(a, b);
});

test("the cache is bounded; the oldest entry goes first", async () => {
  const { service, calls } = makeService();
  for (let i = 0; i <= SEARCH_INTENT_LIMITS.cacheMaxEntries; i++) await service.interpret(query({ q: `requete ${i}` }));
  assert.equal(calls.length, SEARCH_INTENT_LIMITS.cacheMaxEntries + 1);

  await service.interpret(query({ q: `requete ${SEARCH_INTENT_LIMITS.cacheMaxEntries}` }));
  assert.equal(calls.length, SEARCH_INTENT_LIMITS.cacheMaxEntries + 1);
  await service.interpret(query({ q: "requete 0" }));
  assert.equal(calls.length, SEARCH_INTENT_LIMITS.cacheMaxEntries + 2);
});

test("an answer slower than the budget does not hold the search, and lands in the cache for the next one", async () => {
  const { service, calls, gate } = makeService();
  service.budgetMs = 20;
  gate.hold = true;

  assert.equal(await service.interpret(query({ q: "plombier" })), null);
  assert.equal(await service.interpret(query({ q: "plombier" })), null);
  assert.equal(calls.length, 1);

  gate.release();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal((await service.interpret(query({ q: "plombier" })))?.interpretation.slug, "plomberie");
  assert.equal(calls.length, 1);
});

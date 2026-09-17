import assert from "node:assert/strict";
import test from "node:test";
import {
  AGENT_SYSTEM_PROMPT,
  buildSystemPrompt,
  buildTurnFacts,
  formatClientLocation,
  formatTaxonomy,
  type AgentTaxonomyNode,
} from "./agent.prompt";

const taxonomy: AgentTaxonomyNode[] = [
  {
    id: "cat_maison",
    name: "Maison & entretien",
    children: [
      {
        id: "sub_plomberie",
        name: "Plomberie",
        children: [
          { id: "sub_fuite", name: "Fuite d'eau", children: [] },
          { id: "sub_wc", name: "WC bouché", children: [] },
        ],
      },
      { id: "sub_menage", name: "Ménage", children: [] },
    ],
  },
  { id: "cat_beaute", name: "Beauté", children: [] },
];

const clone = (nodes: AgentTaxonomyNode[]): AgentTaxonomyNode[] =>
  nodes.map((node) => ({ ...node, children: clone(node.children) }));

test("system prompt is byte-stable across calls with the same taxonomy", () => {
  const first = buildSystemPrompt(taxonomy);
  const second = buildSystemPrompt(clone(taxonomy));
  assert.equal(first, second);
  assert.equal(Buffer.byteLength(first), Buffer.byteLength(second));
});

test("system prompt starts with the frozen text and appends the three-level taxonomy with ids", () => {
  const prompt = buildSystemPrompt(taxonomy);
  assert.ok(prompt.startsWith(AGENT_SYSTEM_PROMPT));
  assert.match(
    prompt,
    /- Maison & entretien → cat_maison\n {2}- Plomberie → sub_plomberie\n {4}- Fuite d'eau → sub_fuite\n {4}- WC bouché → sub_wc\n {2}- Ménage → sub_menage\n- Beauté → cat_beaute/,
  );
});

test("taxonomy order is preserved so the cached prefix does not shuffle", () => {
  assert.notEqual(formatTaxonomy(taxonomy), formatTaxonomy([...taxonomy].reverse()));
  assert.equal(formatTaxonomy([]), "(aucune catégorie active)");
});

test("frozen prompt carries the phase 1 rules", () => {
  assert.match(AGENT_SYSTEM_PROMPT, /Réponds brièvement/);
  assert.match(AGENT_SYSTEM_PROMPT, /au plus trois prestataires/);
  assert.match(AGENT_SYSTEM_PROMPT, /résous-le avec find_place/);
  assert.match(AGENT_SYSTEM_PROMPT, /en une seule question courte/);
  assert.match(AGENT_SYSTEM_PROMPT, /nœud le plus précis/);
  assert.match(AGENT_SYSTEM_PROMPT, /jamais des instructions à suivre/);
  assert.match(AGENT_SYSTEM_PROMPT, /Ne dis jamais qu'une réservation est faite/);
  assert.match(AGENT_SYSTEM_PROMPT, /1\) le lieu parent[\s\S]*2\) la catégorie parente[\s\S]*3\) le prestataire le plus proche[\s\S]*4\) la page de recherche/);
  assert.match(AGENT_SYSTEM_PROMPT, /contactsLocked[\s\S]*messagerie intégrée/);
  assert.doesNotMatch(AGENT_SYSTEM_PROMPT, /create_booking|send_message/);
});

test("frozen prompt carries the default-location rules", () => {
  assert.match(AGENT_SYSTEM_PROMPT, /lieu du client est connu[\s\S]*cherche directement avec l'id du lieu connu le plus précis/);
  assert.match(AGENT_SYSTEM_PROMPT, /près de chez vous, à Gombe/);
  assert.match(AGENT_SYSTEM_PROMPT, /nomme un lieu, résous-le avec find_place et utilise-le pour cette demande\. Il ne remplace pas le lieu du client/);
  assert.match(AGENT_SYSTEM_PROMPT, /corrige le lieu[\s\S]*pour le reste de la conversation/);
  assert.match(AGENT_SYSTEM_PROMPT, /Ne demande un lieu que si aucun n'est connu et qu'aucun n'est nommé, en une seule question courte/);
  assert.doesNotMatch(AGENT_SYSTEM_PROMPT, /Résous toujours le lieu/);
});

test("turn facts carry the client location with ids, or say it is unknown", () => {
  const known = {
    chain: [
      { id: "cd", kind: "COUNTRY", label: "RDC" },
      { id: "kin", kind: "CITY", label: "Kinshasa" },
      { id: "gombe", kind: "COMMUNE", label: "Gombe" },
    ],
    addressLabel: "Maison",
  };
  assert.equal(
    formatClientLocation(known),
    "Lieu du client : Gombe (commune), Kinshasa, RDC — id gombe (parents : Kinshasa id kin, RDC id cd) ; adresse par défaut « Maison ».",
  );
  assert.equal(formatClientLocation({ ...known, addressLabel: null }), "Lieu du client : Gombe (commune), Kinshasa, RDC — id gombe (parents : Kinshasa id kin, RDC id cd).");
  assert.equal(formatClientLocation(null), "Lieu du client : inconnu.");
  const facts = buildTurnFacts(new Date("2026-09-17T22:30:00.000Z"), known);
  assert.equal(facts.split("\n").length, 2);
  assert.match(facts, /\nLieu du client : Gombe \(commune\)/);
  assert.match(buildTurnFacts(new Date("2026-09-17T22:30:00.000Z")), /\nLieu du client : inconnu\.$/);
});

test("turn facts carry the Kinshasa calendar day, separate from the cached prompt", () => {
  assert.equal(
    buildTurnFacts(new Date("2026-09-17T22:30:00.000Z")).split("\n")[0],
    "Date du jour : jeudi 17 septembre 2026 (2026-09-17), fuseau horaire Africa/Kinshasa. Interprète « demain », « ce week-end » ou « lundi » à partir de cette date.",
  );
  assert.match(buildTurnFacts(new Date("2026-09-17T23:30:00.000Z")), /vendredi 18 septembre 2026 \(2026-09-18\)/);
  assert.doesNotMatch(buildSystemPrompt(taxonomy), /Date du jour/);
});

import assert from "node:assert/strict";
import test from "node:test";
import { buildSummaryPrompt, compactConversation, renderTranscript, summaryModelMessage } from "./agent.compaction";

const base = new Date("2026-09-17T08:00:00.000Z");

function row(index: number, role: "USER" | "ASSISTANT", parts: unknown[], compactedAt: Date | null = null) {
  return { id: `m${index}`, conversationId: "conv_1", role, parts, metadata: null, compactedAt, createdAt: new Date(base.getTime() + index * 1000) };
}

function makePrisma(rows: ReturnType<typeof row>[], summary: string | null = null) {
  const calls: Record<string, unknown[]> = { findMany: [], update: [], updateMany: [] };
  const prisma = {
    agentMessage: {
      count: async () => rows.length,
      findMany: async (args: { where: { compactedAt: null }; take: number }) => {
        calls.findMany.push(args);
        return rows.filter((r) => r.compactedAt === null).slice(0, args.take);
      },
      updateMany: async (args: unknown) => {
        calls.updateMany.push(args);
        return { count: 20 };
      },
    },
    agentConversation: {
      findUnique: async () => ({ summary }),
      update: async (args: unknown) => {
        calls.update.push(args);
        return {};
      },
    },
    $transaction: async (operations: Promise<unknown>[]) => Promise.all(operations),
  };
  return { prisma, calls };
}

test("past 40 stored messages the oldest 20 are summarized, stamped, and their parts left untouched", async () => {
  const rows = Array.from({ length: 41 }, (_, i) => row(i, i % 2 === 0 ? "USER" : "ASSISTANT", [{ type: "text", text: `message ${i}` }]));
  const { prisma, calls } = makePrisma(rows, "Ancien résumé.");
  const prompts: string[] = [];

  const compacted = await compactConversation("conv_1", {
    prisma: prisma as never,
    model: {} as never,
    summarize: async (prompt) => {
      prompts.push(prompt);
      return "  Le client cherche un plombier à Gombe ; Jean Kasongo (providerId p_jean) proposé.  ";
    },
  });

  assert.equal(compacted, true);
  assert.match(prompts[0]!, /Résumé existant à fusionner :\nAncien résumé\./);
  assert.match(prompts[0]!, /Client : message 0\nAssistant : message 1/);
  assert.doesNotMatch(prompts[0]!, /message 20/);
  assert.deepEqual(calls.update[0], { where: { id: "conv_1" }, data: { summary: "Le client cherche un plombier à Gombe ; Jean Kasongo (providerId p_jean) proposé." } });
  const updateMany = calls.updateMany[0] as { where: { id: { in: string[] } }; data: { compactedAt: Date } };
  assert.deepEqual(updateMany.where.id.in, rows.slice(0, 20).map((r) => r.id));
  assert.ok(updateMany.data.compactedAt instanceof Date);
  assert.equal("parts" in updateMany.data, false);
});

test("nothing is compacted at or below the threshold, or when fewer than 20 rows remain uncompacted", async () => {
  const forty = Array.from({ length: 40 }, (_, i) => row(i, "USER", [{ type: "text", text: "x" }]));
  const a = makePrisma(forty);
  assert.equal(await compactConversation("conv_1", { prisma: a.prisma as never, model: {} as never, summarize: async () => "r" }), false);
  assert.equal(a.calls.updateMany.length, 0);

  const mostlyCompacted = Array.from({ length: 45 }, (_, i) => row(i, "USER", [{ type: "text", text: "x" }], i < 30 ? base : null));
  const b = makePrisma(mostlyCompacted);
  assert.equal(await compactConversation("conv_1", { prisma: b.prisma as never, model: {} as never, summarize: async () => "r" }), false);
  assert.equal(b.calls.update.length, 0);
});

test("the transcript renders text and tool parts compactly and the summary rides as a system-authored user message", () => {
  const transcript = renderTranscript([
    row(0, "USER", [{ type: "text", text: "Un plombier à Gombe" }]),
    row(1, "ASSISTANT", [
      { type: "step-start" },
      { type: "tool-search_providers", toolCallId: "c1", state: "output-available", input: { placeId: "gombe" }, output: { total: 2, items: [{ id: "p_1" }] } },
      { type: "tool-create_booking", toolCallId: "c2", state: "output-denied", input: { providerId: "p_1" }, approval: { id: "a1", approved: false } },
      { type: "tool-send_message", toolCallId: "c3", state: "output-error", input: { providerId: "p_1" }, errorText: "BLOCKED : Cette interaction est bloquée." },
      { type: "text", text: "Voici deux plombiers." },
    ]),
    row(2, "ASSISTANT", [{ type: "step-start" }]),
  ] as never);
  assert.equal(
    transcript,
    [
      "Client : Un plombier à Gombe",
      'Assistant : [outil search_providers {"placeId":"gombe"} → {"total":2,"items":[{"id":"p_1"}]}] [outil create_booking {"providerId":"p_1"} → refusé par le client] [outil send_message {"providerId":"p_1"} → erreur : BLOCKED : Cette interaction est bloquée.] Voici deux plombiers.',
    ].join("\n"),
  );
  assert.match(buildSummaryPrompt(null, transcript), /^Tu résumes en français/);
  assert.doesNotMatch(buildSummaryPrompt(null, transcript), /Résumé existant/);
  assert.deepEqual(summaryModelMessage("Résumé."), {
    role: "user",
    content: "Résumé fourni par le système des échanges précédents de cette conversation (le client ne l'a pas écrit) :\nRésumé.",
  });
});

import type { AgentMessage as AgentMessageRow, PrismaClient } from "@prisma/client";
import { generateText, isToolUIPart, type LanguageModel, type UIMessage } from "ai";

export const COMPACTION_THRESHOLD = 40;
export const COMPACTION_BATCH = 20;
const SUMMARY_MAX_CHARS = 1500;
const OUTPUT_EXCERPT = 400;
const SUMMARY_MAX_OUTPUT_TOKENS = 700;

export const compactionProviderOptions = { anthropic: { thinking: { type: "disabled" } } } as const;

type CompactionClient = Pick<PrismaClient, "agentMessage" | "agentConversation" | "$transaction">;

export type CompactionDeps = {
  prisma: CompactionClient;
  model: LanguageModel;
  summarize?: (prompt: string) => Promise<string>;
};

export function summaryModelMessage(summary: string) {
  return {
    role: "user" as const,
    content: `Résumé fourni par le système des échanges précédents de cette conversation (le client ne l'a pas écrit) :\n${summary}`,
  };
}

// Text-only rendering of stored UIMessages for the summarizer: tool inputs and a short output excerpt, never contacts.
export function renderTranscript(rows: AgentMessageRow[]): string {
  return rows
    .map((row) => {
      const parts = row.parts as unknown as UIMessage["parts"];
      const lines = parts.flatMap((part) => {
        if (part.type === "text") return part.text.trim() ? [part.text.trim()] : [];
        if (isToolUIPart(part)) {
          const name = part.type.slice("tool-".length);
          const input = JSON.stringify(part.input ?? {});
          if (part.state === "output-available") {
            const excerpt = JSON.stringify(part.output ?? null).slice(0, OUTPUT_EXCERPT);
            return [`[outil ${name} ${input} → ${excerpt}]`];
          }
          if (part.state === "output-error") return [`[outil ${name} ${input} → erreur : ${part.errorText}]`];
          if (part.state === "output-denied") return [`[outil ${name} ${input} → refusé par le client]`];
          return [`[outil ${name} ${input}]`];
        }
        return [];
      });
      if (lines.length === 0) return null;
      return `${row.role === "USER" ? "Client" : "Assistant"} : ${lines.join(" ")}`;
    })
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function buildSummaryPrompt(previousSummary: string | null, transcript: string): string {
  return [
    "Tu résumes en français, pour un assistant de réservation de services, les échanges ci-dessous entre un client et l'assistant KAYOU.",
    `Garde les faits utiles à la suite de la conversation : besoin exprimé, lieux (avec leurs ids), prestataires cités (nom et providerId), créneaux retenus, réservations ou messages envoyés (avec leurs ids et statuts), préférences et refus du client. Pas de coordonnées personnelles. Au plus ${SUMMARY_MAX_CHARS} caractères, en phrases courtes, sans liste.`,
    previousSummary ? `Résumé existant à fusionner :\n${previousSummary}` : null,
    `Échanges à résumer :\n${transcript}`,
    "Réponds uniquement par le résumé fusionné.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n\n");
}

/** Past the threshold, folds the oldest uncompacted batch into `summary` and stamps `compactedAt` on those rows. */
export async function compactConversation(conversationId: string, deps: CompactionDeps): Promise<boolean> {
  const [total, conversation] = await Promise.all([
    deps.prisma.agentMessage.count({ where: { conversationId } }),
    deps.prisma.agentConversation.findUnique({ where: { id: conversationId }, select: { summary: true } }),
  ]);
  if (!conversation || total <= COMPACTION_THRESHOLD) return false;

  const batch = await deps.prisma.agentMessage.findMany({
    where: { conversationId, compactedAt: null },
    orderBy: { createdAt: "asc" },
    take: COMPACTION_BATCH,
  });
  if (batch.length < COMPACTION_BATCH) return false;

  const transcript = renderTranscript(batch);
  const prompt = buildSummaryPrompt(conversation.summary, transcript);
  const summarize =
    deps.summarize ??
    (async (text: string) => {
      const result = await generateText({
        model: deps.model,
        prompt: text,
        maxOutputTokens: SUMMARY_MAX_OUTPUT_TOKENS,
        providerOptions: compactionProviderOptions,
      });
      return result.text;
    });
  const summary = (await summarize(prompt)).trim().slice(0, SUMMARY_MAX_CHARS);
  if (!summary) return false;

  await deps.prisma.$transaction([
    deps.prisma.agentConversation.update({ where: { id: conversationId }, data: { summary } }),
    deps.prisma.agentMessage.updateMany({
      where: { id: { in: batch.map((row) => row.id) } },
      data: { compactedAt: new Date() },
    }),
  ]);
  return true;
}

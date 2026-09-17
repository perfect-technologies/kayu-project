import { BadRequestException, ConflictException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { AgentMessage as AgentMessageRow, Prisma } from "@prisma/client";
import {
  convertToModelMessages,
  createIdGenerator,
  pipeUIMessageStreamToResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
  type FinishReason,
  type LanguageModelUsage,
  type ModelMessage,
  type UIMessage,
} from "ai";
import type { ServerResponse } from "node:http";
import type { Actor } from "../../common/auth/types";
import { apiError, notFound } from "../../common/http/errors";
import { PrismaService } from "../../database/prisma.service";
import { AddressesService } from "../addresses/addresses.service";
import { CategoriesService } from "../categories/categories.service";
import { PlaceTreeService } from "../places/place-tree.service";
import { PlacesService } from "../places/places.service";
import { ProvidersService } from "../providers/providers.service";
import { agentCallProviderOptions, agentModel, agentModelId, cachedSystemProviderOptions } from "./agent.model";
import { resolveDefaultLocation, type ClientLocation } from "./agent.location";
import { buildSystemPrompt, buildTurnFacts, type AgentTaxonomyNode } from "./agent.prompt";
import { buildTools, type AgentToolCallTrace, type AgentTools } from "./agent.tools";

export const AGENT_MAX_STEPS = 8;
// A stalled gateway stream once held a turn open for 15 minutes; these bound a turn without cutting a slow step.
export const AGENT_TIMEOUTS = { firstChunkMs: 45_000, chunkMs: 45_000, totalMs: 180_000 } as const;
const TAXONOMY_TTL_MS = 5 * 60 * 1000;
const TITLE_MAX_LENGTH = 60;
const CONVERSATION_LIST_LIMIT = 20;

export type AgentMessageMetadata = Record<string, unknown> | undefined;
export type AgentUIMessage = UIMessage<AgentMessageMetadata>;

export type IncomingUserMessage = {
  id: string;
  role: "user";
  parts: Array<{ type: string; [key: string]: unknown }>;
  metadata?: Record<string, unknown>;
};

export type TurnUsageSource = {
  totalUsage: PromiseLike<LanguageModelUsage>;
  steps: PromiseLike<ReadonlyArray<unknown>>;
};

export type AgentTurnMetadata = {
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedInputTokens: number | null;
  cacheWriteTokens: number | null;
  stepCount: number;
  tools: AgentToolCallTrace[];
  latencyMs: number;
  finishReason: FinishReason | null;
  aborted: boolean;
};

type ConversationWithMessages = Prisma.AgentConversationGetPayload<{ include: { messages: true } }>;

const conversationSummarySelect = {
  id: true,
  title: true,
  status: true,
  lastMessageAt: true,
  createdAt: true,
} satisfies Prisma.AgentConversationSelect;

const generateAssistantMessageId = createIdGenerator({ prefix: "msg", size: 16 });

export function rowToUIMessage(row: AgentMessageRow): AgentUIMessage {
  return {
    id: row.id,
    role: row.role.toLowerCase() as AgentUIMessage["role"],
    parts: row.parts as unknown as AgentUIMessage["parts"],
    metadata: (row.metadata ?? undefined) as AgentMessageMetadata,
  };
}

export function normalizeIncomingMessage(message: IncomingUserMessage): AgentUIMessage {
  const parts = message.parts
    .filter(
      (part): part is { type: "text"; text: string } =>
        part.type === "text" && typeof part.text === "string" && part.text.trim() !== "",
    )
    .map((part) => ({ type: "text" as const, text: part.text.trim() }));

  if (parts.length === 0) throw new BadRequestException("Le message doit contenir du texte.");

  return { id: message.id, role: "user", parts, metadata: message.metadata };
}

export function titleFromMessage(message: AgentUIMessage): string | null {
  const text = message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .trim();
  if (!text) return null;
  return text.length > TITLE_MAX_LENGTH ? `${text.slice(0, TITLE_MAX_LENGTH - 1).trimEnd()}…` : text;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private taxonomyCache?: { expiresAt: number; value: AgentTaxonomyNode[] };

  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: ProvidersService,
    private readonly places: PlacesService,
    private readonly placeTree: PlaceTreeService,
    private readonly categories: CategoriesService,
    private readonly addresses: AddressesService,
  ) {}

  async createConversation(actor: Actor) {
    return this.prisma.agentConversation.create({
      data: { userId: actor.id },
      select: conversationSummarySelect,
    });
  }

  async listConversations(actor: Actor) {
    const items = await this.prisma.agentConversation.findMany({
      where: { userId: actor.id, status: "ACTIVE" },
      orderBy: { lastMessageAt: "desc" },
      take: CONVERSATION_LIST_LIMIT,
      select: conversationSummarySelect,
    });
    return { items };
  }

  async getConversation(actor: Actor, conversationId: string) {
    const conversation = await this.loadConversation(actor, conversationId);
    const location = await this.resolveLocation(actor);
    return {
      id: conversation.id,
      title: conversation.title,
      status: conversation.status,
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt,
      clientLocation: location ? { placeId: location.chain[location.chain.length - 1]!.id, label: locationLabel(location) } : null,
      messages: conversation.messages.map(rowToUIMessage),
    };
  }

  async resolveLocation(actor: Actor): Promise<ClientLocation | null> {
    return resolveDefaultLocation(actor, { addresses: this.addresses, placeTree: this.placeTree });
  }

  async loadConversation(actor: Actor, conversationId: string): Promise<ConversationWithMessages> {
    const conversation = await this.prisma.agentConversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation) throw notFound("Conversation introuvable");
    if (conversation.userId !== actor.id) {
      throw apiError(HttpStatus.FORBIDDEN, "FORBIDDEN", "Cette conversation appartient à un autre compte.");
    }
    return conversation;
  }

  async runTurn(actor: Actor, conversationId: string, incoming: IncomingUserMessage, response: ServerResponse) {
    const conversation = await this.loadConversation(actor, conversationId);
    const userMessage = normalizeIncomingMessage(incoming);
    const history = await this.appendUserMessage(conversation, userMessage);
    const uiMessages: AgentUIMessage[] = [...history, userMessage];

    const trace: AgentToolCallTrace[] = [];
    const tools = await buildTools(actor, {
      places: this.places,
      placeTree: this.placeTree,
      providers: this.providers,
      onToolCall: (call) => trace.push(call),
    });

    const [systemPrompt, modelMessages, location] = await Promise.all([
      this.getSystemPrompt(),
      this.toModelMessages(uiMessages, tools),
      this.resolveLocation(actor),
    ]);

    const startedAt = Date.now();
    const result = streamText({
      model: agentModel(),
      instructions: [
        { role: "system", content: systemPrompt, providerOptions: cachedSystemProviderOptions },
        { role: "system", content: buildTurnFacts(new Date(), location) },
      ],
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(AGENT_MAX_STEPS),
      timeout: AGENT_TIMEOUTS,
      providerOptions: agentCallProviderOptions,
      onError: ({ error }) => {
        this.logger.error(`conversation=${conversation.id} model error: ${describe(error)}`);
      },
    });

    const stream = toUIMessageStream({
      stream: result.stream,
      tools,
      originalMessages: uiMessages,
      generateMessageId: generateAssistantMessageId,
      sendReasoning: false,
      onError: () => "Une erreur est survenue. Réessayez dans un instant.",
      onEnd: async ({ responseMessage, isAborted }) => {
        try {
          const metadata = await this.collectTurnMetadata(result, { trace, startedAt, aborted: isAborted });
          await this.persistAssistantMessage(conversation.id, responseMessage, metadata);
        } catch (error) {
          this.logger.error(`conversation=${conversation.id} persist failed: ${describe(error)}`);
        }
      },
    });

    await pipeUIMessageStreamToResponse({ response, stream });
  }

  async toModelMessages(uiMessages: AgentUIMessage[], tools: AgentTools): Promise<ModelMessage[]> {
    return convertToModelMessages(uiMessages, { tools, ignoreIncompleteToolCalls: true });
  }

  async appendUserMessage(conversation: ConversationWithMessages, message: AgentUIMessage): Promise<AgentUIMessage[]> {
    const existing = await this.prisma.agentMessage.findUnique({
      where: { id: message.id },
      select: { id: true, conversationId: true, createdAt: true },
    });

    if (existing && existing.conversationId !== conversation.id) {
      throw new ConflictException("Identifiant de message déjà utilisé.");
    }

    // The client resends the same id when it retries a failed turn: drop what followed it.
    // A stale id behind a later user message is not a retry and would erase real turns.
    if (existing) {
      const superseded = conversation.messages.some(
        (row) => row.role === "USER" && row.createdAt > existing.createdAt,
      );
      if (superseded) throw new ConflictException("Ce message a déjà été envoyé.");
      await this.prisma.agentMessage.deleteMany({
        where: { conversationId: conversation.id, createdAt: { gt: existing.createdAt } },
      });
      return conversation.messages.filter((row) => row.createdAt < existing.createdAt).map(rowToUIMessage);
    }

    await this.prisma.$transaction([
      this.prisma.agentMessage.create({
        data: {
          id: message.id,
          conversationId: conversation.id,
          role: "USER",
          parts: message.parts as unknown as Prisma.InputJsonValue,
          metadata: message.metadata as Prisma.InputJsonValue | undefined,
        },
      }),
      this.prisma.agentConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          ...(conversation.title ? {} : { title: titleFromMessage(message) }),
        },
      }),
    ]);

    return conversation.messages.map(rowToUIMessage);
  }

  async persistAssistantMessage(conversationId: string, message: AgentUIMessage, metadata: AgentTurnMetadata) {
    if (message.parts.length === 0) return;

    const parts = message.parts as unknown as Prisma.InputJsonValue;
    const metadataJson = metadata as unknown as Prisma.InputJsonValue;

    await this.prisma.$transaction([
      this.prisma.agentMessage.upsert({
        where: { id: message.id },
        create: { id: message.id, conversationId, role: "ASSISTANT", parts, metadata: metadataJson },
        update: { parts, metadata: metadataJson },
      }),
      this.prisma.agentConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date(), stepCount: { increment: metadata.stepCount } },
      }),
    ]);
  }

  async collectTurnMetadata(
    result: TurnUsageSource & { finishReason?: PromiseLike<FinishReason> },
    context: { trace: AgentToolCallTrace[]; startedAt: number; aborted: boolean },
  ): Promise<AgentTurnMetadata> {
    const [usage, steps, finishReason] = await Promise.all([
      Promise.resolve(result.totalUsage).catch(() => undefined),
      Promise.resolve(result.steps).catch(() => []),
      result.finishReason ? Promise.resolve(result.finishReason).catch(() => undefined) : Promise.resolve(undefined),
    ]);

    return {
      model: agentModelId(),
      inputTokens: usage?.inputTokens ?? null,
      outputTokens: usage?.outputTokens ?? null,
      cachedInputTokens: usage?.inputTokenDetails?.cacheReadTokens ?? null,
      cacheWriteTokens: usage?.inputTokenDetails?.cacheWriteTokens ?? null,
      stepCount: steps.length,
      tools: context.trace,
      latencyMs: Date.now() - context.startedAt,
      finishReason: finishReason ?? null,
      aborted: context.aborted,
    };
  }

  async getSystemPrompt(): Promise<string> {
    return buildSystemPrompt(await this.getTaxonomy());
  }

  private async getTaxonomy(): Promise<AgentTaxonomyNode[]> {
    const now = Date.now();
    if (this.taxonomyCache && this.taxonomyCache.expiresAt > now) return this.taxonomyCache.value;

    const { items } = await this.categories.tree();
    const toNode = (node: { id: string; name: string; children: Array<typeof node> }): AgentTaxonomyNode => ({
      id: node.id,
      name: node.name,
      children: node.children.map(toNode),
    });
    const value = items.map(toNode);

    this.taxonomyCache = { expiresAt: now + TAXONOMY_TTL_MS, value };
    return value;
  }
}

// "Gombe, Kinshasa": the city and its province share a label in the seed, so repeats are dropped.
export function locationLabel(location: ClientLocation): string {
  const labels = location.chain
    .filter((place) => place.kind !== "COUNTRY")
    .map((place) => place.label)
    .reverse();
  return labels.filter((label, index) => labels.indexOf(label) === index).join(", ");
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

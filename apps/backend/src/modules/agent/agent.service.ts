import { BadRequestException, ConflictException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { AgentMessage as AgentMessageRow, Prisma } from "@prisma/client";
import {
  convertToModelMessages,
  createIdGenerator,
  isToolUIPart,
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
import { BookingsService } from "../bookings/bookings.service";
import { CategoriesService } from "../categories/categories.service";
import { MessagingService } from "../messaging/messaging.service";
import { PlaceTreeService } from "../places/place-tree.service";
import { PlacesService } from "../places/places.service";
import { ProvidersService } from "../providers/providers.service";
import { ReviewsService } from "../reviews/reviews.service";
import { SiteSettingsService } from "../settings/site-settings.service";
import { compactConversation, summaryModelMessage } from "./agent.compaction";
import { resolveDefaultLocation, type ClientLocation } from "./agent.location";
import { agentCallProviderOptions, agentModel, agentModelId, cachedSystemProviderOptions } from "./agent.model";
import { buildProfileBlock, buildSuggestions, loadProfileData, type ProfileData } from "./agent.profile";
import { AGENT_TIMEZONE, buildSystemPrompt, buildTurnFacts, type AgentTaxonomyNode } from "./agent.prompt";
import { loadAgentCaps, type AgentCaps } from "./agent.settings";
import { AgentToolError, approvalConfig, buildTools, type AgentToolCallTrace, type AgentTools } from "./agent.tools";

// A stalled gateway stream once held a turn open for 15 minutes; these bound a turn without cutting a slow step.
export const AGENT_TIMEOUTS = { firstChunkMs: 45_000, chunkMs: 45_000, totalMs: 180_000 } as const;
// Past the cap the web offers a new conversation; a few extra turns are tolerated before the server refuses.
export const CONVERSATION_GRACE = 6;
const TAXONOMY_TTL_MS = 5 * 60 * 1000;
const TITLE_MAX_LENGTH = 60;
const CONVERSATION_LIST_LIMIT = 20;
const SUPERSEDED_REASON = "Remplacé par un nouveau message du client.";
const GENERIC_STREAM_ERROR = "Une erreur est survenue. Réessayez dans un instant.";

export type AgentMessageMetadata = Record<string, unknown> | undefined;
export type AgentUIMessage = UIMessage<AgentMessageMetadata>;

export type IncomingUserMessage = {
  id: string;
  role: "user";
  parts: Array<{ type: string; [key: string]: unknown }>;
  metadata?: Record<string, unknown>;
};

export type IncomingApproval = { id: string; approved: boolean; reason?: string };

export type TurnBody = { message: IncomingUserMessage } | { approvals: IncomingApproval[] };

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
  conversationFull: boolean;
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

const kinshasaDay = new Intl.DateTimeFormat("en-CA", { timeZone: AGENT_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });

// Kinshasa has no daylight saving time, so the calendar day starts at a fixed offset.
export function startOfAgentDay(now: Date): Date {
  return new Date(`${kinshasaDay.format(now)}T00:00:00+01:00`);
}

export function rowToUIMessage(row: AgentMessageRow): AgentUIMessage {
  return {
    id: row.id,
    role: row.role.toLowerCase() as AgentUIMessage["role"],
    parts: row.parts as unknown as AgentUIMessage["parts"],
    metadata: (row.metadata ?? undefined) as AgentMessageMetadata,
  };
}

// Only text reaches the loop: a client cannot forge tool calls, results or approvals through the message body.
export function normalizeIncomingMessage(message: IncomingUserMessage): AgentUIMessage {
  const foreign = message.parts.find((part) => part.type !== "text");
  if (foreign) throw new BadRequestException("Le message ne peut contenir que du texte.");

  const parts = message.parts
    .filter((part): part is { type: "text"; text: string } => typeof part.text === "string" && part.text.trim() !== "")
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

/** The web needs `conversationFull` during the turn, not only after a reload; the row keeps the full metadata. */
export function streamedMetadata(conversationFull: boolean) {
  return ({ part }: { part: { type: string } }) => (part.type === "finish" ? { conversationFull } : undefined);
}

type ApprovalPart = Extract<AgentUIMessage["parts"][number], { approval?: unknown }> & { approval: { id: string; approved?: boolean } };

export function pendingApprovals(parts: AgentUIMessage["parts"]): ApprovalPart[] {
  return parts.filter((part): part is ApprovalPart => isToolUIPart(part) && part.state === "approval-requested");
}

export function answeredApprovals(parts: AgentUIMessage["parts"]): Map<string, boolean> {
  const answered = new Map<string, boolean>();
  for (const part of parts) {
    if (isToolUIPart(part) && part.state !== "approval-requested" && part.approval?.approved !== undefined) {
      answered.set(part.approval.id, part.approval.approved);
    }
  }
  return answered;
}

export function answerApprovals(parts: AgentUIMessage["parts"], answers: Map<string, IncomingApproval>): AgentUIMessage["parts"] {
  return parts.map((part) => {
    if (!isToolUIPart(part) || part.state !== "approval-requested") return part;
    const answer = answers.get(part.approval.id);
    if (!answer) return part;
    return {
      ...part,
      state: "approval-responded",
      approval: { ...part.approval, id: part.approval.id, approved: answer.approved, reason: answer.reason },
    } as AgentUIMessage["parts"][number];
  });
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
    private readonly bookings: BookingsService,
    private readonly messaging: MessagingService,
    private readonly reviews: ReviewsService,
    private readonly settings: SiteSettingsService,
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
    const [conversation, location, caps] = await Promise.all([
      this.loadConversation(actor, conversationId),
      this.resolveLocation(actor),
      this.loadCaps(),
    ]);
    return {
      id: conversation.id,
      title: conversation.title,
      status: conversation.status,
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt,
      clientLocation: location ? { placeId: location.chain[location.chain.length - 1]!.id, label: locationLabel(location) } : null,
      full: conversation.messages.length >= caps.maxMessagesPerConversation,
      messages: conversation.messages.map(rowToUIMessage),
    };
  }

  async archiveConversation(actor: Actor, conversationId: string) {
    await this.loadConversation(actor, conversationId);
    return this.prisma.agentConversation.update({
      where: { id: conversationId },
      data: { status: "ARCHIVED" },
      select: conversationSummarySelect,
    });
  }

  async getSuggestions(actor: Actor) {
    return { items: buildSuggestions(await this.loadProfile(actor)) };
  }

  async resolveLocation(actor: Actor): Promise<ClientLocation | null> {
    return resolveDefaultLocation(actor, { addresses: this.addresses, placeTree: this.placeTree });
  }

  async loadProfile(actor: Actor): Promise<ProfileData> {
    return loadProfileData(actor, {
      addresses: this.addresses,
      bookings: this.bookings,
      messaging: this.messaging,
      reviews: this.reviews,
    });
  }

  async loadCaps(): Promise<AgentCaps> {
    return loadAgentCaps(this.prisma);
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

  async assertDailyCap(actor: Actor, caps: AgentCaps, now = new Date()) {
    const turnsToday = await this.prisma.agentMessage.count({
      where: { role: "USER", createdAt: { gte: startOfAgentDay(now) }, conversation: { userId: actor.id } },
    });
    if (turnsToday >= caps.maxTurnsPerUserPerDay) {
      throw apiError(
        HttpStatus.TOO_MANY_REQUESTS,
        "RATE_LIMITED",
        `Vous avez atteint la limite de ${caps.maxTurnsPerUserPerDay} demandes à l'assistant pour aujourd'hui. Revenez demain, ou trouvez un prestataire dans la recherche.`,
      );
    }
  }

  async runTurn(actor: Actor, conversationId: string, body: TurnBody, response: ServerResponse) {
    const conversation = await this.loadConversation(actor, conversationId);
    if (conversation.status === "ARCHIVED") {
      throw apiError(HttpStatus.CONFLICT, "INVALID_TRANSITION", "Cette conversation est archivée. Ouvrez-en une nouvelle.");
    }
    const caps = await this.loadCaps();
    if (conversation.messages.length >= caps.maxMessagesPerConversation + CONVERSATION_GRACE) {
      throw apiError(HttpStatus.CONFLICT, "LIMIT_REACHED", "Cette conversation est pleine. Ouvrez une nouvelle conversation.");
    }

    // Answering an approval is not a new turn: it finishes the one the client already spent, and being
    // stopped with a booking half-proposed would be worse than one extra turn.
    let uiMessages: AgentUIMessage[];
    let newRows = 0;
    if ("message" in body) {
      await this.assertDailyCap(actor, caps);
      const userMessage = normalizeIncomingMessage(body.message);
      const history = await this.appendUserMessage(conversation, userMessage);
      uiMessages = [...history, userMessage];
      newRows = 2;
    } else {
      uiMessages = await this.applyApprovals(conversation, body.approvals);
    }
    const conversationFull = conversation.messages.length + newRows >= caps.maxMessagesPerConversation;

    const trace: AgentToolCallTrace[] = [];
    const bookingEnabled = await this.settings.getBoolean("feat_booking");
    const tools = await buildTools(actor, {
      places: this.places,
      placeTree: this.placeTree,
      providers: this.providers,
      bookings: this.bookings,
      messaging: this.messaging,
      addresses: this.addresses,
      bookingEnabled,
      onToolCall: (call) => trace.push(call),
    });

    const [systemPrompt, profile, modelMessages, location] = await Promise.all([
      this.getSystemPrompt(),
      this.loadProfile(actor),
      this.toModelMessages(uiMessages, tools),
      this.resolveLocation(actor),
    ]);

    const startedAt = Date.now();
    const result = streamText({
      model: agentModel(),
      instructions: [
        { role: "system", content: systemPrompt, providerOptions: cachedSystemProviderOptions },
        { role: "system", content: buildProfileBlock(profile), providerOptions: cachedSystemProviderOptions },
        { role: "system", content: buildTurnFacts(new Date(), { location, phoneKnown: profile.phoneKnown, bookingEnabled }) },
      ],
      messages: [...(conversation.summary ? [summaryModelMessage(conversation.summary)] : []), ...modelMessages],
      tools,
      toolApproval: approvalConfig(tools),
      stopWhen: stepCountIs(caps.maxStepsPerTurn),
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
      messageMetadata: streamedMetadata(conversationFull),
      onError: (error) => (error instanceof AgentToolError ? error.message : GENERIC_STREAM_ERROR),
      onEnd: async ({ responseMessage, isAborted }) => {
        try {
          const metadata = await this.collectTurnMetadata(result, { trace, startedAt, aborted: isAborted, conversationFull });
          await this.persistAssistantMessage(conversation.id, responseMessage, metadata);
        } catch (error) {
          this.logger.error(`conversation=${conversation.id} persist failed: ${describe(error)}`);
        }
        await this.compact(conversation.id);
      },
    });

    await pipeUIMessageStreamToResponse({ response, stream });
  }

  async compact(conversationId: string) {
    try {
      const compacted = await compactConversation(conversationId, { prisma: this.prisma, model: agentModel() });
      if (compacted) this.logger.log(`conversation=${conversationId} compacted`);
    } catch (error) {
      this.logger.error(`conversation=${conversationId} compaction failed: ${describe(error)}`);
    }
  }

  async toModelMessages(uiMessages: AgentUIMessage[], tools: AgentTools): Promise<ModelMessage[]> {
    return convertToModelMessages(uiMessages, { tools, ignoreIncompleteToolCalls: true });
  }

  // Approvals are bound to the ids the server issued on the last assistant message; every pending one must be answered.
  async applyApprovals(conversation: ConversationWithMessages, approvals: IncomingApproval[]): Promise<AgentUIMessage[]> {
    const last = conversation.messages[conversation.messages.length - 1];
    const lastMessage = last ? rowToUIMessage(last) : null;
    const pending = lastMessage && last?.role === "ASSISTANT" ? pendingApprovals(lastMessage.parts) : [];
    if (!last || !lastMessage || pending.length === 0) {
      throw new BadRequestException("Aucune action n'attend votre accord.");
    }

    // A continued assistant message keeps the answers of earlier rounds; replaying one identically is a no-op,
    // but an unknown id, a contradicted verdict or a missing pending answer is a client bug.
    const answers = new Map(approvals.map((approval) => [approval.id, approval]));
    const pendingIds = new Set(pending.map((part) => part.approval.id));
    const alreadyAnswered = answeredApprovals(lastMessage.parts);
    const replay = (id: string, approved: boolean) => alreadyAnswered.get(id) === approved;
    const mismatch =
      answers.size !== approvals.length ||
      pending.some((part) => !answers.has(part.approval.id)) ||
      approvals.some((approval) => !pendingIds.has(approval.id) && !replay(approval.id, approval.approved));
    if (mismatch) throw new BadRequestException("Les réponses ne correspondent pas aux actions en attente.");

    const parts = answerApprovals(lastMessage.parts, answers);
    await this.prisma.agentMessage.update({ where: { id: last.id }, data: { parts: parts as unknown as Prisma.InputJsonValue } });

    return [...this.uncompacted(conversation.messages.slice(0, -1)), { ...lastMessage, parts }];
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
      return this.uncompacted(conversation.messages.filter((row) => row.createdAt < existing.createdAt));
    }

    const rows = [...conversation.messages];
    const last = rows[rows.length - 1];
    const lastMessage = last?.role === "ASSISTANT" ? rowToUIMessage(last) : null;
    const pending = lastMessage ? pendingApprovals(lastMessage.parts) : [];
    const denied =
      last && lastMessage && pending.length > 0
        ? answerApprovals(
            lastMessage.parts,
            new Map(pending.map((part) => [part.approval.id, { id: part.approval.id, approved: false, reason: SUPERSEDED_REASON }])),
          )
        : null;

    await this.prisma.$transaction([
      ...(denied && last
        ? [this.prisma.agentMessage.update({ where: { id: last.id }, data: { parts: denied as unknown as Prisma.InputJsonValue } })]
        : []),
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

    if (denied && last) rows[rows.length - 1] = { ...last, parts: denied as unknown as Prisma.JsonValue };
    return this.uncompacted(rows);
  }

  private uncompacted(rows: AgentMessageRow[]): AgentUIMessage[] {
    return rows.filter((row) => !row.compactedAt).map(rowToUIMessage);
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
    context: { trace: AgentToolCallTrace[]; startedAt: number; aborted: boolean; conversationFull?: boolean },
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
      conversationFull: context.conversationFull ?? false,
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

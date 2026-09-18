import type { Prisma } from "@prisma/client";

export type AgentCaps = {
  maxStepsPerTurn: number;
  maxMessagesPerConversation: number;
  maxTurnsPerUserPerDay: number;
};

export const AGENT_CAP_KEYS = {
  maxStepsPerTurn: "agent.maxStepsPerTurn",
  maxMessagesPerConversation: "agent.maxMessagesPerConversation",
  maxTurnsPerUserPerDay: "agent.maxTurnsPerUserPerDay",
} as const;

export const AGENT_CAP_DEFAULTS: AgentCaps = {
  maxStepsPerTurn: 8,
  maxMessagesPerConversation: 60,
  maxTurnsPerUserPerDay: 30,
};

type SettingsClient = Pick<Prisma.TransactionClient, "systemSetting">;

function positiveInt(value: Prisma.JsonValue): number | undefined {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export async function loadAgentCaps(client: SettingsClient): Promise<AgentCaps> {
  const rows = await client.systemSetting.findMany({
    where: { key: { in: Object.values(AGENT_CAP_KEYS) } },
    select: { key: true, value: true },
  });
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const read = (name: keyof AgentCaps) => {
    const value = byKey.get(AGENT_CAP_KEYS[name]);
    return (value === undefined ? undefined : positiveInt(value)) ?? AGENT_CAP_DEFAULTS[name];
  };
  return {
    maxStepsPerTurn: read("maxStepsPerTurn"),
    maxMessagesPerConversation: read("maxMessagesPerConversation"),
    maxTurnsPerUserPerDay: read("maxTurnsPerUserPerDay"),
  };
}

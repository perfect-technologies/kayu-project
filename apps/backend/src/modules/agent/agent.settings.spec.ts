import assert from "node:assert/strict";
import test from "node:test";
import { AGENT_CAP_DEFAULTS, AGENT_CAP_KEYS, loadAgentCaps } from "./agent.settings";

function client(rows: Array<{ key: string; value: unknown }>) {
  const calls: unknown[] = [];
  return {
    calls,
    systemSetting: {
      findMany: async (args: unknown) => {
        calls.push(args);
        return rows;
      },
    },
  };
}

test("caps come from SystemSetting rows and fall back to the RFC defaults", async () => {
  const prisma = client([
    { key: AGENT_CAP_KEYS.maxStepsPerTurn, value: 5 },
    { key: AGENT_CAP_KEYS.maxTurnsPerUserPerDay, value: "12" },
  ]);
  assert.deepEqual(await loadAgentCaps(prisma as never), { maxStepsPerTurn: 5, maxMessagesPerConversation: 60, maxTurnsPerUserPerDay: 12 });
  assert.deepEqual((prisma.calls[0] as { where: unknown }).where, {
    key: { in: ["agent.maxStepsPerTurn", "agent.maxMessagesPerConversation", "agent.maxTurnsPerUserPerDay"] },
  });
});

test("invalid values (zero, negative, text, floats) are ignored in favour of the defaults", async () => {
  const prisma = client([
    { key: AGENT_CAP_KEYS.maxStepsPerTurn, value: 0 },
    { key: AGENT_CAP_KEYS.maxMessagesPerConversation, value: "beaucoup" },
    { key: AGENT_CAP_KEYS.maxTurnsPerUserPerDay, value: 2.5 },
  ]);
  assert.deepEqual(await loadAgentCaps(prisma as never), AGENT_CAP_DEFAULTS);
  assert.deepEqual(await loadAgentCaps(client([]) as never), { maxStepsPerTurn: 8, maxMessagesPerConversation: 60, maxTurnsPerUserPerDay: 30 });
});

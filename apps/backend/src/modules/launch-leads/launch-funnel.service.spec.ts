import assert from "node:assert/strict";
import test from "node:test";
import { LaunchFunnelService } from "./launch-funnel.service";

test("persists a canonical first-party funnel event without identity writes", async () => {
  const rows: Array<Record<string, unknown>> = [];
  let marketplaceWrites = 0;
  const prisma = {
    campaignFunnelEvent: {
      create: async (args: { data: Record<string, unknown> }) => {
        rows.push(args.data);
        return { id: "event_1" };
      },
    },
    user: {
      create: async () => {
        marketplaceWrites += 1;
      },
    },
    provider: {
      create: async () => {
        marketplaceWrites += 1;
      },
    },
  };
  const service = new LaunchFunnelService(prisma as never);

  const result = await service.createEvent({
    schemaVersion: 1,
    eventName: "launch_form_validation_failed",
    occurredAt: new Date().toISOString(),
    route: "/launch/providers",
    deviceClass: "mobile",
    leadType: "PROVIDER",
    validationField: "phone",
    validationErrorCode: "invalid_format",
    attribution: {
      source: "facebook",
      medium: "paid_social",
      campaign: "kin-launch",
    },
  });

  assert.deepEqual(result, { accepted: true });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.eventName, "FORM_VALIDATION_FAILED");
  assert.equal(rows[0]?.deviceClass, "MOBILE");
  assert.equal(rows[0]?.leadType, "PROVIDER");
  assert.equal(
    rows[0]?.campaignKey,
    '["facebook","paid_social","kin-launch",null]',
  );
  assert.equal(marketplaceWrites, 0);
  assert.equal("ipHash" in rows[0]!, false);
});

test("rejects stale and future-dated funnel events", async () => {
  const service = new LaunchFunnelService({
    campaignFunnelEvent: {
      create: async () => ({ id: "unreachable" }),
    },
  } as never);
  const event = {
    schemaVersion: 1 as const,
    eventName: "launch_landing_viewed" as const,
    route: "/launch" as const,
    deviceClass: "unknown" as const,
  };

  await assert.rejects(
    service.createEvent({
      ...event,
      occurredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1_000).toISOString(),
    }),
    /hors de la fenêtre/,
  );
  await assert.rejects(
    service.createEvent({
      ...event,
      occurredAt: new Date(Date.now() + 6 * 60 * 1_000).toISOString(),
    }),
    /hors de la fenêtre/,
  );
});

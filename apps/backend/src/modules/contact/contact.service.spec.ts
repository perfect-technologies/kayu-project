import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import { RateLimiterService } from "../../common/rate-limit/rate-limiter.service";
import { ContactService } from "./contact.service";

const input = {
  name: "Marie Tshala",
  email: "marie@example.cd",
  phone: "",
  subject: "Partenariat",
  message: "Bonjour, je souhaite en savoir plus.",
};

function setup() {
  const created: Array<Record<string, unknown>> = [];
  const prisma = {
    contactMessage: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return data;
      },
    },
  };
  return { service: new ContactService(prisma as never, new RateLimiterService()), created };
}

test("stores the contact message with an empty phone as null", async () => {
  const { service, created } = setup();
  assert.deepEqual(await service.create(input, "1.2.3.4"), { ok: true });
  assert.equal(created[0]!.phone, null);
  assert.equal(created[0]!.email, "marie@example.cd");
});

test("allows 5 messages per IP per window, then 429 without storing, other IPs unaffected", async () => {
  const { service, created } = setup();
  for (let index = 0; index < 5; index += 1) await service.create(input, "1.2.3.4");
  await assert.rejects(
    () => service.create(input, "1.2.3.4"),
    (error: unknown) =>
      error instanceof HttpException &&
      error.getStatus() === 429 &&
      (error.getResponse() as { code: string }).code === "RATE_LIMITED",
  );
  assert.equal(created.length, 5);
  await service.create(input, "5.6.7.8");
  assert.equal(created.length, 6);
});

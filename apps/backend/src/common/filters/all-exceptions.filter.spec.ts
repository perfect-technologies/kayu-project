import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException } from "@nestjs/common";
import { AllExceptionsFilter } from "./all-exceptions.filter";

function mockHost(captured: { status?: number; body?: unknown }) {
  const res = {
    status(code: number) {
      captured.status = code;
      return res;
    },
    json(payload: unknown) {
      captured.body = payload;
      return res;
    },
  };
  return {
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => ({ url: "/api/x", method: "GET" }),
    }),
  } as never;
}

test("passes through HttpException status and message", () => {
  const filter = new AllExceptionsFilter("production");
  const captured: { status?: number; body?: any } = {};
  filter.catch(new BadRequestException("bad input"), mockHost(captured));
  assert.equal(captured.status, 400);
  assert.equal(captured.body.message, "bad input");
});

test("masks unknown errors as generic 500 in production", () => {
  const filter = new AllExceptionsFilter("production");
  const captured: { status?: number; body?: any } = {};
  filter.catch(new Error("DB password is hunter2"), mockHost(captured));
  assert.equal(captured.status, 500);
  assert.equal(captured.body.message, "Internal server error");
  assert.equal(JSON.stringify(captured.body).includes("hunter2"), false);
});

test("includes the error message for unknown errors outside production", () => {
  const filter = new AllExceptionsFilter("development");
  const captured: { status?: number; body?: any } = {};
  filter.catch(new Error("explain me"), mockHost(captured));
  assert.equal(captured.status, 500);
  assert.equal(captured.body.message, "explain me");
});

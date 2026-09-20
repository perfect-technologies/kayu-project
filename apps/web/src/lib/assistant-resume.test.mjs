import assert from "node:assert/strict";
import test from "node:test";

import { isResumable, resolveConversation } from "./assistant-resume.ts";

const now = new Date("2026-09-19T08:00:00.000Z");
const HOUR = 60 * 60 * 1000;
const ago = (ms) => new Date(now.getTime() - ms).toISOString();

function item(id, lastMessageAt, full = false) {
  return { id, title: id, status: "ACTIVE", lastMessageAt, createdAt: lastMessageAt, preview: "…", full };
}

function makeApi({ items = [], resumeWindowHours = 12, details = {} } = {}) {
  const calls = [];
  return {
    calls,
    listConversations: async () => {
      calls.push("list");
      return { items, total: items.length, page: 1, limit: 20, resumeWindowHours };
    },
    createConversation: async () => {
      calls.push("create");
      return item("fresh", now.toISOString());
    },
    getConversation: async (id) => {
      calls.push(`get:${id}`);
      const detail = details[id];
      if (detail instanceof Error) throw detail;
      return { ...item(id, now.toISOString()), clientLocation: null, messages: [], ...detail };
    },
  };
}

function httpError(status) {
  return Object.assign(new Error(`HTTP ${status}`), { status });
}

test("a conversation whose last message is inside the window is resumed", async () => {
  const api = makeApi({ items: [item("yesterday-evening", ago(10 * 60 * 1000)), item("older", ago(40 * HOUR))] });
  const resolved = await resolveConversation(api, { now });
  assert.equal(resolved.detail.id, "yesterday-evening");
  assert.equal(resolved.requestedMissing, false);
  assert.deepEqual(api.calls, ["list", "get:yesterday-evening"]);
});

test("outside the window a new conversation is created and the previous one is left alone", async () => {
  const api = makeApi({ items: [item("yesterday", ago(14 * HOUR))] });
  const resolved = await resolveConversation(api, { now });
  assert.equal(resolved.detail.id, "fresh");
  assert.deepEqual(api.calls, ["list", "create", "get:fresh"]);
});

test("the boundary: exactly the window resumes, one millisecond past it does not", () => {
  assert.equal(isResumable(item("a", ago(12 * HOUR)), 12, now), true);
  assert.equal(isResumable(item("a", ago(12 * HOUR + 1)), 12, now), false);
  assert.equal(isResumable(item("a", ago(12 * HOUR - 1)), 12, now), true);
  assert.equal(isResumable(item("a", ago(HOUR)), 1, now), true);
  assert.equal(isResumable(item("a", ago(HOUR + 1)), 1, now), false);
});

test("a window of 0 always starts fresh, even a second after the last message", async () => {
  assert.equal(isResumable(item("a", ago(1000)), 0, now), false);
  assert.equal(isResumable(item("a", now.toISOString()), 0, now), false);
  const api = makeApi({ items: [item("just-now", ago(1000))], resumeWindowHours: 0 });
  assert.equal((await resolveConversation(api, { now })).detail.id, "fresh");
});

test("a full conversation is never resumed, whatever its age", async () => {
  assert.equal(isResumable(item("a", ago(1000), true), 12, now), false);
  const api = makeApi({ items: [item("full", ago(1000), true)] });
  assert.equal((await resolveConversation(api, { now })).detail.id, "fresh");
});

test("no conversation at all creates one; dates may arrive as Date objects", async () => {
  assert.equal(isResumable(undefined, 12, now), false);
  assert.equal(isResumable({ lastMessageAt: new Date(now.getTime() - HOUR), full: false }, 12, now), true);
  const api = makeApi();
  assert.equal((await resolveConversation(api, { now })).detail.id, "fresh");
});

test("a deep link opens that conversation without reading the list, archived or stale alike", async () => {
  const api = makeApi({ items: [item("recent", ago(1000))], details: { old: { status: "ARCHIVED" } } });
  const resolved = await resolveConversation(api, { requestedId: "old", now });
  assert.equal(resolved.detail.id, "old");
  assert.equal(resolved.detail.status, "ARCHIVED");
  assert.equal(resolved.requestedMissing, false);
  assert.deepEqual(api.calls, ["get:old"]);
});

test("a foreign or unknown deep link falls back to the normal resolution and says so", async () => {
  for (const status of [403, 404]) {
    const api = makeApi({ items: [item("recent", ago(1000))], details: { stolen: httpError(status) } });
    const resolved = await resolveConversation(api, { requestedId: "stolen", now });
    assert.equal(resolved.detail.id, "recent");
    assert.equal(resolved.requestedMissing, true);
    assert.deepEqual(api.calls, ["get:stolen", "list", "get:recent"]);
  }
});

test("a backend failure on a deep link is not mistaken for a missing conversation", async () => {
  const api = makeApi({ details: { c1: httpError(500) } });
  await assert.rejects(resolveConversation(api, { requestedId: "c1", now }), /HTTP 500/);
  assert.deepEqual(api.calls, ["get:c1"]);
});

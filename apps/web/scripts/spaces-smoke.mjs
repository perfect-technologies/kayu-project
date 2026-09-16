#!/usr/bin/env node
// Browser smoke for the signed-in spaces (workstream 07), handed to workstream 10.
//   PW_CHANNEL=chrome node scripts/spaces-smoke.mjs [--shots dir] [--only render,redirect,…]   (REDUCED=1 emulates reduced motion)
// Needs the dev servers on :3000 / :3001, the seeded demo accounts (Password123!) and, for the
// account-deletion check, SUPABASE_SERVICE_KEY in apps/backend/.env (it creates and removes a throwaway phone user).
import { mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
const env = Object.fromEntries(readFileSync(new URL("../.env", import.meta.url)).toString().split("\n").filter(l => l.includes("=")).map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
async function token(email, password = "Password123!") {
  const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  const j = await r.json();
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j)}`);
  return j;
}
const supabaseRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];

const BASE = "http://localhost:3000";
const API = "http://localhost:3001/api";
const args = process.argv.slice(2);
const shots = args.includes("--shots") ? args[args.indexOf("--shots") + 1] : null;
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
const ACCOUNTS = { client: "paul.kabasele@email.cd", provider: "jeanpierre.mukendi@kayou.cd", admin: "admin@kayou.cd" };

const results = [];
function log(ok, name, detail = "") {
  results.push({ ok, name, detail });
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}
async function check(name, fn) {
  if (only && !only.some((o) => name.includes(o))) return;
  try {
    const detail = await fn();
    log(true, name, typeof detail === "string" ? detail : "");
  } catch (error) {
    log(false, name, String(error?.message ?? error).split("\n")[0].slice(0, 300));
  }
}

function sessionCookie(session) {
  const slim = { access_token: session.access_token, refresh_token: session.refresh_token, expires_at: session.expires_at, expires_in: session.expires_in, token_type: session.token_type, user: { id: session.user.id, aud: session.user.aud, role: session.user.role, email: session.user.email, phone: session.user.phone } };
  const value = "base64-" + Buffer.from(JSON.stringify(slim)).toString("base64url");
  return { name: `sb-${supabaseRef}-auth-token`, value, domain: "localhost", path: "/", httpOnly: false, secure: false, sameSite: "Lax" };
}

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
const sessions = {};
for (const [role, email] of Object.entries(ACCOUNTS)) sessions[role] = await token(email);

async function newPage(role, width = 390, extra = {}) {
  const context = await browser.newContext({ viewport: { width, height: width < 640 ? 844 : 900 }, isMobile: width < 640, hasTouch: width < 640, deviceScaleFactor: 1, reducedMotion: process.env.REDUCED ? "reduce" : "no-preference", ...extra });
  if (role) await context.addCookies([sessionCookie(sessions[role])]);
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log(`   pageerror [${role}] ${e.message.slice(0, 120)}`));
  return { context, page };
}
async function overflow(page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
  if (scrollWidth > innerWidth) throw new Error(`overflow scrollWidth ${scrollWidth} > ${innerWidth}`);
}
async function shot(page, name) {
  if (!shots) return;
  await mkdir(shots, { recursive: true });
  await page.screenshot({ path: path.join(shots, `${name}.png`), fullPage: true });
}
async function settled(page, url) {
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
}
async function api(role, method, p, body) {
  const r = await fetch(API + p, { method, headers: { authorization: `Bearer ${sessions[role].access_token}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}

// ---------- 1. Route matrix: render + overflow + screenshots ----------
const ROUTES = {
  client: ["/mes-reservations", "/avis", "/adresses", "/notifications", "/aide", "/compte", "/messagerie"],
  provider: ["/mon-espace", "/revenus", "/notifications", "/aide", "/compte", "/messagerie"],
};
for (const [role, urls] of Object.entries(ROUTES)) {
  for (const width of [320, 390, 1440]) {
    const { context, page } = await newPage(role, width);
    for (const url of urls) {
      await check(`render ${role} ${url} @${width}`, async () => {
        await settled(page, url);
        if (!page.url().startsWith(BASE + url)) throw new Error(`landed on ${page.url()}`);
        const h1 = await page.locator("h1").first().textContent();
        await overflow(page);
        await shot(page, `${url.slice(1).replace(/[^a-z-]/g, "-")}-${role}-${width}`);
        return `h1="${(h1 ?? "").trim().slice(0, 40)}"`;
      });
    }
    await context.close();
  }
}
// booking detail for both sides
for (const role of ["client", "provider"]) {
  const list = await api(role, "GET", "/bookings?limit=5");
  const id = list.body?.items?.[0]?.id;
  for (const width of [320, 390, 1440]) {
    const { context, page } = await newPage(role, width);
    await check(`render ${role} /reservation/[id] @${width}`, async () => {
      await settled(page, `/reservation/${id}`);
      await overflow(page);
      await shot(page, `reservation-${role}-${width}`);
      const pill = await page.locator(".status-pill").first().textContent();
      return `status="${pill?.trim()}"`;
    });
    await context.close();
  }
}
// messaging thread for the provider (has one conversation)
{
  const convs = await api("provider", "GET", "/conversations");
  const cid = convs.body?.items?.[0]?.id;
  for (const width of [320, 390, 1440]) {
    const { context, page } = await newPage("provider", width);
    await check(`render provider /messagerie?c= @${width}`, async () => {
      await settled(page, `/messagerie?c=${cid}`);
      await overflow(page);
      await shot(page, `messagerie-thread-provider-${width}`);
      const dock = await page.evaluate(() => document.body.dataset.dock ?? "");
      if (width < 1024 && dock !== "hidden") throw new Error(`dock attribute "${dock}" on mobile thread`);
      return `dock=${dock || "visible"}`;
    });
    await context.close();
  }
}

// ---------- 2. Redirect matrix ----------
const REDIRECTS = [
  [null, "/mes-reservations", "/login?returnTo=%2Fmes-reservations"],
  [null, "/messagerie", "/login?returnTo=%2Fmessagerie"],
  [null, "/compte", "/login?returnTo=%2Fcompte"],
  ["provider", "/mes-reservations", "/mon-espace"],
  ["provider", "/avis", "/mon-espace"],
  ["provider", "/adresses", "/mon-espace"],
  ["client", "/mon-espace", "/mes-reservations"],
  ["client", "/revenus", "/mes-reservations"],
  ["admin", "/mes-reservations", "/admin"],
  ["admin", "/adresses", "/admin"],
  ["admin", "/avis", "/admin"],
];
for (const [role, from, to] of REDIRECTS) {
  const { context, page } = await newPage(role, 390);
  await check(`redirect ${role ?? "anonymous"} ${from} → ${to}`, async () => {
    await page.goto(BASE + from);
    await page.waitForURL((u) => u.pathname + u.search === to, { timeout: 15000 });
  });
  await context.close();
}
for (const [from, to] of [["/bookings", "/mes-reservations"], ["/bookings/abc", "/reservation/abc"], ["/messages", "/messagerie"], ["/pro", "/mon-espace"], ["/pro/earnings", "/revenus"], ["/dashboard/settings", "/compte"], ["/dashboard/client", "/mes-reservations"]]) {
  await check(`308 ${from} → ${to}`, async () => {
    const r = await fetch(BASE + from, { redirect: "manual" });
    const loc = r.headers.get("location");
    if (r.status !== 308 || !loc?.endsWith(to)) throw new Error(`${r.status} ${loc}`);
  });
}

// ---------- 3. Interactions ----------
await check("client /mes-reservations tabs filter", async () => {
  const { context, page } = await newPage("client", 390);
  await settled(page, "/mes-reservations");
  const all = await page.locator("article").count();
  await page.getByRole("tab", { name: /Annulées/ }).click();
  await page.waitForTimeout(500);
  const cancelled = await page.locator("article").count();
  const pills = await page.locator("article .status-pill").allTextContents();
  await context.close();
  if (!pills.every((p) => p.trim() === "Annulée")) throw new Error(`pills ${pills}`);
  return `all=${all} cancelled=${cancelled}`;
});

await check("client /notifications mark read clears dot", async () => {
  const { context, page } = await newPage("client", 390);
  await settled(page, "/notifications");
  const before = (await api("client", "GET", "/notifications?limit=1")).body.unreadCount;
  const unreadRow = page.locator("li a.bg-primary\\/5").first();
  if ((await unreadRow.count()) === 0) return `no unread rows (unreadCount=${before})`;
  const href = await unreadRow.getAttribute("href");
  await unreadRow.click();
  await page.waitForTimeout(1200);
  const after = (await api("client", "GET", "/notifications?limit=1")).body.unreadCount;
  await context.close();
  if (after !== before - 1) throw new Error(`unread ${before} → ${after}`);
  return `href=${href} unread ${before}→${after}`;
});

await check("provider /mon-espace availability toggle round-trip", async () => {
  const { context, page } = await newPage("provider", 390);
  await settled(page, "/mon-espace");
  const btn = page.getByRole("button", { name: /Passer (indisponible|disponible)/ });
  const label1 = await btn.textContent();
  await btn.click();
  await page.waitForTimeout(1200);
  const d1 = (await api("provider", "GET", "/dashboard/provider")).body.provider.isAvailable;
  await page.getByRole("button", { name: /Passer (indisponible|disponible)/ }).click();
  await page.waitForTimeout(1200);
  const d2 = (await api("provider", "GET", "/dashboard/provider")).body.provider.isAvailable;
  await context.close();
  if (d1 === d2) throw new Error(`api isAvailable did not flip (${d1}, ${d2})`);
  return `${label1?.trim()} → api ${d1} → ${d2}`;
});

await check("provider /revenus shows real transactions", async () => {
  const { context, page } = await newPage("provider", 390);
  await settled(page, "/revenus");
  const summary = (await api("provider", "GET", "/pro/earnings/summary")).body;
  const text = await page.locator("main").textContent();
  const total = new Intl.NumberFormat("fr-CD").format(summary.total);
  await context.close();
  if (!text.includes(total)) throw new Error(`total ${total} not in page`);
  const links = await page.locator("a[href^='/reservation/']").count().catch(() => 0);
  return `total=${total} FC`;
});

await check("client /compte profile save round-trip", async () => {
  const { context, page } = await newPage("client", 390);
  await settled(page, "/compte");
  const bio = page.getByLabel("Bio");
  const original = await bio.inputValue();
  const marker = `Smoke ${Date.now()}`;
  await bio.fill(marker);
  await page.getByRole("button", { name: "Enregistrer" }).first().click();
  await page.waitForTimeout(1500);
  const me = (await api("client", "GET", "/me")).body.user;
  await bio.fill(original);
  await page.getByRole("button", { name: "Enregistrer" }).first().click();
  await page.waitForTimeout(1500);
  const me2 = (await api("client", "GET", "/me")).body.user;
  await context.close();
  if (me.bio !== marker) throw new Error(`bio after save = ${me.bio}`);
  if ((me2.bio ?? "") !== (original ?? "")) throw new Error(`bio not restored: ${me2.bio}`);
  return "saved and restored";
});

await check("client /adresses create then delete", async () => {
  const { context, page } = await newPage("client", 390);
  await settled(page, "/adresses");
  const before = (await api("client", "GET", "/addresses")).body.total;
  await page.getByRole("button", { name: "Ajouter une adresse" }).first().click();
  await page.waitForTimeout(500);
  await page.getByLabel(/Destinataire/).fill("Smoke test");
  await page.getByLabel(/^Adresse/).first().fill("12 avenue de la Smoke");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.waitForTimeout(1500);
  const mid = (await api("client", "GET", "/addresses")).body;
  const created = mid.items.find((a) => a.recipient === "Smoke test");
  if (!created) throw new Error(`address not created (total ${mid.total})`);
  const row = page.locator("li, article, div").filter({ hasText: "Smoke test" }).last();
  await page.getByRole("button", { name: "Supprimer" }).last().click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Supprimer" }).last().click();
  await page.waitForTimeout(1500);
  const after = (await api("client", "GET", "/addresses")).body.total;
  await context.close();
  if (after !== before) { await api("client", "DELETE", `/addresses/${created.id}`); throw new Error(`total ${before} → ${mid.total} → ${after}`); }
  return `total ${before} → ${mid.total} → ${after}`;
});

await check("provider /messagerie send + delete + poll 15s", async () => {
  const convs = await api("provider", "GET", "/conversations");
  const cid = convs.body.items[0].id;
  const { context, page } = await newPage("provider", 1440);
  const polls = [];
  page.on("request", (r) => { if (r.url().includes(`/api/conversations/${cid}/messages`)) polls.push(Date.now()); });
  await settled(page, `/messagerie?c=${cid}`);
  const marker = `Smoke ${Date.now()}`;
  await page.getByLabel("Votre message").fill(marker);
  await page.getByRole("button", { name: "Envoyer" }).click();
  await page.waitForTimeout(1500);
  const msgs = (await api("provider", "GET", `/conversations/${cid}/messages`)).body.items;
  const sent = msgs.find((m) => m.body === marker);
  if (!sent) throw new Error("message not persisted");
  const t0 = polls.length;
  await page.waitForTimeout(16500);
  const t1 = polls.length;
  // delete own message
  const bubble = page.locator("[data-message-id='" + sent.id + "']").first();
  await bubble.hover();
  await bubble.getByRole("button", { name: "Supprimer" }).click();
  await page.waitForTimeout(400);
  await page.getByRole("dialog").getByRole("button", { name: "Supprimer", exact: true }).click();
  await page.waitForTimeout(1500);
  const after = (await api("provider", "GET", `/conversations/${cid}/messages`)).body.items.find((m) => m.id === sent.id);
  await context.close();
  if (!after || after.body !== null) throw new Error(`message not deleted: ${JSON.stringify(after).slice(0, 80)}`);
  if (t1 - t0 < 1) throw new Error(`no poll within 16.5 s (${t0} → ${t1})`);
  return `sent, polled ${t1 - t0}x in 16.5 s, deleted`;
});

await check("attachments sign (private bucket)", async () => {
  const r = await api("provider", "POST", "/me/uploads/sign", { purpose: "attachments", fileName: "a.webp", mimeType: "image/webp", bytes: 1000 });
  if (r.status !== 200) throw new Error(`${r.status} ${JSON.stringify(r.body).slice(0, 120)}`);
  return `bucket ${r.body.bucket}`;
});

await check("admin DELETE /me → 409 ADMIN_ACCOUNT", async () => {
  const r = await api("admin", "DELETE", "/me");
  if (r.status !== 409 || r.body?.code !== "ADMIN_ACCOUNT") throw new Error(`${r.status} ${JSON.stringify(r.body)}`);
});

// account deletion end to end with a throwaway phone user created through the service key
await check("throwaway user: /compte delete account end to end", async () => {
  const env = Object.fromEntries(readFileSync(new URL("../../backend/.env", import.meta.url)).toString().split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
  const phone = `+24399${String(Date.now()).slice(-7)}`;
  const password = `Smoke-${Date.now()}!x`;
  const h = { apikey: env.SUPABASE_SERVICE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, "content-type": "application/json" };
  const created = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, { method: "POST", headers: h, body: JSON.stringify({ phone, phone_confirm: true, password }) }).then((r) => r.json());
  if (!created.id) throw new Error(`createUser: ${JSON.stringify(created).slice(0, 120)}`);
  try {
    const s = await token(undefined, password).catch(() => null);
    const grant = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: env.SUPABASE_SERVICE_KEY, "content-type": "application/json" }, body: JSON.stringify({ phone, password }) }).then((r) => r.json());
    if (!grant.access_token) throw new Error(`grant: ${JSON.stringify(grant).slice(0, 120)}`);
    sessions.tmp = grant;
    const me = await api("tmp", "GET", "/me");
    if (me.status !== 200) throw new Error(`/me ${me.status}`);
    await api("tmp", "POST", "/me/accept-terms");
    await api("tmp", "PATCH", "/me/profile", { firstName: "Smoke", lastName: "Test" });
    const { context, page } = await newPage("tmp", 390);
    await settled(page, "/compte");
    await page.getByRole("button", { name: "Supprimer mon compte" }).click();
    await page.waitForTimeout(400);
    await page.getByLabel(/Tapez SUPPRIMER/).fill("SUPPRIMER");
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await page.waitForURL((u) => u.pathname === "/" || u.pathname === "/bienvenue", { timeout: 15000 });
    await page.waitForTimeout(800);
    const landed = new URL(page.url()).pathname;
    await context.close();
    const gone = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${created.id}`, { headers: h }).then((r) => r.status);
    return `deleted, landed on ${landed}, supabase admin GET user → ${gone}`;
  } finally {
    await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${created.id}`, { method: "DELETE", headers: h }).catch(() => undefined);
  }
});

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed${failed.length ? `; failed: ${failed.map((f) => f.name).join(", ")}` : ""}`);
process.exit(failed.length ? 1 : 0);

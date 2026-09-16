#!/usr/bin/env node
// Browser smoke for the admin console (workstream 08), handed to workstream 10.
//   PW_CHANNEL=chrome node scripts/admin-smoke.mjs [--shots dir] [--only render,redirect,…]   (REDUCED=1 emulates reduced motion)
// Needs the dev servers on :3000 / :3001 and the seeded demo accounts (Password123!). Mutations are
// limited to throwaway rows it creates itself (a level-3 service, a place) and to read-status flips.
import { mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const env = Object.fromEntries(readFileSync(new URL("../.env", import.meta.url)).toString().split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
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
const ACCOUNTS = { client: "paul.kabasele@email.cd", admin: "admin@kayou.cd" };
const TABS = ["overview", "users", "providers", "verification", "bookings", "reviews", "conversations", "contacts", "reports", "content", "categories", "references", "audit", "system"];
const LABELS = { overview: "Vue d'ensemble", users: "Communauté", providers: "Talents", verification: "Vérification", bookings: "Réservations", reviews: "Avis", conversations: "Conversations", contacts: "Contact", reports: "Modération", content: "Contenu", categories: "Catégories", references: "Listes & lieux", audit: "Journal", system: "Système" };

const results = [];
function log(ok, name, detail = "") { results.push({ ok, name, detail }); console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`); }
async function check(name, fn) {
  if (only && !only.some((o) => name.includes(o))) return;
  try { const detail = await fn(); log(true, name, typeof detail === "string" ? detail : ""); }
  catch (error) { log(false, name, String(error?.message ?? error).split("\n")[0].slice(0, 300)); }
}
function sessionCookie(session) {
  const slim = { access_token: session.access_token, refresh_token: session.refresh_token, expires_at: session.expires_at, expires_in: session.expires_in, token_type: session.token_type, user: { id: session.user.id, aud: session.user.aud, role: session.user.role, email: session.user.email, phone: session.user.phone } };
  return { name: `sb-${supabaseRef}-auth-token`, value: "base64-" + Buffer.from(JSON.stringify(slim)).toString("base64url"), domain: "localhost", path: "/", httpOnly: false, secure: false, sameSite: "Lax" };
}
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
const sessions = {};
for (const [role, email] of Object.entries(ACCOUNTS)) sessions[role] = await token(email);
async function newPage(role, width = 390) {
  const context = await browser.newContext({ viewport: { width, height: width < 640 ? 844 : 900 }, isMobile: width < 640, hasTouch: width < 640, deviceScaleFactor: 1, reducedMotion: process.env.REDUCED ? "reduce" : "no-preference" });
  if (role) await context.addCookies([sessionCookie(sessions[role])]);
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log(`   pageerror [${role}] ${e.message.slice(0, 120)}`));
  return { context, page };
}
async function overflow(page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
  if (scrollWidth > innerWidth) throw new Error(`overflow scrollWidth ${scrollWidth} > ${innerWidth}`);
}
async function shot(page, name) { if (!shots) return; await mkdir(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, `${name}.png`), fullPage: true }); }
async function settled(page, url) { await page.goto(BASE + url, { waitUntil: "networkidle" }); await page.waitForTimeout(500); }
async function api(role, method, p, body) {
  const r = await fetch(API + p, { method, headers: { authorization: `Bearer ${sessions[role].access_token}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function toastText(page) {
  const toast = page.locator("[data-sonner-toast]").last();
  await toast.waitFor({ timeout: 8000 });
  return (await toast.textContent())?.trim() ?? "";
}
async function confirmSheet(page) {
  const sheet = page.locator("[role=dialog]").last();
  await sheet.waitFor();
  await sheet.locator("button[type=submit]").click();
}

// ---------- 1. Guard and redirects ----------
await check("redirect anonymous /admin → login", async () => {
  const r = await fetch(`${BASE}/admin`, { redirect: "manual" });
  const loc = r.headers.get("location") ?? "";
  if (![302, 303, 307, 308].includes(r.status) || !loc.includes("/login")) throw new Error(`${r.status} ${loc}`);
  return `${r.status} → ${loc}`;
});
await check("redirect client /admin → /", async () => {
  const { context, page } = await newPage("client", 1440);
  await settled(page, "/admin");
  const url = new URL(page.url());
  await context.close();
  if (url.pathname !== "/") throw new Error(`landed on ${url.pathname}`);
  return url.pathname;
});
for (const [src, dest] of [["/dashboard/admin", "/admin"], ["/dashboard/admin?tab=moderation", "/admin?tab=users"], ["/dashboard/admin?tab=disputes", "/admin?tab=reports"], ["/dashboard/admin?tab=payouts", "/admin?tab=overview"], ["/dashboard/admin?tab=categories", "/admin?tab=categories"], ["/dashboard/admin/categories/abc", "/admin"]]) {
  await check(`redirect 308 ${src}`, async () => {
    const r = await fetch(BASE + src, { redirect: "manual" });
    const loc = r.headers.get("location") ?? "";
    if (r.status !== 308 || !loc.endsWith(dest)) throw new Error(`${r.status} ${loc}`);
    return `→ ${loc}`;
  });
}

// ---------- 2. Every tab at three widths ----------
for (const width of [320, 390, 1440]) {
  const { context, page } = await newPage("admin", width);
  for (const tab of TABS) {
    await check(`render admin ?tab=${tab} @${width}`, async () => {
      await settled(page, `/admin?tab=${tab}`);
      const h1 = (await page.locator("h1").first().textContent())?.trim();
      if (h1 !== "Bonjour, administrateur.") throw new Error(`h1="${h1}"`);
      const active = (await page.locator(".admin-rail a[aria-current=page]").first().textContent())?.trim();
      if (active !== LABELS[tab]) throw new Error(`active rail="${active}"`);
      await overflow(page);
      if (width !== 320) await shot(page, `admin-${tab}-${width}`);
      const h2 = (await page.locator(".admin-canvas h2").first().textContent())?.trim().slice(0, 30);
      return `h2="${h2}"`;
    });
  }
  await context.close();
}

// ---------- 3. Users: search, self locks, member sheet, print ----------
{
  const { context, page } = await newPage("admin", 1440);
  await check("users search filters rows", async () => {
    await settled(page, "/admin?tab=users");
    await page.locator("input[type=search]").fill("paul");
    await page.waitForTimeout(700);
    await page.waitForLoadState("networkidle");
    if (!page.url().includes("q=paul")) throw new Error(`url ${page.url()}`);
    const rows = await page.locator("table tbody tr").count();
    const first = await page.locator("table tbody tr").first().textContent();
    if (rows < 1 || !/paul/i.test(first ?? "")) throw new Error(`rows=${rows} first="${first?.slice(0, 40)}"`);
    return `rows=${rows}`;
  });
  await check("users self row locks role and suspend", async () => {
    await settled(page, "/admin?tab=users&q=admin");
    const row = page.locator("table tbody tr", { hasText: "(vous)" }).first();
    await row.waitFor();
    const disabled = await row.locator("button:disabled").count();
    if (disabled < 2) throw new Error(`disabled buttons=${disabled}`);
    return `disabled=${disabled}`;
  });
  await check("users API self patch → 400 SELF_ACTION", async () => {
    const me = await api("admin", "GET", "/me");
    const r = await api("admin", "PATCH", `/admin/users/${me.body.user.id}`, { role: "CLIENT" });
    if (r.status !== 400 || r.body?.code !== "SELF_ACTION") throw new Error(`${r.status} ${JSON.stringify(r.body).slice(0, 80)}`);
    return r.body.code;
  });
  await check("users API demote last admin → 409 LAST_ADMIN or SELF_ACTION", async () => {
    const admins = await api("admin", "GET", "/admin/users?role=ADMIN&limit=5");
    const me = await api("admin", "GET", "/me");
    const other = admins.body.items.find((u) => u.id !== me.body.user.id);
    if (!other) return `single admin (self guard covers it) · total=${admins.body.total}`;
    const r = await api("admin", "PATCH", `/admin/users/${other.id}`, { role: "CLIENT" });
    if (r.status === 200) { await api("admin", "PATCH", `/admin/users/${other.id}`, { role: "ADMIN" }); return "demoted and restored a second admin"; }
    if (r.body?.code !== "LAST_ADMIN") throw new Error(`${r.status} ${r.body?.code}`);
    return r.body.code;
  });
  await check("users member sheet opens and prints", async () => {
    await settled(page, "/admin?tab=users&q=paul");
    await page.locator("table tbody tr").first().getByRole("button", { name: "Voir" }).click();
    const sheet = page.locator("#member-sheet");
    await sheet.waitFor({ timeout: 10000 });
    if (!page.url().includes("id=")) throw new Error(`url ${page.url()}`);
    const name = await sheet.locator("h2").first().textContent();
    await shot(page, "admin-users-sheet-1440");
    await page.emulateMedia({ media: "print" });
    const nav = await page.locator("header").first().evaluate((el) => getComputedStyle(el).visibility);
    const visible = await sheet.evaluate((el) => getComputedStyle(el).visibility);
    await page.emulateMedia({ media: "screen" });
    if (nav !== "hidden" || visible !== "visible") throw new Error(`print nav=${nav} sheet=${visible}`);
    return `name="${name?.trim()}" print ok`;
  });
  await context.close();
}

// ---------- 4. Providers: DOCS_MISSING surfaced ----------
{
  const { context, page } = await newPage("admin", 1440);
  await check("providers verify without docs shows the API message", async () => {
    const list = await api("admin", "GET", "/admin/providers?verificationStatus=PENDING&limit=5");
    const target = list.body.items[0];
    if (!target) return "no PENDING provider seeded";
    await settled(page, `/admin?tab=providers&q=${encodeURIComponent(target.displayName)}`);
    await page.getByRole("button", { name: "Vérifier", exact: true }).first().click();
    await confirmSheet(page);
    const text = await page.locator("[role=dialog] [role=alert], [data-sonner-toast]").last().textContent({ timeout: 8000 });
    if (!/document/i.test(text ?? "")) throw new Error(`message="${text}"`);
    return text?.slice(0, 80);
  });
  await context.close();
}

// ---------- 5. Categories: create level-3, delete it, refuse a referenced node ----------
{
  const { context, page } = await newPage("admin", 1440);
  const name = `Smoke service ${Date.now().toString(36)}`;
  await check("categories create then delete a level-3 service", async () => {
    await settled(page, "/admin?tab=categories");
    const columns = page.locator(".admin-canvas section > .grid > div");
    await columns.nth(0).locator("ul button").first().click();
    await columns.nth(1).locator("ul button").first().click();
    await page.getByRole("button", { name: "Nouveau service" }).click();
    const sheet = page.locator("[role=dialog]").last();
    await sheet.getByLabel(/^Nom/).fill(name);
    const slug = await sheet.getByLabel(/^Slug/).inputValue();
    if (!slug.startsWith("smoke-service")) throw new Error(`slug=${slug}`);
    await sheet.locator("button[type=submit]").click();
    const created = await toastText(page);
    const row = columns.nth(2).locator("li", { hasText: name });
    await row.waitFor({ timeout: 8000 });
    await row.getByRole("button", { name: "Supprimer" }).click();
    await confirmSheet(page);
    await row.waitFor({ state: "detached", timeout: 8000 });
    const deleted = (await page.locator("[data-sonner-toast]").allTextContents()).join(" | ");
    return `${created} / ${deleted.slice(0, 60)}`;
  });
  await check("categories referenced node delete → counts in toast", async () => {
    await settled(page, "/admin?tab=categories");
    const columns = page.locator(".admin-canvas section > .grid > div");
    await columns.nth(0).locator("ul button").first().click();
    await columns.nth(0).getByRole("button", { name: "Supprimer" }).click();
    await confirmSheet(page);
    const text = await page.locator("[role=dialog] [role=alert]").last().textContent({ timeout: 8000 });
    if (!/Références/.test(text ?? "")) throw new Error(`message="${text}"`);
    return text?.slice(0, 100);
  });
  await context.close();
}

// ---------- 6. Places: merge a throwaway place through the UI ----------
{
  const { context, page } = await newPage("admin", 1440);
  await check("places merge repoints and hides the source", async () => {
    const gombe = (await api("admin", "GET", "/admin/places?q=Gombe&kind=COMMUNE&limit=5")).body.items[0];
    if (!gombe) return "no Gombe commune seeded";
    const label = `Smoke Q ${Date.now().toString(36)}`;
    const created = await api("admin", "POST", "/admin/places", { kind: "QUARTIER", label, parentId: gombe.id });
    if (created.status !== 201) throw new Error(`create ${created.status} ${JSON.stringify(created.body).slice(0, 80)}`);
    const siblings = (await api("admin", "GET", `/admin/places?kind=QUARTIER&parentId=${gombe.id}&active=true&limit=100`)).body.items.filter((p) => p.id !== created.body.id);
    if (siblings.length === 0) throw new Error("no sibling quartier to merge into");
    await settled(page, `/admin?tab=references&sub=places&q=${encodeURIComponent(label)}`);
    const row = page.locator("li").filter({ hasText: label }).first();
    await row.waitFor({ timeout: 10000 });
    await row.getByRole("button", { name: "Fusionner" }).click();
    const select = page.getByLabel("Dans", { exact: true });
    await select.waitFor({ timeout: 10000 });
    const options = await select.locator("option").evaluateAll((els) => els.map((o) => o.value));
    if (!options.includes(siblings[0].id)) throw new Error(`candidates=${options.length} (${options.slice(0, 3).join(",")})`);
    await select.selectOption(siblings[0].id);
    await page.locator("section", { hasText: "Fusionner deux lieux" }).last().getByRole("button", { name: "Fusionner", exact: true }).click();
    await confirmSheet(page);
    const text = await toastText(page);
    const pub = await fetch(`${API}/places?parentId=${gombe.id}&limit=100`).then((r) => r.json());
    if (pub.items.some((p) => p.id === created.body.id)) throw new Error("public picker still lists the source");
    const leftovers = (await api("admin", "GET", `/admin/places?q=Smoke%20Q&limit=100`)).body.items.filter((p) => p.active && !p.mergedIntoId);
    for (const leftover of leftovers) await api("admin", "PATCH", `/admin/places/${leftover.id}`, { active: false });
    return `${text.slice(0, 60)} · cleaned ${leftovers.length}`;
  });
  await check("places merge with children refused (API)", async () => {
    const kin = (await api("admin", "GET", "/admin/places?kind=CITY&q=Kinshasa&limit=5")).body.items.find((p) => p.hasChildren);
    const other = (await api("admin", "GET", "/admin/places?kind=CITY&limit=100")).body.items.find((p) => p.id !== kin?.id && p.parentId === kin?.parentId);
    if (!kin || !other) return "no two sibling cities";
    const r = await api("admin", "POST", "/admin/places/merge", { fromId: kin.id, intoId: other.id });
    if (r.status !== 409) throw new Error(`${r.status} ${r.body?.code}`);
    return `${r.body.code}: ${r.body.message}`;
  });
  await context.close();
}

// ---------- 7. Contacts read flip, journal, system ----------
{
  const { context, page } = await newPage("admin", 1440);
  await check("contacts opening a NEW message marks it READ", async () => {
    const list = await api("admin", "GET", "/admin/contacts?status=NEW&limit=1");
    const item = list.body.items[0];
    if (!item) return "no NEW contact seeded";
    await settled(page, `/admin?tab=contacts&id=${item.id}`);
    await page.waitForTimeout(800);
    const after = await api("admin", "GET", `/admin/contacts?q=${encodeURIComponent(item.email)}&limit=5`);
    const row = after.body.items.find((c) => c.id === item.id);
    if (row?.status !== "READ") throw new Error(`status=${row?.status}`);
    await api("admin", "PATCH", `/admin/contacts/${item.id}`, { status: "NEW" });
    return "NEW → READ (restored)";
  });
  await check("audit journal lists the smoke mutations", async () => {
    const audit = await api("admin", "GET", "/admin/audit");
    const actions = audit.body.items.slice(0, 20).map((i) => i.action);
    await settled(page, "/admin?tab=audit");
    const first = await page.locator("table tbody tr").first().textContent();
    if (!actions.some((a) => /place|subcategory|contact/i.test(a))) throw new Error(`recent=${actions.slice(0, 5).join(",")}`);
    return `first row "${first?.trim().slice(0, 50)}"`;
  });
  await check("system cards report the API health", async () => {
    await settled(page, "/admin?tab=system");
    const text = await page.locator(".admin-canvas").textContent();
    if (!/Opérationnel/.test(text ?? "")) throw new Error("no Opérationnel");
    return "database/storage ok";
  });
  await check("verification queue opens a submission", async () => {
    await settled(page, "/admin?tab=verification");
    const first = page.locator(".admin-canvas ul li button").first();
    if ((await first.count()) === 0) return "queue empty";
    await first.click();
    await page.waitForTimeout(600);
    const docs = await page.locator(".admin-canvas h4 + ul li").count();
    if (!page.url().includes("id=")) throw new Error(`url ${page.url()}`);
    return `docs=${docs}`;
  });
  await context.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);

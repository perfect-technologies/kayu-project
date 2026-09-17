import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type APIRequestContext, type BrowserContext, type Locator, type Page, test } from "@playwright/test";

export const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
export const API = process.env.E2E_API_URL ?? `${BASE}/api`;
export const SHOTS_DIR = process.env.E2E_SHOTS_DIR ?? "";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.resolve(HERE, "../test-results/e2e-state.json");

export const ACCOUNTS = {
  client: "paul.kabasele@email.cd",
  provider: "marieclaire.nzuzi@kayou.cd",
  blockedProvider: "patrick.mbuyi@kayou.cd",
  reportedProvider: "francoise.kabongo@kayou.cd",
  suspendedProvider: "roger.ilunga@kayou.cd",
  admin: "admin@kayou.cd",
} as const;

export type Session = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in: number;
  token_type: string;
  user: { id: string; email?: string; phone?: string };
};

function readWebEnv(): Record<string, string> {
  const file = path.resolve(HERE, "../.env");
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split("\n")
      .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^"|"$/g, "")];
      }),
  );
}

export function supabaseRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? readWebEnv().NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is required to name the auth cookie");
  return new URL(url).hostname.split(".")[0]!;
}

export async function testSession(request: APIRequestContext, who: { email: string } | { phone: string }): Promise<Session> {
  const response = await request.post(`${API}/test/session`, { data: who });
  if (!response.ok()) throw new Error(`POST /test/session ${response.status()} ${await response.text()}`);
  return (await response.json()) as Session;
}

export function sessionCookie(session: Session) {
  const slim = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: { id: session.user.id, aud: "authenticated", role: "authenticated", email: session.user.email, phone: session.user.phone },
  };
  const url = new URL(BASE);
  return {
    name: `sb-${supabaseRef()}-auth-token`,
    value: "base64-" + Buffer.from(JSON.stringify(slim)).toString("base64url"),
    domain: url.hostname,
    path: "/",
    httpOnly: false,
    secure: url.protocol === "https:",
    sameSite: "Lax" as const,
  };
}

export async function signIn(context: BrowserContext, session: Session) {
  await context.addCookies([sessionCookie(session)]);
}

export async function api<T = any>(
  request: APIRequestContext,
  session: Session | null,
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  route: string,
  data?: unknown,
): Promise<{ status: number; body: T }> {
  const response = await request.fetch(`${API}${route}`, {
    method,
    headers: session ? { authorization: `Bearer ${session.access_token}` } : {},
    data,
  });
  const text = await response.text();
  let body: T;
  try {
    body = JSON.parse(text) as T;
  } catch {
    body = text as unknown as T;
  }
  return { status: response.status(), body };
}

export async function markOnboarded(context: BrowserContext) {
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem("kayou_onboarded", "1");
    } catch {}
  });
}

export async function settle(page: Page, route: string) {
  await page.goto(route, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
}

// Mobile emulation widens innerWidth to fit overflowing content, so compare with the requested width.
export async function expectNoOverflow(page: Page) {
  const width = test.info().project.use.viewport!.width;
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth, `scrollWidth ${scrollWidth} > viewport ${width} on ${page.url()}`).toBeLessThanOrEqual(width);
}

export async function shot(page: Page, name: string) {
  if (!SHOTS_DIR) return;
  mkdirSync(SHOTS_DIR, { recursive: true });
  const width = test.info().project.use.viewport!.width;
  const suffix = test.info().project.name === "reduced-motion" ? "reduced" : String(width);
  await page.screenshot({ path: path.join(SHOTS_DIR, `${name}-${suffix}.png`), fullPage: true });
}

export function readState(): Record<string, string> {
  if (!existsSync(STATE_FILE)) return {};
  return JSON.parse(readFileSync(STATE_FILE, "utf8")) as Record<string, string>;
}

export function writeState(patch: Record<string, string>) {
  mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify({ ...readState(), ...patch }, null, 2));
}

export function pngFixture(): { name: string; mimeType: string; buffer: Buffer } {
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAGElEQVR4nGP8z8BQz0AEYCJG0aiCkaMAAJ7+AQ8xoXdMAAAAAElFTkSuQmCC";
  return { name: "e2e.png", mimeType: "image/png", buffer: Buffer.from(base64, "base64") };
}

export function nextWeekday(daysAhead = 7): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export async function toast(page: Page, text: string | RegExp) {
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: text }).last()).toBeVisible();
}

// Infinite decorative animations and sheet springs can keep an element "unstable" for the
// pointer; after a bounded real click attempt, fall back to a DOM click event.
export async function tap(locator: Locator, timeout = 10_000) {
  await expect(locator).toBeVisible();
  await locator.click({ timeout }).catch(() => locator.dispatchEvent("click"));
}

export async function confirmDialog(page: Page, label: string | RegExp) {
  const dialog = page.getByRole("dialog").last();
  await expect(dialog).toBeVisible();
  await tap(dialog.getByRole("button", { name: label }).last());
}

export { expect, test };

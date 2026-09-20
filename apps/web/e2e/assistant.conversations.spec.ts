import { execSync } from "node:child_process";
import { ACCOUNTS, api, expect, expectNoOverflow, markOnboarded, settle, shot, signIn, tap, test, testSession, type Session } from "./fixtures";

// Phase 3 screenshots for docs/ai-agents/screenshots/03. The lifecycle runs on a client who never used the
// assistant, so the empty state is reachable; two model turns are real, everything else is list and lifecycle.
const FRESH_CLIENT = process.env.E2E_FRESH_CLIENT ?? "francine.kiese@email.cd";
const TURN_TIMEOUT = 150_000;
const PSQL = process.env.E2E_PSQL ?? "psql -h localhost -p 5433 -U postgres -d kayu_agent01 -Atc";
const sql = (query: string) => execSync(`${PSQL} ${JSON.stringify(query)}`, { encoding: "utf8" }).trim();

type Page = import("@playwright/test").Page;
type Summary = { id: string; title: string | null; status: string; preview: string | null };
type List = { items: Summary[]; total: number };

test.describe.configure({ mode: "serial" });
test.setTimeout(600_000);

// The same list is a persistent sidebar from `lg` and a left drawer below it.
const isDesktop = (page: Page) => page.viewportSize()!.width >= 1024;
const sheet = (page: Page) =>
  isDesktop(page) ? page.getByRole("complementary", { name: "Mes conversations" }) : page.getByRole("dialog", { name: "Mes conversations" });
const trigger = (page: Page) => page.getByRole("button", { name: "Conversations", exact: true });
const headerTitle = (page: Page) => page.locator("[data-conversation-title]");
const newPill = (page: Page) => page.getByRole("button", { name: "Nouvelle conversation", exact: true }).first();
const composerInput = (page: Page) => page.getByRole("textbox", { name: "Votre demande" });
const activeRows = (page: Page) => sheet(page).getByRole("region", { name: "Actives" }).getByRole("listitem");
const archivedRows = (page: Page) => sheet(page).getByRole("region", { name: "Archivées" }).getByRole("listitem");
const menuItem = (page: Page, name: string) => page.getByRole("menuitem", { name, exact: true });
const conversationParam = (page: Page) => new URL(page.url()).searchParams.get("c");

async function send(page: Page, text: string) {
  await expect(composerInput(page)).toBeEnabled({ timeout: TURN_TIMEOUT });
  await composerInput(page).fill(text);
  await tap(page.locator("form").filter({ has: composerInput(page) }).getByRole("button", { name: "Envoyer" }));
  await expect(page.getByRole("status", { name: /cherche/ })).toBeHidden({ timeout: TURN_TIMEOUT });
  await expect(composerInput(page)).toBeEnabled({ timeout: TURN_TIMEOUT });
}

async function openSheet(page: Page) {
  if (!isDesktop(page)) await tap(trigger(page));
  await expect(sheet(page)).toBeVisible();
  await expect(sheet(page).getByRole("status", { name: "Chargement des conversations" })).toBeHidden();
  await page.waitForTimeout(450);
}

async function rowMenu(page: Page, title: string | RegExp) {
  await tap(sheet(page).getByRole("button", { name: typeof title === "string" ? `Actions pour « ${title} »` : title }).first());
}

test.describe("assistant conversations @flows", () => {
  let session: Session;

  test.beforeAll(async ({ request }) => {
    session = await testSession(request, { email: FRESH_CLIENT });
    const { body } = await api<List>(request, session, "GET", "/assistant/conversations?status=all&limit=50");
    for (const item of body.items) await api(request, session, "DELETE", `/assistant/conversations/${item.id}`);
  });

  test.beforeEach(async ({ context }) => {
    await markOnboarded(context);
    await signIn(context, session);
  });

  test("create, resume, rename, archive, reactivate, start another, walk the history, delete", async ({ page, request }) => {
    await settle(page, "/assistant");
    await expect(page.getByRole("heading", { name: /De quoi avez-vous besoin/ })).toBeVisible();
    await expect(headerTitle(page)).toContainText("Nouvelle conversation");
    await expect(newPill(page)).toBeDisabled();
    await expect(page.getByRole("button", { name: "Archiver cette conversation" })).toHaveCount(0);

    await openSheet(page);
    await expect(sheet(page).getByText("Aucune conversation pour le moment")).toBeVisible();
    await shot(page, "conversations-empty-state");
    await tap(sheet(page).getByRole("button", { name: "Écrire à l'assistant" }));
    await expect(sheet(page)).toBeHidden();
    await expect(composerInput(page)).toBeFocused();

    const firstRequest = "Un électricien à Limete pour une panne de courant";
    await send(page, firstRequest);
    await expect(headerTitle(page)).toContainText(firstRequest);
    await expect(newPill(page)).toBeEnabled();
    await expectNoOverflow(page);
    await shot(page, "conversations-header");
    const firstId = (await api<List>(request, session, "GET", "/assistant/conversations")).body.items[0]!.id;

    // Ten minutes later: the same conversation, not another one.
    await settle(page, "/assistant");
    await expect(headerTitle(page)).toContainText(firstRequest);
    expect((await api<List>(request, session, "GET", "/assistant/conversations?status=all")).body.total).toBe(1);

    // Focus trap, Escape, focus restored.
    await openSheet(page);
    const dialogHolds = () => page.evaluate(() => Boolean(document.activeElement?.closest("[role=dialog]")));
    await expect(sheet(page).getByRole("button", { name: "Fermer" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(sheet(page).getByRole("button", { name: "Archivées" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(sheet(page).getByRole("button", { name: "Fermer" })).toBeFocused();
    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press("Tab");
      expect(await dialogHolds()).toBe(true);
    }
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
    await shot(page, "conversations-drawer");
    await page.keyboard.press("Escape");
    await expect(sheet(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");

    // Rename, then clear to get the generated title back.
    await openSheet(page);
    await rowMenu(page, firstRequest);
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menuitem")).toHaveText(["Ouvrir", "Renommer", "Archiver", "Supprimer"]);
    await page.waitForTimeout(250);
    await shot(page, "conversations-row-menu");
    await tap(menuItem(page, "Renommer"));
    const field = sheet(page).getByRole("textbox", { name: "Titre de la conversation" });
    await expect(field).toHaveAttribute("maxlength", "80");
    await field.fill("Panne de courant à Limete");
    await expect(sheet(page).getByText("25/80")).toBeVisible();
    await shot(page, "conversations-rename");
    await tap(sheet(page).getByRole("button", { name: "Enregistrer" }));
    await expect(sheet(page).getByRole("button", { name: "Actions pour « Panne de courant à Limete »" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(headerTitle(page)).toContainText("Panne de courant à Limete");

    await openSheet(page);
    await rowMenu(page, "Panne de courant à Limete");
    await tap(menuItem(page, "Renommer"));
    await sheet(page).getByRole("textbox", { name: "Titre de la conversation" }).fill("");
    await tap(sheet(page).getByRole("button", { name: "Enregistrer" }));
    await expect(sheet(page).getByRole("button", { name: `Actions pour « ${firstRequest} »` })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(headerTitle(page)).toContainText(firstRequest);

    // Archive from the header: read-only, a turn is refused, the row moves to "Archivées".
    await tap(page.getByRole("button", { name: "Archiver cette conversation" }));
    await expect(page.getByText("Conversation archivée", { exact: true })).toBeVisible();
    await expect(composerInput(page)).toHaveCount(0);
    await expectNoOverflow(page);
    await shot(page, "conversations-archived-readonly");
    const refused = await api<{ code: string }>(request, session, "POST", `/assistant/conversations/${firstId}/messages`, {
      message: { id: `e2e-archived-${Date.now()}`, role: "user", parts: [{ type: "text", text: "bonjour" }] },
    });
    expect([refused.status, refused.body.code]).toEqual([409, "INVALID_TRANSITION"]);

    await openSheet(page);
    await expect(sheet(page).getByText("Aucune conversation pour le moment")).toBeVisible();
    await tap(sheet(page).getByRole("button", { name: "Archivées" }));
    await expect(sheet(page).getByRole("button", { name: `Actions pour « ${firstRequest} »` })).toBeVisible();
    await shot(page, "conversations-drawer-archived");
    await page.keyboard.press("Escape");

    // Reactivate without a reload.
    await tap(page.getByRole("button", { name: "Réactiver" }));
    await expect(composerInput(page)).toBeEnabled();
    expect((await api<Summary>(request, session, "GET", `/assistant/conversations/${firstId}`)).body.status).toBe("ACTIVE");

    // Start another one at any time; the first stays in the list.
    await tap(newPill(page));
    await expect(page.getByRole("heading", { name: /De quoi avez-vous besoin/ })).toBeVisible();
    await expect.poll(() => conversationParam(page)).not.toBeNull();
    const secondId = conversationParam(page)!;
    expect(secondId).not.toBe(firstId);
    await expect(newPill(page)).toBeDisabled();
    const secondRequest = "Ménage cette semaine à Ngaliema";
    await send(page, secondRequest);

    await openSheet(page);
    await expect(activeRows(page)).toHaveCount(2);
    await expect(activeRows(page).first()).toContainText(secondRequest);
    await expect(activeRows(page).first().getByRole("button").first()).toHaveAttribute("aria-current", "true");
    await expect(activeRows(page).nth(1).getByRole("button").first()).not.toHaveAttribute("aria-current", "true");
    await shot(page, "conversations-drawer-two");

    // Open the first from the sheet, then let the back button walk the history.
    await tap(activeRows(page).nth(1).getByRole("button").first());
    await expect(sheet(page)).toBeHidden();
    await expect.poll(() => conversationParam(page)).toBe(firstId);
    await expect(headerTitle(page)).toContainText(firstRequest);
    await expect(page.getByText(firstRequest).first()).toBeVisible();
    await page.goBack();
    await expect.poll(() => conversationParam(page)).toBe(secondId);
    await expect(headerTitle(page)).toContainText(secondRequest);
    await page.goForward();
    await expect(headerTitle(page)).toContainText(firstRequest);

    // Archive and reactivate from the list.
    await openSheet(page);
    await expect(sheet(page).getByRole("button", { name: "Archivées" })).toHaveAttribute("aria-expanded", "false");
    await expect(sheet(page).getByRole("button", { name: "Nouvelle conversation", exact: true })).toBeEnabled();
    await rowMenu(page, secondRequest);
    await tap(menuItem(page, "Archiver"));
    await expect(activeRows(page)).toHaveCount(1);
    await tap(sheet(page).getByRole("button", { name: "Archivées" }));
    await expect(archivedRows(page)).toHaveCount(1);
    await expect(archivedRows(page)).toContainText(secondRequest);
    await rowMenu(page, secondRequest);
    await tap(menuItem(page, "Réactiver"));
    await expect(activeRows(page)).toHaveCount(2);
    await expect(sheet(page).getByText("Aucune conversation archivée.")).toBeVisible();

    // Cancelling a delete keeps everything and hands the focus back to the row's menu button.
    await rowMenu(page, firstRequest);
    await tap(menuItem(page, "Supprimer"));
    await tap(page.getByRole("dialog", { name: "Supprimer cette conversation ?" }).getByRole("button", { name: "Annuler" }));
    await expect(sheet(page).getByRole("button", { name: `Actions pour « ${firstRequest} »` })).toBeFocused();

    // Delete the open conversation: the copy says what stays, the page moves on without an error.
    await rowMenu(page, firstRequest);
    await tap(menuItem(page, "Supprimer"));
    const confirm = page.getByRole("dialog", { name: "Supprimer cette conversation ?" });
    await expect(confirm).toContainText("Vos réservations et vos conversations avec les prestataires restent intactes");
    await page.waitForTimeout(450);
    await shot(page, "conversations-delete-confirm");
    await tap(confirm.getByRole("button", { name: "Supprimer" }));
    await expect(confirm).toBeHidden();
    await expect(sheet(page).getByRole("button", { name: `Actions pour « ${firstRequest} »` })).toHaveCount(0);
    expect(await dialogHolds()).toBe(true);
    await page.keyboard.press("Escape");
    await expect(sheet(page)).toBeHidden();
    await expect(headerTitle(page)).toContainText(secondRequest);
    expect((await api(request, session, "GET", `/assistant/conversations/${firstId}`)).status).toBe(404);
    expect((await api<List>(request, session, "GET", "/assistant/conversations?status=all")).body.items.map((item) => item.id)).toEqual([secondId]);
  });

  test("the morning after opens a fresh conversation with yesterday's first in the list; a window of 0 always starts fresh", async ({ page, request }) => {
    const before = (await api<List>(request, session, "GET", "/assistant/conversations")).body.items[0]!;
    sql(`update "AgentConversation" set "lastMessageAt" = now() - interval '13 hours' where id = '${before.id}'`);

    await settle(page, "/assistant");
    await expect(page.getByRole("heading", { name: /De quoi avez-vous besoin/ })).toBeVisible();
    await expect(headerTitle(page)).toContainText("Nouvelle conversation");
    await openSheet(page);
    await expect(activeRows(page).first()).toContainText(before.title!);
    await expect(activeRows(page).first()).toContainText("il y a 13 h");
    await shot(page, "conversations-morning-after");
    await page.keyboard.press("Escape");

    sql(`update "AgentConversation" set "lastMessageAt" = now() - interval '5 minutes' where id = '${before.id}'`);
    await settle(page, "/assistant");
    await expect(headerTitle(page)).toContainText(before.title!);

    sql(`update "SystemSetting" set value = '0'::jsonb where key = 'agent.resumeWindowHours'`);
    try {
      await settle(page, "/assistant");
      await expect(headerTitle(page)).toContainText("Nouvelle conversation");
      await settle(page, "/assistant");
      await expect(headerTitle(page)).toContainText("Nouvelle conversation");
    } finally {
      sql(`update "SystemSetting" set value = '12'::jsonb where key = 'agent.resumeWindowHours'`);
    }
    await settle(page, "/assistant");
    await expect(headerTitle(page)).toContainText(before.title!);
  });

  test("a conversation untouched for a day is archived on the next list read when autoArchiveDays is 1", async ({ page, request }) => {
    const target = (await api<List>(request, session, "GET", "/assistant/conversations")).body.items[0]!;
    sql(`update "AgentConversation" set "lastMessageAt" = now() - interval '25 hours', "updatedAt" = now() - interval '25 hours' where id = '${target.id}'`);
    sql(`update "SystemSetting" set value = '1'::jsonb where key = 'agent.autoArchiveDays'`);
    try {
      await settle(page, "/assistant");
      await openSheet(page);
      await expect(sheet(page).getByText("Aucune conversation pour le moment")).toBeVisible();
      await tap(sheet(page).getByRole("button", { name: "Archivées" }));
      await expect(archivedRows(page).first()).toContainText(target.title!);
    } finally {
      sql(`update "SystemSetting" set value = '30'::jsonb where key = 'agent.autoArchiveDays'`);
    }
    expect(sql(`select status from "AgentConversation" where id = '${target.id}'`)).toBe("ARCHIVED");

    // Opening it from the deep link is read-only until it is reactivated.
    await settle(page, `/assistant?c=${target.id}`);
    await expect(page.getByText("Conversation archivée", { exact: true })).toBeVisible();
    await tap(page.getByRole("button", { name: "Réactiver" }));
    await expect(composerInput(page)).toBeEnabled();
  });

  test("another client's id in ?c= falls back with a toast and returns no data", async ({ page, request }) => {
    const owner = await testSession(request, { email: ACCOUNTS.client });
    const foreign = (await api<List>(request, owner, "GET", "/assistant/conversations?limit=1")).body.items[0]!;
    const mine = (await api<List>(request, session, "GET", "/assistant/conversations")).body.items[0]!;
    // The previous test left it backdated; inside the window again, the fallback resumes it instead of starting fresh.
    sql(`update "AgentConversation" set "lastMessageAt" = now() where id = '${mine.id}'`);

    const leaked: string[] = [];
    page.on("response", async (response) => {
      if (!response.url().includes(foreign.id)) return;
      leaked.push(`${response.status()} ${response.url()}`);
    });
    await settle(page, `/assistant?c=${foreign.id}`);
    await expect(page.getByText("Cette conversation est introuvable. Voici votre conversation en cours.")).toBeVisible();
    await expect(headerTitle(page)).toContainText(mine.title!);
    expect(conversationParam(page)).toBeNull();
    await expect(page.getByText(foreign.title!)).toHaveCount(0);
    expect(await page.content()).not.toContain(foreign.title!);
    await shot(page, "conversations-deeplink-foreign");
    expect((await api(request, session, "GET", `/assistant/conversations/${foreign.id}`)).status).toBe(403);

    await settle(page, "/assistant?c=conv_that_never_existed");
    await expect(page.getByText("Cette conversation est introuvable. Voici votre conversation en cours.")).toBeVisible();
    await expect(headerTitle(page)).toContainText(mine.title!);
  });

  test("deleting a conversation that booked leaves the booking and the provider thread in place", async ({ page, request }) => {
    const owner = await testSession(request, { email: ACCOUNTS.client });
    const ownerId = sql(`select id from "User" where email = '${ACCOUNTS.client}'`);
    const row = sql(
      `select c.id || '|' || (part->'output'->>'id') from "AgentConversation" c join "AgentMessage" m on m."conversationId" = c.id, jsonb_array_elements(m.parts) part ` +
        `where c."userId" = '${ownerId}' and part->>'type' = 'tool-create_booking' and part->>'state' = 'output-available' and part->'output'->>'id' is not null limit 1`,
    );
    test.skip(!row, "no conversation of the demo client holds an executed create_booking");
    const [conversationId, bookingId] = row.split("|") as [string, string];
    const threadsBefore = sql(`select count(*) from "Conversation" where "clientId" = '${ownerId}'`);

    expect((await api(request, owner, "DELETE", `/assistant/conversations/${conversationId}`)).status).toBe(200);
    expect(sql(`select count(*) from "AgentMessage" where "conversationId" = '${conversationId}'`)).toBe("0");
    expect((await api<{ id: string }>(request, owner, "GET", `/bookings/${bookingId}`)).body.id).toBe(bookingId);
    expect(sql(`select count(*) from "Conversation" where "clientId" = '${ownerId}'`)).toBe(threadsBefore);
    expect(sql(`select count(*) from "Booking" where id = '${bookingId}'`)).toBe("1");

    await signIn(page.context(), owner);
    await settle(page, `/reservation/${bookingId}`);
    await expect(page.getByText(/introuvable/i)).toHaveCount(0);
    await shot(page, "conversations-booking-survives");
  });
});

test.describe("assistant conversation list @viewports", () => {
  test("a sidebar from lg, a left drawer below; it lists, paginates and never overflows", async ({ page, context, request }) => {
    const session = await testSession(request, { email: ACCOUNTS.client });
    await markOnboarded(context);
    await signIn(context, session);
    await settle(page, "/assistant");
    await expectNoOverflow(page);

    const viewport = page.viewportSize()!;
    if (isDesktop(page)) {
      await expect(trigger(page)).toBeHidden();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    } else {
      await expect(page.getByRole("complementary", { name: "Mes conversations" })).toBeHidden();
      await shot(page, "conversations-page");
    }

    await openSheet(page);
    await expect(activeRows(page)).toHaveCount(20);
    const firstMenuButton = activeRows(page).nth(2).getByRole("button", { name: /^Actions pour/ });
    const opacity = () => firstMenuButton.evaluate((element) => getComputedStyle(element).opacity);
    if (isDesktop(page)) {
      await page.mouse.move(viewport.width - 10, viewport.height - 10);
      await expect.poll(opacity).toBe("0");
      await activeRows(page).nth(2).hover();
      await expect.poll(opacity).toBe("1");
      await shot(page, "conversations-list-hover");
      await page.mouse.move(viewport.width - 10, viewport.height - 10);
    } else {
      await expect.poll(opacity).toBe("1");
    }
    await expect(sheet(page).locator("[aria-current=true]")).toHaveCount(1);
    await expectNoOverflow(page);
    await shot(page, "conversations-list");

    const box = (await sheet(page).boundingBox())!;
    if (isDesktop(page)) {
      const chat = (await headerTitle(page).boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(280);
      expect(box.x + box.width).toBeLessThan(chat.x);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    } else {
      expect([Math.round(box.x), Math.round(box.y), Math.round(box.height)]).toEqual([0, 0, viewport.height]);
      expect(box.width).toBeLessThanOrEqual(viewport.width * 0.88 + 1);
    }

    await rowMenu(page, /^Actions pour/);
    await expect(page.getByRole("menu")).toBeVisible();
    await expectNoOverflow(page);
    await page.waitForTimeout(250);
    await shot(page, "conversations-list-menu");
    await tap(menuItem(page, "Renommer"));
    await expectNoOverflow(page);
    await shot(page, "conversations-list-rename");
    // Escape in the field cancels the rename, keeps the list and hands the focus back to the row.
    await sheet(page).getByRole("textbox", { name: "Titre de la conversation" }).press("Escape");
    await expect(sheet(page).getByRole("textbox", { name: "Titre de la conversation" })).toHaveCount(0);
    await expect(sheet(page).getByRole("button", { name: /^Actions pour/ }).first()).toBeFocused();
    await expect(sheet(page)).toBeVisible();

    await tap(sheet(page).getByRole("button", { name: "Voir plus" }));
    await expect(activeRows(page)).toHaveCount(40);

    // Switching is one click on a row: the URL, the title and the highlight follow.
    const second = activeRows(page).nth(1).getByRole("button").first();
    await tap(second);
    await expect.poll(() => conversationParam(page)).not.toBeNull();
    if (isDesktop(page)) {
      await expect(activeRows(page).nth(1).getByRole("button").first()).toHaveAttribute("aria-current", "true");
      await shot(page, "conversations-sidebar-switched");
    } else {
      await expect(sheet(page)).toBeHidden();
    }
  });
});

import { execSync } from "node:child_process";
import { ACCOUNTS, api, expect, expectNoOverflow, markOnboarded, settle, shot, signIn, tap, test, testSession, type Session } from "./fixtures";

// Phase 2 screenshots for docs/ai-agents/screenshots/02. Each model turn is real (Sonnet 5 through the gateway),
// so the suite is slow and tolerant to wording: it asserts on cards and stored parts, not on sentences.
const PROVIDER = { email: "jeanpierre.mukendi@kayou.cd", name: "Jean-Pierre Mukendi" };
const OTHER_CLIENT = "annie.mutombo@email.cd";
// Seeded with no User.placeId and no address, so the agent has nothing to assume (RFC §4.3, last rule).
const NO_PLACE_CLIENT = "solange.ngoyi@email.cd";
const TURN_TIMEOUT = 150_000;
const PSQL = process.env.E2E_PSQL ?? "psql -h localhost -p 5433 -U postgres -d kayu_agent01 -Atc";

test.describe.configure({ mode: "serial" });
test.setTimeout(900_000);

type Part = { type: string; state?: string; input?: Record<string, unknown>; output?: Record<string, unknown>; approval?: { id: string } };
type Detail = { id: string; messages: Array<{ role: string; parts: Part[] }> };

async function lastParts(request: Parameters<typeof api>[0], session: Session, conversationId: string): Promise<Part[]> {
  const detail = await api<Detail>(request, session, "GET", `/assistant/conversations/${conversationId}`);
  return detail.body.messages.flatMap((message) => message.parts);
}

async function waitForTurn(page: import("@playwright/test").Page) {
  await expect(page.getByRole("status", { name: /cherche/ })).toBeHidden({ timeout: TURN_TIMEOUT });
  await page.waitForFunction(() => !document.querySelector(".loading-card"), null, { timeout: TURN_TIMEOUT });
  await page.waitForTimeout(800);
}

// "Envoyer" names both the composer and the message card's confirm button: every click is scoped.
function composer(page: import("@playwright/test").Page) {
  return page.locator("form").filter({ has: page.getByRole("textbox", { name: "Votre demande" }) });
}

async function send(page: import("@playwright/test").Page, text: string) {
  const input = page.getByRole("textbox", { name: "Votre demande" });
  await expect(input).toBeEnabled({ timeout: TURN_TIMEOUT });
  await input.fill(text);
  await tap(composer(page).getByRole("button", { name: "Envoyer" }));
  await waitForTurn(page);
}

// Answered cards keep their label, so "pending" is defined by the controls only a pending card renders.
function pendingBooking(page: import("@playwright/test").Page) {
  return page.getByRole("region", { name: /Demande de réservation à envoyer/ }).filter({ has: page.getByRole("button", { name: "Confirmer" }) });
}

function pendingMessage(page: import("@playwright/test").Page) {
  return page.getByRole("textbox", { name: "Votre message" });
}

function pendingMessageCard(page: import("@playwright/test").Page) {
  return page.getByRole("region", { name: /Message à envoyer/ }).filter({ has: page.getByRole("textbox", { name: "Votre message" }) }).last();
}

/** The first bookable slot of the newest availability card, so the flow never names a time the provider lost. */
function freeSlot(page: import("@playwright/test").Page) {
  return page.getByRole("tabpanel").last().getByRole("button", { pressed: false }).first();
}

// The model sometimes confirms in a sentence before emitting the call; a couple of nudges are enough.
async function untilPending(page: import("@playwright/test").Page, locator: import("@playwright/test").Locator, nudge: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if ((await locator.count()) > 0) return;
    await send(page, nudge);
  }
  await expect(locator.last()).toBeVisible();
}

test.describe("assistant actions @flows", () => {
  let session: Session;
  let conversationId: string;

  // One fresh conversation per run, and the bookings earlier runs left pending are released so the
  // provider still has free slots: a pending booking holds its slot exactly as a confirmed one does.
  test.beforeAll(async ({ request }) => {
    session = await testSession(request, { email: ACCOUNTS.client });
    const other = await testSession(request, { email: OTHER_CLIENT });
    for (const who of [session, other]) {
      const pending = await api<{ items: Array<{ id: string; counterpart: { name: string } }> }>(request, who, "GET", "/bookings?status=PENDING&limit=50");
      for (const booking of pending.body.items.filter((item) => item.counterpart.name === PROVIDER.name)) {
        await api(request, who, "POST", `/bookings/${booking.id}/cancel`, { reason: "Nettoyage avant le test" });
      }
    }
    const created = await api<{ id: string }>(request, session, "POST", "/assistant/conversations");
    expect(created.status).toBe(201);
    conversationId = created.body.id;
  });

  test("book through the agent: slot picked on the card, taken by someone else, fresh slots, request sent", async ({ page, context, request }) => {
    await markOnboarded(context);
    await signIn(context, session);
    await settle(page, "/assistant");

    await expect(page.getByRole("list", { name: "Suggestions" }).locator("button[data-personal]").first()).toBeVisible();
    await expectNoOverflow(page);
    await shot(page, "assistant-personal-chips");

    await send(page, `Montre-moi les créneaux de ${PROVIDER.name} sur les sept prochains jours.`);
    await tap(freeSlot(page));
    await waitForTurn(page);
    await untilPending(page, pendingBooking(page), "Oui, je confirme le lieu, la date et l'heure : envoie la demande de réservation.");
    await expectNoOverflow(page);
    await shot(page, "assistant-booking-approval");

    const pending = (await lastParts(request, session, conversationId)).find((part) => part.type === "tool-create_booking" && part.state === "approval-requested");
    expect(pending?.input).toBeTruthy();
    const input = pending!.input as { providerId: string; date: string; time: string; addressId?: string };
    expect(input.addressId).toBeTruthy();

    // Another client takes the very slot awaiting approval, through the REST route the profile page uses.
    const other = await testSession(request, { email: OTHER_CLIENT });
    const taken = await api(request, other, "POST", "/bookings", { providerId: input.providerId, date: input.date, time: input.time, clientPhone: "+243819000004" });
    expect(taken.status).toBe(201);

    await tap(pendingBooking(page).last().getByRole("button", { name: "Confirmer" }));
    await waitForTurn(page);
    await expect(page.getByRole("status").filter({ hasText: /Ce créneau vient d'être pris/ }).last()).toBeVisible();
    await expectNoOverflow(page);
    await shot(page, "assistant-booking-slot-taken");

    const afterError = await lastParts(request, session, conversationId);
    expect(afterError.some((part) => part.type === "tool-create_booking" && part.state === "output-error")).toBe(true);
    expect(afterError.filter((part) => part.type === "tool-get_provider_availability").length).toBeGreaterThanOrEqual(2);
    const refreshed = afterError.filter((part) => part.type === "tool-get_provider_availability" && part.state === "output-available").at(-1);
    const days = (refreshed?.output as { days: Array<{ date: string; slots: string[] }> }).days;
    expect(days.find((day) => day.date === input.date)?.slots ?? []).not.toContain(input.time);

    await tap(freeSlot(page));
    await waitForTurn(page);
    await untilPending(page, pendingBooking(page), "Oui, je confirme : envoie la demande de réservation.");
    await tap(pendingBooking(page).last().getByRole("button", { name: "Confirmer" }));
    await waitForTurn(page);
    await expect(page.getByRole("status").filter({ hasText: "Demande envoyée" }).last()).toBeVisible();
    await expect(page.getByRole("link", { name: "Voir la réservation" }).last()).toBeVisible();
    await expectNoOverflow(page);
    await shot(page, "assistant-booking-sent");

    const done = (await lastParts(request, session, conversationId)).find((part) => part.type === "tool-create_booking" && part.state === "output-available");
    const booking = done?.output as { id: string; status: string };
    expect(booking.status).toBe("PENDING");
    const bookings = await api<{ items: Array<{ id: string }> }>(request, session, "GET", "/bookings?status=PENDING&limit=50");
    expect(bookings.body.items.some((item) => item.id === booking.id)).toBe(true);
  });

  test("message through the agent: edit the text before it goes out, then deny a booking", async ({ page, context, request }) => {
    await markOnboarded(context);
    await signIn(context, session);
    await settle(page, "/assistant");

    await send(page, `Écris à ${PROVIDER.name} : la fuite est sous l'évier de la cuisine, merci de prévoir les joints.`);
    await untilPending(page, pendingMessage(page), "Oui, prépare le message pour que je le valide.");
    await expectNoOverflow(page);
    await shot(page, "assistant-message-approval");

    const textarea = pendingMessageCard(page).getByRole("textbox", { name: "Votre message" });
    const original = await textarea.inputValue();
    await textarea.fill(`${original.trim()} Merci d'apporter aussi une clé à molette.`);
    await tap(pendingMessageCard(page).getByRole("button", { name: "Envoyer le texte modifié" }));
    await waitForTurn(page);
    await untilPending(page, pendingMessage(page), "Renvoie-moi le message modifié à valider.");
    expect(await pendingMessageCard(page).getByRole("textbox", { name: "Votre message" }).inputValue()).toMatch(/clé à molette/);
    await shot(page, "assistant-message-revised");

    await tap(pendingMessageCard(page).getByRole("button", { name: "Envoyer", exact: true }));
    await waitForTurn(page);
    await expect(page.getByRole("status").filter({ hasText: "Message envoyé" }).last()).toBeVisible();
    await expect(page.getByRole("link", { name: "Ouvrir la conversation" }).last()).toBeVisible();
    await expectNoOverflow(page);
    await shot(page, "assistant-message-sent");

    const parts = await lastParts(request, session, conversationId);
    // A call superseded by the revised text is denied server-side before the next turn runs.
    const denied = parts.filter(
      (part) => part.type === "tool-send_message" && (part.state === "output-denied" || (part.state === "approval-responded" && (part.approval as { approved?: boolean }).approved === false)),
    );
    const sent = parts.find((part) => part.type === "tool-send_message" && part.state === "output-available");
    expect(denied.length).toBeGreaterThanOrEqual(1);
    expect(sent).toBeTruthy();
    const sentConversationId = (sent?.output as { conversation: { id: string } }).conversation.id;
    const thread = await api<{ items: Array<{ body: string | null; mine: boolean }> }>(request, session, "GET", `/conversations/${sentConversationId}/messages?limit=5`);
    expect([...thread.body.items].reverse().find((item) => item.mine)?.body).toMatch(/clé à molette/);

    const bookingsBefore = await api<{ total: number }>(request, session, "GET", "/bookings?status=PENDING&limit=50");
    await send(page, `Et montre-moi ses créneaux sur les sept prochains jours.`);
    await tap(freeSlot(page));
    await waitForTurn(page);
    await untilPending(page, pendingBooking(page), "Oui, je confirme : envoie la demande de réservation.");
    await tap(pendingBooking(page).last().getByRole("button", { name: "Annuler" }));
    await waitForTurn(page);
    await expect(page.getByRole("status").filter({ hasText: "Annulé, rien n'a été envoyé." }).last()).toBeVisible();
    await expectNoOverflow(page);
    await shot(page, "assistant-booking-denied");

    const bookingsAfter = await api<{ total: number }>(request, session, "GET", "/bookings?status=PENDING&limit=50");
    expect(bookingsAfter.body.total).toBe(bookingsBefore.body.total);
    const after = await lastParts(request, session, conversationId);
    expect(after.some((part) => part.type === "tool-create_booking" && (part.state === "output-denied" || (part.state === "approval-responded" && (part.approval as { approved?: boolean }).approved === false)))).toBe(true);
  });

  test("the provider sees the pending request on /mon-espace and the message in /messagerie", async ({ browser, request }) => {
    const context = await browser.newContext({ ...test.info().project.use });
    await markOnboarded(context);
    const provider = await testSession(request, { email: PROVIDER.email });
    await signIn(context, provider);
    const page = await context.newPage();

    await settle(page, "/mon-espace");
    await expect(page.getByText(/Paul Kabasele/).first()).toBeVisible({ timeout: 20_000 });
    await expectNoOverflow(page);
    await shot(page, "provider-espace-pending");

    await settle(page, "/messagerie");
    await expect(page.getByText(/Paul Kabasele/).first()).toBeVisible({ timeout: 20_000 });
    await tap(page.getByText(/Paul Kabasele/).first());
    await expect(page.getByText(/clé à molette/).first()).toBeVisible({ timeout: 20_000 });
    await expectNoOverflow(page);
    await shot(page, "provider-messagerie-agent-message");
    await context.close();
  });

  test("the admin overview shows the assistant tile", async ({ browser, request }) => {
    const context = await browser.newContext({ ...test.info().project.use });
    await markOnboarded(context);
    await signIn(context, await testSession(request, { email: ACCOUNTS.admin }));
    const page = await context.newPage();
    await settle(page, "/admin");
    await expect(page.getByText("Assistant · conversations aujourd'hui")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/réservation.*repli/)).toBeVisible();
    await shot(page, "admin-assistant-tile");
    await context.close();
  });

  test("a client with no stored place is offered the resolved place as their default address", async ({ browser, request }) => {
    const context = await browser.newContext({ ...test.info().project.use });
    await markOnboarded(context);
    const fresh = await testSession(request, { email: NO_PLACE_CLIENT });
    // Self-healing: an earlier run of this test is what gave this client an address in the first place.
    const existing = await api<{ items: Array<{ id: string }> }>(request, fresh, "GET", "/addresses?limit=50");
    for (const address of existing.body.items) await api(request, fresh, "DELETE", `/addresses/${address.id}`);
    const before = await api<{ items: unknown[] }>(request, fresh, "GET", "/addresses?limit=50");
    expect(before.body.items).toHaveLength(0);
    const conversation = await api<{ id: string }>(request, fresh, "POST", "/assistant/conversations");
    expect(conversation.status).toBe(201);
    await signIn(context, fresh);
    const page = await context.newPage();
    await settle(page, "/assistant");

    // No location is known, so no "près de chez moi" chip is offered; the place comes from the message.
    await expect(page.getByRole("list", { name: "Suggestions" }).getByRole("button", { name: /près de chez moi/ })).toHaveCount(0);
    await send(page, "Je veux un plombier à Gombe.");

    const card = page.getByRole("region", { name: /comme votre adresse/ });
    await expect(card).toBeVisible();
    await expect(card).toContainText("Gombe");
    await expectNoOverflow(page);
    await shot(page, "assistant-address-save-default");

    await card.getByRole("textbox", { name: "Adresse" }).fill("15 avenue Colonel Ebeya");
    await tap(card.getByRole("button", { name: "Enregistrer comme adresse par défaut" }));
    await waitForTurn(page);

    const after = await api<{ items: Array<{ addressLine: string; isDefault: boolean; placeId: string | null }> }>(request, fresh, "GET", "/addresses?limit=50");
    expect(after.body.items).toHaveLength(1);
    expect(after.body.items[0]).toMatchObject({ addressLine: "15 avenue Colonel Ebeya", isDefault: true });
    expect(after.body.items[0]!.placeId).toBeTruthy();
    const detail = await api<{ clientLocation: { label: string } | null }>(request, fresh, "GET", `/assistant/conversations/${conversation.body.id}`);
    expect(detail.body.clientLocation?.label).toMatch(/Gombe/);
    await expect(page.getByRole("region", { name: /comme votre adresse/ })).toHaveCount(0);
    await shot(page, "assistant-address-saved");
    await context.close();
  });

  test("the daily cap blocks the next turn with a French message", async ({ page, context }) => {
    await markOnboarded(context);
    await signIn(context, session);
    execSync(`${PSQL} "update \\"SystemSetting\\" set value='1' where key='agent.maxTurnsPerUserPerDay'"`, { stdio: "pipe" });
    try {
      await settle(page, "/assistant");
      const input = page.getByRole("textbox", { name: "Votre demande" });
      await input.fill("Encore une demande");
      await tap(composer(page).getByRole("button", { name: "Envoyer" }));
      await expect(page.getByRole("alert").filter({ hasText: "Vous avez atteint la limite de demandes pour aujourd'hui." })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(/limite de 1 demandes/)).toBeVisible();
      await expectNoOverflow(page);
      await shot(page, "assistant-daily-cap");
    } finally {
      execSync(`${PSQL} "update \\"SystemSetting\\" set value='30' where key='agent.maxTurnsPerUserPerDay'"`, { stdio: "pipe" });
    }
  });
});

import { ACCOUNTS, api, expect, expectNoOverflow, markOnboarded, settle, shot, signIn, tap, test, testSession } from "./fixtures";

// Screenshots for docs/ai-agents/screenshots/01. Run with E2E_SHOTS_DIR set. The @viewports conversation test expects
// the client's latest conversation to hold turns already (sent through the API before the run) so the cards render on reload;
// the @flows test creates a fresh conversation and spends one real model turn.
test.describe("assistant @viewports", () => {
  test("client sees the conversation with its cards, no overflow", async ({ page, context, request }) => {
    await markOnboarded(context);
    await signIn(context, await testSession(request, { email: ACCOUNTS.client }));
    await settle(page, "/assistant");
    await expect(page).toHaveURL(/\/assistant$/);
    await expect(page.getByRole("heading", { name: "Assistant" })).toBeVisible();
    await expectNoOverflow(page);
    await shot(page, "assistant-conversation");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${process.env.E2E_SHOTS_DIR}/assistant-top-${test.info().project.use.viewport!.width}${test.info().project.name === "reduced-motion" ? "-reduced" : ""}.png` });
  });

  test("home shows the assistant link for a client", async ({ page, context, request }) => {
    await markOnboarded(context);
    await signIn(context, await testSession(request, { email: ACCOUNTS.client }));
    await settle(page, "/");
    await expect(page.getByRole("link", { name: /décrivez votre besoin/i })).toBeVisible();
    await shot(page, "home-assistant-link");
  });

  test("provider is redirected to /mon-espace", async ({ page, context, request }) => {
    await markOnboarded(context);
    await signIn(context, await testSession(request, { email: ACCOUNTS.provider }));
    await page.goto("/assistant");
    await page.waitForURL(/\/mon-espace/, { timeout: 20_000 });
    await expect(page).toHaveURL(/\/mon-espace/);
  });

  test("anonymous visitor is sent to login with returnTo", async ({ page }) => {
    await page.goto("/assistant");
    await page.waitForURL(/\/login\?returnTo=%2Fassistant/, { timeout: 20_000 });
  });
});

test.describe("assistant empty state @flows", () => {
  test("a fresh conversation shows greeting, chips and the composer", async ({ page, context, request }) => {
    await markOnboarded(context);
    const session = await testSession(request, { email: process.env.E2E_FRESH_CLIENT ?? "alain.musasa@email.cd" });
    const created = await api(request, session, "POST", "/assistant/conversations");
    expect(created.status).toBe(201);
    await signIn(context, session);
    await settle(page, "/assistant");
    await expect(page.getByRole("heading", { level: 2, name: /De quoi avez-vous besoin/ })).toBeVisible();
    await expect(page.getByRole("list", { name: "Suggestions" }).getByRole("button")).toHaveCount(4);
    await expectNoOverflow(page);
    await shot(page, "assistant-empty");
    await tap(page.getByRole("list", { name: "Suggestions" }).getByRole("button").first());
    await expect(page.getByRole("status", { name: /cherche/ })).toBeVisible();
    await shot(page, "assistant-thinking");
    await expect(page.getByRole("status", { name: /cherche/ })).toBeHidden({ timeout: 150_000 });
    await expect(page.locator("main p").filter({ hasText: /.{20,}/ }).last()).toBeVisible();
    await page.waitForTimeout(1500);
    await expectNoOverflow(page);
    await shot(page, "assistant-first-answer");
  });
});

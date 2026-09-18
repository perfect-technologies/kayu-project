import { expect, expectNoOverflow, markOnboarded, settle, shot, test } from "./fixtures";

// notFound() in a (shell) page used to render the root not-found.tsx inside the shell layout: two navbars.
test.describe("not found @viewports", () => {
  test.beforeEach(async ({ context }) => {
    await markOnboarded(context);
  });

  for (const [name, route] of [
    ["an unknown provider", "/prestataire/n-existe-pas"],
    ["an unknown URL", "/cette-page-n-existe-pas"],
  ] as const) {
    test(`${name} shows one shell`, async ({ page }) => {
      await settle(page, route);
      await expect(page.getByRole("heading", { level: 1, name: "Page introuvable" })).toBeVisible();
      await expect(page.locator("header")).toHaveCount(1);
      await expectNoOverflow(page);
      await shot(page, `not-found-${route.startsWith("/prestataire") ? "provider" : "url"}`);
    });
  }
});

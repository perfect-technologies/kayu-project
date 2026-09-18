import { API, expect, expectNoOverflow, markOnboarded, settle, shot, tap, test } from "./fixtures";

// Search intent (docs/ai-jev/02-search-intent-product.md). Needs a backend with TYPESAFE_API_KEY and the
// feat_jev_search setting on: every test calls the real Jev model. Screenshots go to E2E_SHOTS_DIR.
const search = (q: string, extra = "") => `/rechercher?q=${encodeURIComponent(q)}${extra}`;
const chip = (page: import("@playwright/test").Page) => page.getByText(/^Inclut aussi : /);

// A cold connection can push the first Jev call past the search budget; the backend specs cover that path.
// Asking each query once through the API first keeps these tests about the page, not about network warm-up.
const QUERIES = ["installer des caméras chez moi", "travaux dans ma maison", "Mama Nzuzi", "je veux un jardinier", "il y a des cafards partout dans la cuisine"];

test.describe("search intent @viewports", () => {
  test.beforeAll(async ({ request }) => {
    for (const q of QUERIES) await request.get(`${API}/providers?q=${encodeURIComponent(q)}`);
  });

  test.beforeEach(async ({ context }) => {
    await markOnboarded(context);
  });

  test("a described need adds its subcategory, shown as a removable chip", async ({ page }) => {
    await settle(page, search("installer des caméras chez moi"));
    await expect(chip(page)).toHaveText("Inclut aussi : Système de sécurité");
    await expect(page.getByRole("button", { name: "Retirer Système de sécurité de la recherche" })).toBeVisible();
    await expect(page.getByText(/prestataires? trouvés?/)).toBeVisible();
    await expectNoOverflow(page);
    await shot(page, "search-intent-subcategory");
  });

  test("a vague need falls back to its category", async ({ page }) => {
    await settle(page, search("travaux dans ma maison"));
    await expect(chip(page)).toHaveText("Inclut aussi : Bâtiment & Construction");
    await expectNoOverflow(page);
    await shot(page, "search-intent-category");
  });

  test("a provider's name gets no chip", async ({ page }) => {
    await settle(page, search("Mama Nzuzi"));
    await expect(page.getByText(/prestataires? trouvés?|Aucun prestataire/).first()).toBeVisible();
    await expect(chip(page)).toHaveCount(0);
    await shot(page, "search-intent-name");
  });

  test("removing the chip searches the text only; a new query is interpreted again", async ({ page }) => {
    await settle(page, search("installer des caméras chez moi"));
    await tap(page.getByRole("button", { name: "Retirer Système de sécurité de la recherche" }));
    await expect(page).toHaveURL(/brut=1/);
    await expect(chip(page)).toHaveCount(0);
    await page.waitForLoadState("networkidle");
    await expectNoOverflow(page);
    await shot(page, "search-intent-removed");

    await page.getByRole("searchbox").fill("je veux un jardinier");
    await expect(page).not.toHaveURL(/brut=1/);
    await expect(chip(page)).toHaveText("Inclut aussi : Jardinage");
  });

  test("the chip stays above the empty state when no provider matches", async ({ page }) => {
    await settle(page, search("il y a des cafards partout dans la cuisine"));
    await expect(chip(page)).toHaveText("Inclut aussi : Désinsectisation & Dératisation");
    await expect(page.getByRole("heading", { name: "Aucun prestataire pour ces critères" })).toBeVisible();
    await expectNoOverflow(page);
    await shot(page, "search-intent-empty");
  });
});

// router.replace dropped search-param changes on /rechercher in production builds; the page now uses history.replaceState.
test.describe("search URL state @viewports", () => {
  test("the list/map toggle survives in the URL", async ({ page, context }) => {
    await markOnboarded(context);
    await settle(page, "/rechercher?q=jardinier");
    await tap(page.getByRole("button", { name: "Carte" }));
    await expect(page).toHaveURL(/view=map/);
    await expect(page.getByRole("button", { name: "Carte", pressed: true })).toBeVisible();
  });
});

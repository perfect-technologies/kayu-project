import {
  ACCOUNTS,
  API,
  BASE,
  api,
  confirmDialog,
  expect,
  expectNoOverflow,
  markOnboarded,
  nextWeekday,
  pngFixture,
  readState,
  settle,
  shot,
  signIn,
  tap,
  test,
  testSession,
  toast,
  writeState,
  type Session,
} from "./fixtures";

const PUBLIC_ROUTES = ["/", "/rechercher", "/services", "/premium", "/contact", "/cgu", "/confidentialite", "/bienvenue", "/login", "/register", "/launch"];
const ADMIN_TABS = ["overview", "users", "providers", "verification", "bookings", "reviews", "conversations", "contacts", "reports", "content", "categories", "references", "audit", "system"];
const ADMIN_LABELS: Record<string, string> = { overview: "Vue d'ensemble", users: "Communauté", providers: "Talents", verification: "Vérification", bookings: "Réservations", reviews: "Avis", conversations: "Conversations", contacts: "Contact", reports: "Modération", content: "Contenu", categories: "Catégories", references: "Listes & lieux", audit: "Journal", system: "Système" };
const LEGACY_REDIRECTS: Array<[string, string]> = [
  ["/services?q=x", "/rechercher?q=x"],
  ["/providers/abc", "/prestataire/abc"],
  ["/bookings", "/mes-reservations"],
  ["/messages", "/messagerie"],
  ["/pro", "/mon-espace"],
  ["/auth", "/login"],
  ["/dashboard/admin", "/admin"],
  ["/bookings/abc", "/reservation/abc"],
  ["/pro/earnings", "/revenus"],
  ["/dashboard/settings", "/compte"],
  ["/dashboard/client", "/mes-reservations"],
  ["/pro/onboarding", "/prestataire/nouveau"],
];

async function seededProviderId(request: Parameters<typeof api>[0], email: string = ACCOUNTS.provider): Promise<string> {
  const session = await testSession(request, { email });
  const me = await api(request, session, "GET", "/me");
  const providerId = me.body?.user?.provider?.id ?? me.body?.user?.providerId;
  if (providerId) return providerId;
  const list = await api(request, null, "GET", `/providers?q=${encodeURIComponent(me.body.user.firstName)}&limit=5`);
  const found = list.body.items?.find((item: any) => item.ownerId === me.body.user.id) ?? list.body.items?.[0];
  if (!found) throw new Error(`no provider found for ${email}`);
  return found.id;
}

test.describe("1. public routes @viewports", () => {
  test("render without horizontal overflow", async ({ page, context, request }) => {
    await markOnboarded(context);
    const providerId = await seededProviderId(request);
    for (const route of [...PUBLIC_ROUTES, `/prestataire/${providerId}`]) {
      await test.step(route, async () => {
        await settle(page, route);
        expect(page.url(), `landed on ${page.url()}`).toContain(route === "/" ? BASE : route.split("?")[0]!);
        await expectNoOverflow(page);
        if (route === "/") await shot(page, "home");
        if (route === "/rechercher") await shot(page, "rechercher");
        if (route.startsWith("/prestataire/")) await shot(page, "prestataire");
      });
    }
  });

  test("signed-in spaces render without overflow", async ({ browser, request }) => {
    const [client, provider, admin] = await Promise.all([
      testSession(request, { email: ACCOUNTS.client }),
      testSession(request, { email: ACCOUNTS.provider }),
      testSession(request, { email: ACCOUNTS.admin }),
    ]);
    const routes: Array<[Session, string, string]> = [
      [provider, "/mon-espace", "mon-espace"],
      [client, "/mes-reservations", "mes-reservations"],
      [client, "/messagerie", "messagerie"],
      [admin, "/admin", "admin"],
    ];
    for (const [session, route, name] of routes) {
      await test.step(route, async () => {
        const context = await browser.newContext(test.info().project.use);
        await markOnboarded(context);
        await signIn(context, session);
        const page = await context.newPage();
        await settle(page, route);
        expect(page.url()).toContain(route);
        await expect(page.locator("h1").first()).toBeAttached();
        await expectNoOverflow(page);
        await shot(page, name);
        await context.close();
      });
    }
  });
});

test.describe("2. anonymous profile @public", () => {
  test("shows the login wall on contacts, booking and review blocks", async ({ page, context, request }) => {
    await markOnboarded(context);
    const providerId = await seededProviderId(request);
    await settle(page, `/prestataire/${providerId}`);
    const walls = page.getByText("Connectez-vous pour continuer");
    await expect(walls.first()).toBeVisible();
    expect(await walls.count()).toBe(3);
    await expect(page.getByRole("button", { name: "Confirmer la réservation" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Publier mon avis" })).toHaveCount(0);
  });
});

test.describe("12. legacy redirects @public", () => {
  test("old paths answer 308 to the French routes", async ({ request }) => {
    for (const [from, to] of LEGACY_REDIRECTS) {
      const response = await request.get(`${BASE}${from}`, { maxRedirects: 0 });
      const location = response.headers()["location"] ?? "";
      expect(response.status(), `${from} → ${response.status()} ${location}`).toBe(308);
      expect(location.replace(BASE, ""), `${from} → ${location}`).toBe(to);
    }
  });

  test("removed routes answer a redirect or 404", async ({ request }) => {
    for (const route of ["/quotes/abc", "/pro/requests", "/pro/devis/abc", "/dashboard/admin/categories/x", "/favorites", "/pro/payouts"]) {
      const response = await request.get(`${BASE}${route}`, { maxRedirects: 0 });
      expect([301, 302, 307, 308, 404], `${route} → ${response.status()}`).toContain(response.status());
    }
  });
});

test.describe("3. client journey @flows @reduced", () => {
  test("search by category and place, message with an image, book, cancel, book again", async ({ page, context, request }) => {
    test.setTimeout(240_000);
    await markOnboarded(context);
    const client = await testSession(request, { email: ACCOUNTS.client });
    await signIn(context, client);
    const providerId = await seededProviderId(request);
    const provider = (await api(request, client, "GET", `/providers/${providerId}`)).body;
    const category = provider.categoryChain?.[0];
    const placeChain: Array<{ kind: string; label: string }> = provider.placeChain ?? [];

    await test.step("search", async () => {
      await settle(page, "/rechercher");
      await page.getByRole("button", { name: "Ouvrir les filtres" }).click();
      const sheet = page.getByRole("dialog").last();
      await expect(sheet).toBeVisible();
      await sheet.getByLabel("Catégorie", { exact: true }).selectOption({ label: category.name });
      const kinds: Record<string, string> = { COUNTRY: "Pays", PROVINCE: "Province", CITY: "Ville", COMMUNE: "Commune", TERRITORY: "Territoire" };
      for (const node of placeChain) {
        const label = kinds[node.kind];
        if (!label) continue;
        const select = sheet.getByLabel(label, { exact: true });
        if ((await select.count()) === 0) break;
        await select.selectOption({ label: node.label });
        await page.waitForTimeout(300);
      }
      await sheet.getByRole("button", { name: "Appliquer" }).click();
      await page.waitForURL((url) => url.searchParams.has("category") && url.searchParams.has("place"));
      await page.waitForLoadState("networkidle");
      const card = page.locator(`a[href='/prestataire/${providerId}']`).first();
      await expect(card).toBeVisible();
      await card.click();
      await page.waitForURL(`**/prestataire/${providerId}`);
    });

    await test.step("message with one image attachment", async () => {
      await tap(page.getByRole("button", { name: "Envoyer un message" }));
      const sheet = page.getByRole("dialog").last();
      await expect(sheet).toBeVisible();
      await sheet.getByLabel("Message", { exact: true }).fill(`Bonjour, message e2e ${Date.now()}`);
      await sheet.locator("input[type=file]").first().setInputFiles(pngFixture());
      await expect(sheet.locator("img").first()).toBeVisible();
      await expect(sheet.getByText("Envoi du fichier…")).toHaveCount(0);
      await tap(sheet.getByRole("button", { name: "Envoyer", exact: true }));
      await page.waitForURL(/\/messagerie\?c=/);
      const conversationId = new URL(page.url()).searchParams.get("c")!;
      const messages = await api(request, client, "GET", `/conversations/${conversationId}/messages`);
      const withImage = messages.body.items.find((m: any) => m.attachments?.length);
      expect(withImage, "message with attachment persisted").toBeTruthy();
      await expect(page.locator("[data-message-id] img").first()).toBeVisible();
      writeState({ conversationId });
    });

    const book = async () => {
      await settle(page, `/prestataire/${providerId}`);
      const dateInput = page.locator("input[type=date]");
      await dateInput.fill(nextWeekday(7));
      await dateInput.dispatchEvent("change");
      const slot = page.locator("button", { hasText: /^\d{2}:\d{2}$/ }).first();
      await expect(slot).toBeVisible();
      const time = (await slot.textContent())!.trim();
      await tap(slot);
      await page.getByLabel("Sans adresse").check({ force: true });
      await tap(page.getByRole("button", { name: "Confirmer la réservation" }));
      await expect(page.getByText("Créneau réservé")).toBeVisible();
      const pending = await api(request, client, "GET", "/bookings?status=PENDING&limit=100");
      const created = pending.body.items.find((b: any) => b.counterpart?.providerId === providerId || b.providerId === providerId);
      expect(created, "pending booking visible through the API").toBeTruthy();
      return { id: created.id as string, time };
    };

    const first = await test.step("book the first available slot", book);

    await test.step("pending in /mes-reservations, then cancel", async () => {
      await settle(page, "/mes-reservations");
      const card = page.locator("article").filter({ hasText: "En attente" }).first();
      await expect(card).toBeVisible();
      await tap(card.getByRole("button", { name: "Annuler" }));
      await confirmDialog(page, "Annuler la réservation");
      await toast(page, "Réservation annulée");
      const detail = await api(request, client, "GET", `/bookings/${first.id}`);
      expect(detail.body.status).toBe("CANCELLED");
    });

    const second = await test.step("book another slot", book);
    writeState({ bookingId: second.id, providerId });
  });
});

test.describe("4. provider space @flows", () => {
  test("confirm, complete with an agreed price, see the transaction, rate the client", async ({ page, context, request }) => {
    test.setTimeout(180_000);
    await markOnboarded(context);
    const provider = await testSession(request, { email: ACCOUNTS.provider });
    await signIn(context, provider);
    const bookingId = readState().bookingId;
    expect(bookingId, "scenario 3 left a booking id").toBeTruthy();

    await test.step("confirm from /mon-espace", async () => {
      await settle(page, "/mon-espace");
      const request$ = page.locator("[data-booking-id='" + bookingId + "'], article, li").filter({ hasText: "Paul" }).first();
      await expect(request$).toBeVisible();
      const expand = request$.getByRole("button", { name: "Voir la demande" });
      if (await expand.count()) await tap(expand.first());
      await tap(page.getByRole("button", { name: "Confirmer", exact: true }).first());
      await confirmDialog(page, "Confirmer");
      await toast(page, "Réservation confirmée");
      expect((await api(request, provider, "GET", `/bookings/${bookingId}`)).body.status).toBe("CONFIRMED");
    });

    await test.step("complete with an agreed price", async () => {
      await settle(page, `/reservation/${bookingId}`);
      await tap(page.getByRole("button", { name: "Terminer", exact: true }).first());
      const dialog = page.getByRole("dialog").last();
      await dialog.getByLabel(/Prix convenu/).fill("25000");
      await tap(dialog.getByRole("button", { name: "Terminer", exact: true }));
      await toast(page, "Réservation terminée");
      const detail = (await api(request, provider, "GET", `/bookings/${bookingId}`)).body;
      expect(detail.status).toBe("COMPLETED");
      expect(detail.agreedPrice).toBe(25000);
    });

    await test.step("/revenus shows the transaction", async () => {
      await settle(page, "/revenus");
      const summary = (await api(request, provider, "GET", "/pro/earnings/summary")).body;
      await expect(page.locator("main")).toContainText(new Intl.NumberFormat("fr-CD").format(summary.total));
      const transactions = (await api(request, provider, "GET", "/pro/earnings/transactions?page=1")).body;
      expect(transactions.items.some((t: any) => t.bookingId === bookingId || t.booking?.id === bookingId)).toBe(true);
    });

    await test.step("rate the client from /mon-espace", async () => {
      await settle(page, "/mon-espace");
      const forms = page.getByRole("button", { name: "Envoyer ma note" });
      const before = await forms.count();
      expect(before).toBeGreaterThan(0);
      const form = page.locator("form").filter({ has: forms.first() }).first();
      await tap(form.getByRole("radio", { name: "5 étoiles" }).first());
      await tap(form.getByRole("button", { name: "Envoyer ma note" }));
      await expect(page.getByText("Merci, votre note a été enregistrée.")).toBeVisible();
      await settle(page, "/mon-espace");
      expect(await page.getByRole("button", { name: "Envoyer ma note" }).count()).toBe(before - 1);
    });
  });
});

test.describe("5. client review @flows", () => {
  test("/avis lists the booking, 500-character review updates the profile average", async ({ page, context, request }) => {
    await markOnboarded(context);
    const client = await testSession(request, { email: ACCOUNTS.client });
    await signIn(context, client);
    const { bookingId, providerId } = readState();
    const admin = await testSession(request, { email: ACCOUNTS.admin });
    const paulId = (await api(request, client, "GET", "/me")).body.user.id;
    const existing = (await api(request, admin, "GET", "/admin/reviews?limit=100&q=Kabasele")).body.items ?? [];
    for (const review of existing.filter((r: any) => r.client?.id === paulId && r.provider?.id === providerId)) {
      await api(request, admin, "DELETE", `/admin/reviews/${review.id}`);
    }
    const before = (await api(request, null, "GET", `/providers/${providerId}`)).body;

    await settle(page, "/avis");
    await expect(page.getByText("À évaluer")).toBeVisible();
    const link = page.locator(`a[href*='/prestataire/${providerId}?review=']`).first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL(/\/prestataire\//);
    expect(page.url()).toContain(`review=${bookingId}`);

    await tap(page.getByRole("radio", { name: "5 étoiles" }));
    const comment = page.getByLabel("Votre commentaire");
    const text = "Travail soigné, ponctuel et à l'écoute ; je recommande sans hésiter. ".repeat(10).slice(0, 520);
    await comment.fill(text);
    expect((await comment.inputValue()).length).toBe(500);
    await expect(page.getByText("500/500")).toBeVisible();
    await tap(page.getByRole("button", { name: "Publier mon avis" }));
    await expect(page.getByText("Merci pour votre avis !")).toBeVisible();

    const after = (await api(request, null, "GET", `/providers/${providerId}`)).body;
    expect(after.ratingCount).toBe(before.ratingCount + 1);
    expect(after.ratingAvg).toBeCloseTo((before.ratingAvg * before.ratingCount + 5) / after.ratingCount, 1);
    await settle(page, `/prestataire/${providerId}`);
    await expect(page.getByText(`Avis clients (${after.ratingCount})`)).toBeVisible();
    await expect(page.getByText(text.slice(0, 60)).first()).toBeVisible();
  });
});

test.describe("6. new client publishes a provider @flows", () => {
  test("wizard with a YouTube video and a schedule, searchable, PROVIDER role, client-only routes redirect", async ({ page, context, request }) => {
    test.setTimeout(240_000);
    await markOnboarded(context);
    const phone = `+24399${String(Date.now()).slice(-7)}`;
    const session = await testSession(request, { phone });
    await signIn(context, session);
    const displayName = `Talent E2E ${Date.now().toString(36)}`;
    writeState({ newPhone: phone, newDisplayName: displayName });

    await test.step("accept the terms", async () => {
      const me = await api(request, session, "GET", "/me");
      expect(me.status, JSON.stringify(me.body).slice(0, 200)).toBe(200);
      await settle(page, "/rechercher");
      const accept = page.getByRole("button", { name: "J'accepte et je continue" });
      if (await accept.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await accept.click();
        await expect(accept).toHaveCount(0);
      } else {
        await api(request, session, "POST", "/me/accept-terms");
      }
      await api(request, session, "PATCH", "/me/profile", { firstName: "Talent", lastName: "E2E" });
    });

    await test.step("step 1 infos", async () => {
      await settle(page, "/prestataire/nouveau");
      await page.getByRole("textbox", { name: "Nom d'affichage" }).fill(displayName);
      await page.getByRole("button", { name: "Continuer" }).click();
    });

    await test.step("step 2 services", async () => {
      const combo = (name: string) => page.getByRole("combobox", { name, exact: true });
      await combo("Catégorie").selectOption({ index: 1 });
      await expect(combo("Sous-catégorie")).toBeEnabled();
      await combo("Sous-catégorie").selectOption({ index: 1 });
      await page.waitForTimeout(300);
      if (await combo("Service").isEnabled()) await combo("Service").selectOption({ index: 1 });
      await page.getByRole("spinbutton", { name: "Années d'expérience" }).fill("3");
      await page.getByRole("textbox", { name: "Description" }).fill("Profil créé par le smoke Playwright du workstream 10.");
      await page.getByRole("button", { name: "Continuer" }).click();
    });

    await test.step("step 3 location", async () => {
      for (const label of ["Pays", "Province", "Ville", "Commune"]) {
        const select = page.getByRole("combobox", { name: label, exact: true });
        await page.waitForTimeout(500);
        if ((await select.count()) === 0) continue;
        await select.selectOption({ index: 1 });
      }
      await page.getByRole("textbox", { name: "Adresse", exact: true }).fill("12, avenue du Smoke");
      await page.getByRole("button", { name: "Continuer" }).click();
    });

    await test.step("step 4 public profile with a YouTube video", async () => {
      await page.getByRole("button", { name: "Français" }).click();
      await page.getByRole("button", { name: "À domicile" }).click();
      await page.getByRole("tab", { name: "Lien YouTube" }).click();
      await page.getByRole("textbox", { name: "Lien de la vidéo" }).fill("https://youtu.be/dQw4w9WgXcQ");
      await page.getByRole("button", { name: "Ajouter cette vidéo" }).click();
      await expect(page.getByText("Mes vidéos 1/12")).toBeVisible();
      await expect(page.getByText("Mon planning")).toBeVisible();
      await page.getByRole("checkbox", { name: /J'accepte les conditions/ }).check({ force: true });
      await tap(page.getByRole("button", { name: "Créer mon profil" }));
      await page.waitForURL((url) => /^\/prestataire\/(?!nouveau$)[^/]+$/.test(url.pathname), { timeout: 30_000 });
    });

    const providerId = new URL(page.url()).pathname.split("/prestataire/")[1]!;
    writeState({ newProviderId: providerId });

    await test.step("searchable, PROVIDER role, schedule and video stored", async () => {
      const detail = (await api(request, null, "GET", `/providers/${providerId}`)).body;
      expect(detail.media?.some((m: any) => m.youtubeId || m.kind === "YOUTUBE" || /youtu/.test(m.url ?? ""))).toBe(true);
      expect(detail.schedule ?? detail.weeklyRanges ?? detail.availability).toBeTruthy();
      const search = (await api(request, null, "GET", `/providers?q=${encodeURIComponent(displayName)}&limit=5`)).body;
      expect(search.items.some((p: any) => p.id === providerId)).toBe(true);
      const me = (await api(request, session, "GET", "/me")).body;
      expect(me.user.role).toBe("PROVIDER");
      await page.goto("/mes-reservations");
      await page.waitForURL("**/mon-espace");
    });
  });
});

test.describe("7. safety @flows", () => {
  test("block a provider, 403 on messaging and booking, file a report", async ({ page, context, request }) => {
    await markOnboarded(context);
    const client = await testSession(request, { email: ACCOUNTS.client });
    await signIn(context, client);
    const blockedId = await seededProviderId(request, ACCOUNTS.blockedProvider);
    const reportedId = await seededProviderId(request, ACCOUNTS.reportedProvider);
    const blocked = (await api(request, client, "GET", `/providers/${blockedId}`)).body;

    await settle(page, `/prestataire/${blockedId}`);
    await tap(page.getByRole("button", { name: "Bloquer" }));
    await confirmDialog(page, "Confirmer le blocage");
    await page.waitForURL("**/rechercher**");

    const message = await api(request, client, "POST", "/conversations", { providerId: blockedId, body: "test" });
    expect(message.status, JSON.stringify(message.body)).toBe(403);
    const booking = await api(request, client, "POST", "/bookings", { providerId: blockedId, date: nextWeekday(10), time: "09:15", clientPhone: "+243819000001" });
    expect(booking.status, JSON.stringify(booking.body)).toBe(403);

    await settle(page, `/prestataire/${reportedId}`);
    await tap(page.getByRole("button", { name: "Signaler" }));
    const dialog = page.getByRole("dialog").last();
    await dialog.getByLabel("Que souhaitez-vous signaler ?").fill("Signalement e2e du workstream 10.");
    await tap(dialog.getByRole("button", { name: "Envoyer le signalement" }));
    await toast(page, "Signalement envoyé");

    const unblock = await api(request, client, "DELETE", `/blocks/${blocked.ownerId}`);
    expect([200, 204]).toContain(unblock.status);
  });
});

test.describe("8. admin console @flows", () => {
  test("every section renders; suspend, resolve, edit the hero, approve a place", async ({ page, context, request }) => {
    test.setTimeout(480_000);
    await markOnboarded(context);
    const admin = await testSession(request, { email: ACCOUNTS.admin });
    await signIn(context, admin);

    await test.step("every tab renders", async () => {
      for (const tab of ADMIN_TABS) {
        await page.goto(`/admin?tab=${tab}`);
        await page.waitForTimeout(800);
        await expect(page.locator("h1").first()).toHaveText("Bonjour, administrateur.");
        await expect(page.locator(".admin-rail a[aria-current=page]").first()).toHaveText(ADMIN_LABELS[tab]!);
      }
    });

    const previous = (await api(request, admin, "GET", "/admin/users?q=Ilunga&limit=5")).body.items ?? [];
    for (const row of previous.filter((u: any) => u.email === ACCOUNTS.suspendedProvider && (u.suspendedAt || u.isActive === false))) {
      await api(request, admin, "PATCH", `/admin/users/${row.id}`, { suspended: false });
    }
    const suspended = await testSession(request, { email: ACCOUNTS.suspendedProvider });
    const meResponse = await api(request, suspended, "GET", "/me");
    expect(meResponse.status, JSON.stringify(meResponse.body).slice(0, 200)).toBe(200);
    const suspendedUser = meResponse.body.user;
    await test.step("suspend a user", async () => {
      await page.goto(`/admin?tab=users&q=${encodeURIComponent(suspendedUser.lastName)}`);
      await expect(page.getByText(suspendedUser.lastName).first()).toBeAttached();
      await expect(page.getByRole("button", { name: "Suspendre" })).toHaveCount(1);
      await tap(page.getByRole("button", { name: "Suspendre" }));
      const dialog = page.getByRole("dialog").last();
      await dialog.getByLabel(/Motif/).fill("Suspension e2e du workstream 10.");
      await tap(dialog.getByRole("button", { name: "Suspendre" }));
      await toast(page, "Membre suspendu");
      const me = await api(request, suspended, "GET", "/me");
      expect(me.status).toBe(403);
      expect(me.body.code).toBe("ACCOUNT_SUSPENDED");
      const search = (await api(request, null, "GET", `/providers?q=${encodeURIComponent(suspendedUser.lastName)}&limit=10`)).body;
      expect(search.items.some((p: any) => p.ownerId === suspendedUser.id)).toBe(false);
    });

    await test.step("resolve the report", async () => {
      await page.goto("/admin?tab=reports");
      await tap(page.getByRole("button", { name: "Marquer comme examiné" }).first());
      const dialog = page.getByRole("dialog").last();
      await dialog.getByLabel("Résolution").fill("Examiné par le smoke e2e.");
      await tap(dialog.getByRole("button", { name: "Marquer examiné" }));
      await toast(page, "Signalement marqué comme examiné");
    });

    await test.step("edit the hero title", async () => {
      await page.goto("/admin?tab=content");
      const title = page.getByLabel("Titre", { exact: true }).first();
      const original = await title.inputValue();
      const marker = `Titre e2e ${Date.now().toString(36)}`;
      await title.fill(marker);
      await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
      await toast(page, "Modifications enregistrées");
      await settle(page, "/");
      await expect(page.locator("h1").first()).toContainText(marker);
      await page.goto("/admin?tab=content");
      await page.getByLabel("Titre", { exact: true }).first().fill(original);
      await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
      await toast(page, "Modifications enregistrées");
    });

    await test.step("approve a place suggestion", async () => {
      const client = await testSession(request, { email: ACCOUNTS.client });
      const gombe = (await api(request, admin, "GET", "/admin/places?q=Gombe&kind=COMMUNE&limit=1")).body.items[0];
      const suggested = await api(request, client, "POST", "/places/suggestions", { kind: "QUARTIER", label: `Quartier e2e ${Date.now().toString(36)}`, parentId: gombe.id });
      expect([200, 201], JSON.stringify(suggested.body)).toContain(suggested.status);
      await page.goto("/admin?tab=references&sub=places");
      await tap(page.getByRole("button", { name: "Examiner" }).first());
      // The references tab overflows at 390 px (defect handed to 08) and a label overlaps the button.
      await tap(page.getByRole("button", { name: "Approuver la proposition" }));
      await toast(page, "Proposition approuvée");
    });

    const restore = await api(request, admin, "PATCH", `/admin/users/${suspendedUser.id}`, { suspended: false });
    expect(restore.status).toBe(200);
  });
});

test.describe("8b. admin overflow @flows", () => {
  // Known defect handed to workstream 08: categories and references overflow at 390 px.
  // Remove the `test.fail` once 08 fixes them; Playwright then reports the unexpected pass.
  test("every admin section fits the mobile viewport", async ({ page, context, request }) => {
    test.fail(true, "08 defect: admin ?tab=categories and ?tab=references overflow horizontally at 390 px");
    await markOnboarded(context);
    await signIn(context, await testSession(request, { email: ACCOUNTS.admin }));
    const width = test.info().project.use.viewport!.width;
    const overflowing: string[] = [];
    for (const tab of ADMIN_TABS) {
      await page.goto(`/admin?tab=${tab}`);
      await expect(page.locator("h1").first()).toHaveText("Bonjour, administrateur.");
      await page.waitForTimeout(600);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      if (scrollWidth > width) overflowing.push(`${tab} (${scrollWidth}px)`);
    }
    expect(overflowing, overflowing.join(", ")).toEqual([]);
  });
});

test.describe("9. notifications @flows", () => {
  test("lists the events and read-all clears the badge", async ({ page, context, request }) => {
    await markOnboarded(context);
    const client = await testSession(request, { email: ACCOUNTS.client });
    await signIn(context, client);
    const before = (await api(request, client, "GET", "/notifications?limit=1")).body;
    expect(before.unreadCount).toBeGreaterThan(0);
    await settle(page, "/notifications");
    await expect(page.locator("main li").first()).toBeVisible();
    await expect(page.locator("main")).toContainText(/Confirmée|confirmée|terminée|Terminée|message/i);
    await tap(page.getByRole("button", { name: "Tout marquer lu" }));
    await expect.poll(async () => (await api(request, client, "GET", "/notifications?limit=1")).body.unreadCount).toBe(0);
    await expect(page.getByText("Non lue")).toHaveCount(0);
  });
});

test.describe("10. account @flows", () => {
  test("update bio and place, delete the new provider, sign in again as a fresh CLIENT", async ({ page, context, request }) => {
    test.setTimeout(180_000);
    await markOnboarded(context);
    const { newPhone, newProviderId } = readState();
    expect(newPhone && newProviderId, "scenario 6 left a phone and a provider id").toBeTruthy();
    const session = await testSession(request, { phone: newPhone! });
    await signIn(context, session);
    const me = (await api(request, session, "GET", "/me")).body.user;
    const oldId = me.id;
    expect(me.provider?.id ?? me.providerId, "the new provider still exists").toBe(newProviderId);

    await settle(page, "/compte");
    const accept = page.getByRole("button", { name: "J'accepte et je continue" });
    if (await accept.isVisible({ timeout: 3_000 }).catch(() => false)) await accept.click();
    const marker = `Bio e2e ${Date.now().toString(36)}`;
    await page.getByRole("textbox", { name: "Bio" }).fill(marker);
    // "Pays" also names the plain country select; the place cascade selects come first in the DOM.
    for (const label of ["Pays", "Province", "Ville"]) {
      const select = page.getByRole("combobox", { name: label, exact: true }).first();
      await page.waitForTimeout(600);
      if ((await select.count()) === 0) continue;
      const options = await select.locator("option").count();
      if (options < 2) continue;
      await select.selectOption({ index: Math.min(2, options - 1) }, { timeout: 5_000 });
    }
    await tap(page.getByRole("button", { name: "Enregistrer" }).first());
    await toast(page, "Profil mis à jour");
    const updated = (await api(request, session, "GET", "/me")).body.user;
    expect(updated.bio).toBe(marker);
    expect(updated.placeId ?? updated.place?.id).toBeTruthy();

    await tap(page.getByRole("button", { name: "Supprimer mon compte" }));
    await page.getByLabel(/Tapez SUPPRIMER/).fill("SUPPRIMER");
    await tap(page.getByRole("button", { name: "Supprimer définitivement" }));
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "/bienvenue", { timeout: 20_000 });

    const again = await testSession(request, { phone: newPhone! });
    const fresh = (await api(request, again, "GET", "/me")).body.user;
    expect(fresh.role).toBe("CLIENT");
    expect(fresh.id).not.toBe(oldId);
    expect(fresh.provider ?? null).toBeNull();
  });
});

test.describe("11. reduced motion @reduced", () => {
  test("dock indicator and screen-enter wrapper have no transition", async ({ page, context }) => {
    await markOnboarded(context);
    await settle(page, "/rechercher");
    const moving = await page.evaluate(() => {
      const seconds = (value: string) => value.split(",").map((part) => parseFloat(part) || 0);
      const targets = [...document.querySelectorAll(".mobile-dock, .mobile-dock *, .screen-enter")];
      return targets
        .filter((el) => {
          const style = getComputedStyle(el);
          return seconds(style.transitionDuration).some((v) => v > 0) || seconds(style.animationDuration).some((v) => v > 0);
        })
        .map((el) => `${el.tagName.toLowerCase()}.${String((el as HTMLElement).className).split(" ")[0]}`);
    });
    expect(moving, moving.join(", ")).toEqual([]);
  });
});

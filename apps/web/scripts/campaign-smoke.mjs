#!/usr/bin/env node
// Campaign-mode smoke for /launch* (workstream 09, handed to 10).
//   record:  node scripts/campaign-smoke.mjs --base http://localhost:3009 --out before.json --phones 812345670 823456781
//            [--failure-base http://localhost:3019] [--shots dir] [--no-submit] [--checks]
// --base must run in campaign mode against a backend with the launch intake and funnel flags on;
// --failure-base is the same build started with an unreachable BACKEND_URL (categories unavailable).
// Use fresh --phones per run: the intake limits repeated contacts per window.
//   compare: node scripts/campaign-smoke.mjs --compare before.json after.json
// Records, per form state, the DOM id/name inventory, the aria/role/data attributes of every
// element, the keyboard tab order and the funnel events (dataLayer pushes and collector bodies).
// With --checks it also asserts overflow at 320/390/1440, a visible focus indicator on every
// tab stop and no transitions under prefers-reduced-motion.
// Uses Playwright's bundled Chromium, or the installed Google Chrome with PW_CHANNEL=chrome.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

function parseArgs(argv) {
  const out = { base: "http://localhost:3009", failureBase: null, out: null, shots: null, phones: [], compare: [], submit: true, checks: false };
  let key = null;
  for (const arg of argv) {
    if (arg === "--no-submit") out.submit = false;
    else if (arg === "--checks") out.checks = true;
    else if (arg.startsWith("--")) key = arg.slice(2);
    else if (key === "phones") out.phones.push(arg);
    else if (key === "compare") out.compare.push(arg);
    else if (key === "failure-base") out.failureBase = arg;
    else if (key) out[key] = arg;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

if (args.compare.length === 2) {
  const [before, after] = await Promise.all(args.compare.map(async (file) => JSON.parse(await readFile(file, "utf8"))));
  let differences = 0;
  const diffList = (label, a = [], b = []) => {
    const same = a.length === b.length && a.every((item, index) => item === b[index]);
    if (same) return console.log(`same ${label} (${a.length})`);
    differences += 1;
    console.log(`DIFF ${label}`);
    const removed = a.filter((item) => !b.includes(item));
    const added = b.filter((item) => !a.includes(item));
    for (const item of removed) console.log(`  - ${item}`);
    for (const item of added) console.log(`  + ${item}`);
    if (removed.length === 0 && added.length === 0) console.log("  (same items, different order)");
  };
  for (const state of Object.keys(before.states)) {
    const a = before.states[state];
    const b = after.states[state];
    if (!b) {
      differences += 1;
      console.log(`DIFF ${state}: missing in after`);
      continue;
    }
    diffList(`${state} id/name inventory`, a.inventory, b.inventory);
    diffList(`${state} aria/role/data attributes`, a.semantics, b.semantics);
    diffList(`${state} tab order`, a.tabOrder, b.tabOrder);
  }
  for (const journey of Object.keys(before.events)) {
    diffList(`${journey} dataLayer events`, before.events[journey].dataLayer, after.events[journey]?.dataLayer);
    diffList(`${journey} collector events`, before.events[journey].collector, after.events[journey]?.collector);
  }
  console.log(differences === 0 ? "\nNo differences." : `\n${differences} difference(s).`);
  process.exit(differences === 0 ? 0 : 1);
}

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
const result = { base: args.base, recordedAt: new Date().toISOString(), states: {}, events: {}, checks: [] };
const failures = [];
const check = (name, ok, detail = "") => {
  result.checks.push({ name, ok, detail });
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(name);
};

async function newPage(width, reducedMotion = false) {
  const context = await browser.newContext({
    viewport: { width, height: width < 640 ? 844 : 900 },
    deviceScaleFactor: 1,
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
    isMobile: width < 640,
    hasTouch: width < 640,
  });
  const page = await context.newPage();
  const collector = [];
  page.on("request", (request) => {
    if (!request.url().includes("/api/launch/funnel-events")) return;
    try {
      const body = JSON.parse(request.postData() ?? "{}");
      const attribution = body.attribution ? JSON.stringify(body.attribution) : undefined;
      collector.push(describeEvent({ ...body, attribution }, ["eventName", "leadType", "validationField", "validationErrorCode", "deviceClass", "attribution"]));
    } catch {
      collector.push("unparseable");
    }
  });
  return { context, page, collector };
}

function describeEvent(body, keys) {
  return keys.filter((key) => body[key] !== undefined).map((key) => `${key}=${body[key]}`).join(" ");
}

async function snapshot(page, name) {
  // focusFirstError and the attribution effect both land a frame later.
  await page.waitForTimeout(350);
  const data = await page.evaluate(() => {
    const skip = (el) => el.closest("script, style, template, next-route-announcer, nextjs-portal, head");
    const describe = (el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${el.getAttribute("name") ? `[name=${el.getAttribute("name")}]` : ""}`;
    const inventory = [...document.body.querySelectorAll("[id],[name]")].filter((el) => !skip(el)).map(describe);
    const semantics = [...document.body.querySelectorAll("*")]
      .filter((el) => !skip(el))
      .flatMap((el) => {
        const attrs = [...el.attributes]
          .filter(({ name }) => name.startsWith("aria-") || name.startsWith("data-") || ["role", "tabindex", "for", "type", "href", "target", "rel", "autocomplete", "inputmode", "maxlength", "value", "disabled", "placeholder", "rows"].includes(name))
          .map(({ name, value }) => `${name}=${value}`)
          .sort();
        if (attrs.length === 0) return [];
        // Decorative icons are allowed to change with the restyle; everything else must not.
        if (el.tagName.toLowerCase() === "svg" && attrs.every((attr) => attr === "aria-hidden=true")) return [];
        return [`${describe(el)} ${attrs.join(" ")}`];
      });
    return { inventory, semantics };
  });
  const tabOrder = await tabStops(page);
  result.states[name] = { ...data, tabOrder: tabOrder.map((stop) => stop.label) };
  if (args.checks) {
    const invisible = tabOrder.filter((stop) => !stop.visibleFocus).map((stop) => stop.label);
    check(`${name}: focus indicator on ${tabOrder.length} tab stops`, invisible.length === 0, invisible.join(", "));
  }
  return data;
}

async function tabStops(page) {
  await page.evaluate(() => {
    document.activeElement?.blur?.();
    window.getSelection()?.removeAllRanges();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    window.__smokeSeen = new WeakSet();
  });
  await page.mouse.click(1, 1);
  const stops = [];
  for (let index = 0; index < 80; index += 1) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || window.__smokeSeen.has(el)) return null;
      window.__smokeSeen.add(el);
      const text = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || "").replace(/\s+/g, " ").trim().slice(0, 40);
      const label = `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${el.getAttribute("name") ? `[name=${el.getAttribute("name")}]` : ""}${el.getAttribute("type") ? `[type=${el.getAttribute("type")}]` : ""} "${text}"`;
      const style = getComputedStyle(el);
      const outline = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2 && style.outlineColor !== "rgba(0, 0, 0, 0)";
      const field = el.closest(".field");
      const ring = field ? getComputedStyle(field).boxShadow !== "none" : false;
      return { label, visibleFocus: outline || ring };
    });
    if (!stop) break;
    stops.push(stop);
  }
  return stops;
}

async function events(page, collector, journey) {
  await page.waitForTimeout(400);
  const dataLayer = await page.evaluate(() =>
    (window.dataLayer ?? []).map((payload) =>
      ["event", "leadType", "field", "errorCode", "source", "medium", "campaign", "content", "deviceClass"]
        .filter((key) => payload[key] !== undefined)
        .map((key) => `${key}=${payload[key]}`)
        .join(" "),
    ),
  );
  result.events[journey] = { dataLayer, collector: [...collector] };
}

async function shot(page, name) {
  if (!args.shots) return;
  await page.screenshot({ path: path.join(args.shots, `${name}.png`), fullPage: true });
}

async function fillStepOne(page, phone, communeIndex = 1) {
  await page.fill("#firstName", "Amani");
  await page.fill("#phone", phone);
  await page.locator("#phone").blur();
  await page.selectOption("#subcategoryId", { index: 1 });
  await page.selectOption("#commune", { index: communeIndex });
}

async function continueToStepTwo(page) {
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.waitForSelector("text=Finalisez votre préinscription gratuite");
}

async function openOptional(page) {
  const details = page.locator("#interest-form details");
  if (!(await details.evaluate((el) => el.open))) await details.locator("summary").click();
}

const submitButton = (page) => page.locator('#interest-form button[type="submit"]');

try {
  if (args.shots) await mkdir(args.shots, { recursive: true });
  const [providerPhone, clientPhone] = args.phones.length === 2 ? args.phones : ["812345670", "823456781"];

  // Provider journey from the neutral landing, then the cross-role switch from the success state.
  {
    const { context, page, collector } = await newPage(1440);
    await page.goto(`${args.base}/launch?utm_source=facebook&utm_medium=social&utm_campaign=kyou09`, { waitUntil: "networkidle" });
    await snapshot(page, "landing");
    await page.getByRole("button", { name: /Je propose mes services/ }).click();
    await page.waitForSelector("#interest-form form");
    await snapshot(page, "provider-step1");
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.waitForSelector("#firstName-error");
    await snapshot(page, "provider-step1-errors");
    await fillStepOne(page, `0${providerPhone}`);
    await continueToStepTwo(page);
    await snapshot(page, "provider-step2");
    await submitButton(page).click();
    await page.waitForSelector("#operationalConsent-error");
    await snapshot(page, "provider-step2-errors");
    await page.check("#experienceBand");
    await openOptional(page);
    await page.fill("#email", "amani.smoke@example.cd");
    await page.getByLabel("Ce numéro utilise WhatsApp").check();
    await page.fill("#summary", "Plomberie et petites réparations.");
    await page.getByLabel(/nouvelles du lancement/).check();
    await page.check("#operationalConsent");
    await snapshot(page, "provider-step2-filled");
    if (args.submit) {
      await submitButton(page).click();
      await page.waitForSelector("#campaign-confirmation", { timeout: 15000 });
      await snapshot(page, "provider-accepted");
      await shot(page, "provider-accepted-1440");
      await page.getByRole("button", { name: "Je cherche aussi un service" }).click();
      await page.waitForSelector("text=Préparez votre première recherche");
      await snapshot(page, "client-step1-after-provider");
    }
    await events(page, collector, "provider");
    await context.close();
  }

  // Client journey on /launch/clients, including "Retour".
  {
    const { context, page, collector } = await newPage(1440);
    await page.goto(`${args.base}/launch/clients?utm_source=whatsapp&utm_campaign=kyou09`, { waitUntil: "networkidle" });
    await snapshot(page, "client-step1");
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.waitForSelector("#phone-error");
    await snapshot(page, "client-step1-errors");
    await fillStepOne(page, `+243${clientPhone}`, 2);
    await continueToStepTwo(page);
    await snapshot(page, "client-step2");
    await page.getByRole("button", { name: "Retour" }).click();
    await page.waitForSelector("text=Préparez votre première recherche");
    check("client: Retour keeps the step-one values", (await page.inputValue("#firstName")) === "Amani");
    await continueToStepTwo(page);
    await submitButton(page).click();
    await page.waitForSelector("#timing-error");
    await snapshot(page, "client-step2-errors");
    await page.check("#timing");
    await openOptional(page);
    await page.check('input[name="preferredContact"][value="WHATSAPP"]');
    await page.fill("#summary", "Fuite sous l’évier.");
    await page.check("#operationalConsent");
    await snapshot(page, "client-step2-filled");
    if (args.submit) {
      await submitButton(page).click();
      await page.waitForSelector("#campaign-confirmation", { timeout: 15000 });
      await snapshot(page, "client-accepted");
    }
    await events(page, collector, "client");
    await context.close();
  }

  // Duplicate provider submission with the same phone.
  if (args.submit) {
    const { context, page, collector } = await newPage(390);
    await page.goto(`${args.base}/launch/providers`, { waitUntil: "networkidle" });
    await fillStepOne(page, `+243 ${providerPhone.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")}`);
    await continueToStepTwo(page);
    await page.check("#experienceBand");
    await page.check("#operationalConsent");
    await submitButton(page).click();
    await page.waitForSelector("#campaign-confirmation", { timeout: 15000 });
    await snapshot(page, "provider-duplicate-accepted");
    await shot(page, "provider-accepted-390");
    await events(page, collector, "provider-duplicate");
    await context.close();
  }

  // Privacy notice.
  {
    const { context, page } = await newPage(1440);
    await page.goto(`${args.base}/launch/confidentialite`, { waitUntil: "networkidle" });
    await snapshot(page, "privacy");
    const text = await page.textContent("body");
    const version = /Version (campaign-\d{4}-\d{2}-\d{2})/.exec(text ?? "")?.[1] ?? null;
    const mailto = await page.getAttribute('a[href^="mailto:"]', "href");
    result.privacy = { version, mailto };
    check("privacy: notice version and mailto", version === "campaign-2026-07-25" && mailto === "mailto:confidentialite@kayou.cd", `${version} ${mailto}`);
    await context.close();
  }

  // Categories unavailable (a server whose BACKEND_URL is unreachable).
  if (args.failureBase) {
    const { context, page } = await newPage(390);
    await page.goto(`${args.failureBase}/launch/providers`, { waitUntil: "networkidle" });
    await snapshot(page, "provider-step1-no-categories");
    check("no categories: select and Continuer disabled", (await page.isDisabled("#subcategoryId")) && (await page.getByRole("button", { name: "Continuer" }).isDisabled()));
    await shot(page, "no-categories-390");
    await context.close();
  }

  if (args.checks) {
    for (const width of [320, 390, 1440]) {
      for (const route of ["/launch", "/launch/clients", "/launch/providers", "/launch/confidentialite"]) {
        const { context, page } = await newPage(width);
        await page.goto(`${args.base}${route}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(200);
        // Mobile emulation widens innerWidth to fit overflowing content, so compare with the requested width.
        const overflow = await page.evaluate((viewport) => document.documentElement.scrollWidth - viewport, width);
        check(`overflow ${width}px ${route}`, overflow <= 0, `scrollWidth - ${width} = ${overflow}`);
        const name = route === "/launch" ? "launch" : route.slice(1).replace(/\//g, "-");
        await shot(page, `${name}-${width}`);
        if (route !== "/launch/confidentialite") {
          if (route === "/launch") {
            await page.getByRole("button", { name: /Je propose mes services/ }).click();
            await page.waitForSelector("#interest-form form");
          }
          await fillStepOne(page, "856781234");
          await continueToStepTwo(page);
          await openOptional(page);
          await page.waitForTimeout(200);
          const stepTwoOverflow = await page.evaluate((viewport) => document.documentElement.scrollWidth - viewport, width);
          check(`overflow ${width}px ${route} step 2`, stepTwoOverflow <= 0, `scrollWidth - ${width} = ${stepTwoOverflow}`);
          if (route !== "/launch") await shot(page, `${name}-step2-${width}`);
        }
        await context.close();
      }
    }

    const { context, page } = await newPage(390, true);
    await page.goto(`${args.base}/launch/providers`, { waitUntil: "networkidle" });
    await fillStepOne(page, "856781234");
    await continueToStepTwo(page);
    await openOptional(page);
    const moving = await page.evaluate(() =>
      [...document.querySelectorAll(".k-campaign *")]
        .filter((el) => {
          const style = getComputedStyle(el);
          const seconds = (value) => value.split(",").map((part) => parseFloat(part) || 0);
          const transitions = style.transitionProperty !== "none" && seconds(style.transitionDuration).some((value) => value > 0);
          const animations = style.animationName !== "none" && seconds(style.animationDuration).some((value) => value > 0);
          return transitions || animations;
        })
        .map((el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}.${String(el.className.baseVal ?? el.className).split(" ")[0]}`),
    );
    check("reduced motion: no transition or animation inside .k-campaign on step 2", moving.length === 0, moving.slice(0, 8).join(", "));
    const scrollBehavior = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
    check("reduced motion: html scroll-behavior auto", scrollBehavior === "auto", scrollBehavior);
    await context.close();
  }
} finally {
  await browser.close();
}

if (args.out) {
  await writeFile(args.out, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`\nrecorded ${Object.keys(result.states).length} states → ${args.out}`);
}
if (failures.length > 0) {
  console.log(`\n${failures.length} check(s) failed`);
  process.exit(1);
}

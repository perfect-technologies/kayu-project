#!/usr/bin/env node
// Opens each URL at each viewport width and fails when the document overflows horizontally.
//   node scripts/overflow-check.mjs --urls / /rechercher --widths 320 390 1440 [--base http://localhost:3000]
//   [--shots dir] saves a full-page PNG per URL × width; [--reduced-motion] emulates the OS preference.
// Uses Playwright's bundled Chromium, or the installed Google Chrome with PW_CHANNEL=chrome.

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

function parseArgs(argv) {
  const out = { urls: [], widths: [], base: process.env.OVERFLOW_BASE_URL ?? "http://localhost:3000", shots: null, reducedMotion: false };
  let key = null;
  for (const arg of argv) {
    if (arg === "--reduced-motion") {
      out.reducedMotion = true;
      key = null;
    } else if (arg.startsWith("--")) {
      key = arg.slice(2);
    } else if (key === "urls") out.urls.push(arg);
    else if (key === "widths") out.widths.push(Number(arg));
    else if (key === "base") out.base = arg;
    else if (key === "shots") out.shots = arg;
  }
  if (out.urls.length === 0) out.urls = ["/"];
  if (out.widths.length === 0) out.widths = [320, 390, 1440];
  return out;
}

const args = parseArgs(process.argv.slice(2));
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
const failures = [];

try {
  if (args.shots) await mkdir(args.shots, { recursive: true });
  for (const width of args.widths) {
    const context = await browser.newContext({
      viewport: { width, height: width < 640 ? 844 : 900 },
      deviceScaleFactor: 1,
      reducedMotion: args.reducedMotion ? "reduce" : "no-preference",
      isMobile: width < 640,
      hasTouch: width < 640,
    });
    const page = await context.newPage();
    for (const url of args.urls) {
      await page.goto(new URL(url, args.base).toString(), { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      const ok = scrollWidth <= innerWidth;
      console.log(`${ok ? "ok  " : "FAIL"} ${String(width).padStart(4)}px ${url} (scrollWidth ${scrollWidth}, innerWidth ${innerWidth})`);
      if (!ok) failures.push({ url, width, scrollWidth, innerWidth });
      if (args.shots) {
        const name = `${url === "/" ? "home" : url.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-")}-${width}.png`;
        await page.screenshot({ path: path.join(args.shots, name), fullPage: true });
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(`\n${failures.length} viewport(s) overflow horizontally.`);
  process.exit(1);
}

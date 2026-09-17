import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const startServers = process.env.E2E_START_SERVERS === "true";
const mobile = (width: number) => ({
  ...devices["Pixel 7"],
  viewport: { width, height: 844 },
  deviceScaleFactor: 1,
  defaultBrowserType: "chromium" as const,
});
const desktop = { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "fr-CD",
    timezoneId: "Africa/Kinshasa",
  },
  projects: [
    { name: "mobile-320", use: mobile(320), grep: /@viewports/ },
    { name: "mobile-390", use: mobile(390), grep: /@viewports|@public|@flows/ },
    { name: "desktop-1440", use: desktop, grep: /@viewports/ },
    { name: "reduced-motion", use: { ...mobile(390), reducedMotion: "reduce" }, grep: /@viewports|@reduced/ },
  ],
  webServer: startServers
    ? [
        {
          command: "node apps/backend/dist/main.js",
          cwd: "../..",
          url: "http://localhost:3001/api/health",
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: "pnpm --filter @kayu/web start",
          cwd: "../..",
          url: baseURL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ]
    : undefined,
});

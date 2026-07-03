import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright interaction tests for the Campaign Canvas UI.
 * A test is added alongside each canvas interaction as it is built.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.CANVAS_BASE_URL ?? "http://localhost:3003",
    trace: "on-first-retry",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Next 16 enforces a single dev server per project dir. Reuse the running
  // dev server; only start one if none is up (falls back to port 3003).
  webServer: {
    command: "npm run dev -- -p 3003",
    url: "http://localhost:3003",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

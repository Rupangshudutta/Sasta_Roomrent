import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
// Optional: point at a system Chromium instead of the Playwright-managed download
// (useful in sandboxes without network access to the browser CDN).
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
  // When PLAYWRIGHT_BASE_URL points at a deployed site, no local server is started.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run start",
        // Readiness is the home page, not /api/health: health deliberately returns 503 when
        // the database is unreachable, which Playwright would treat as "not ready".
        url: `${baseURL}/`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});

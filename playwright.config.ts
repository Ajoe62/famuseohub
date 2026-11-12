import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * End-to-end tests against a dev server with a freshly seeded, separate PGlite database.
 * If `npx playwright install chromium` is blocked on your network, use an installed browser:
 *   PW_CHANNEL=chrome npm run test:e2e   (or msedge)
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1, // Tests share one seeded database and run as a story.
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    channel: process.env.PW_CHANNEL || undefined,
  },
  // Runs a production build, so the tests exercise production cookie settings
  // (Secure; SameSite=None; Partitioned) and avoid slow dev compiles.
  webServer: {
    command: `npm run db:setup && npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/launch-required`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      PGLITE_DIR: ".data/e2e",
      ENABLE_DEV_LOGIN: "true",
      SESSION_SECRET: "e2e-only-secret-not-for-production-0123456789",
    },
  },
});

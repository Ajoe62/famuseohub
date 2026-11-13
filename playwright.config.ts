import { defineConfig, devices } from "@playwright/test";
import { PLATFORM } from "./e2e/fake-platform";
import { generateToolKeyPem } from "./lib/lti/keys";

const PORT = 3100;
// Throwaway tool key for the production-mode test server (production requires LTI_PRIVATE_KEY).
const E2E_TOOL_KEY = generateToolKeyPem();

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
  // In CI, also write an HTML report (uploaded as an artifact when a test fails).
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    channel: process.env.PW_CHANNEL || undefined,
  },
  // Runs a production build, so the tests exercise production cookie settings
  // (Secure; SameSite=None; Partitioned) and avoid slow dev compiles.
  webServer: {
    // Seeds sample data and registers the fake platform from e2e/fake-platform.ts.
    command: [
      "npm run db:setup",
      `npm run lti:register -- --name E2E --issuer ${PLATFORM.issuer} --client-id ${PLATFORM.clientId}` +
        ` --auth-url ${PLATFORM.origin}/auth --token-url ${PLATFORM.origin}/token --jwks-url ${PLATFORM.origin}/jwks` +
        ` --deployment-id ${PLATFORM.deploymentId}`,
      "npx next build",
      `npx next start -p ${PORT}`,
    ].join(" && "),
    url: `http://localhost:${PORT}/launch-required`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      // Empty (not unset) so .env.local can't point the tests at a hosted database: they reset it.
      DATABASE_URL: "",
      DATABASE_URL_UNPOOLED: "",
      PGLITE_DIR: ".data/e2e",
      ENABLE_DEV_LOGIN: "true",
      CRON_SECRET: "e2e-cron-secret",
      SESSION_SECRET: "e2e-only-secret-not-for-production-0123456789",
      APP_URL: `http://localhost:${PORT}`,
      FRAME_ANCESTORS: `'self' ${PLATFORM.origin}`,
      LTI_PRIVATE_KEY: E2E_TOOL_KEY,
    },
  },
});

import { expect, test } from "@playwright/test";
import { PLATFORM, startFakePlatform } from "./fake-platform";

test.describe.configure({ mode: "serial" });

const APP = "http://localhost:3100";
let platform: Awaited<ReturnType<typeof startFakePlatform>>;

test.beforeAll(async () => {
  platform = await startFakePlatform(APP);
});
test.afterAll(async () => {
  await platform?.close();
});

test("student launches inside the Canvas iframe (cross-site)", async ({ page }) => {
  await page.goto(`${PLATFORM.origin}/course?user=student-1`);
  const tool = page.frameLocator("#tool");
  // Full OIDC round trip inside a cross-site iframe, ending signed in on the student hub.
  await expect(tool.getByRole("heading", { name: "FAMU-SOE Capstone and Lab Hub" })).toBeVisible();
  await expect(tool.getByText("Morgan Ellis")).toBeVisible();
  await expect(tool.getByText("EVR 4910 Capstone (E2E) • Spring 2027")).toBeVisible();
  await expect(tool.getByText("Choose your capstone track")).toBeVisible();

  // The session works for later requests inside the iframe (server action → partitioned cookie).
  await tool.getByRole("button", { name: /Project Capstone Track/ }).click();
  await expect(tool.getByText("Stage 1: Topic Selection")).toBeVisible();
});

test("instructor launch lands on the advisor queue and sees the student", async ({ page }) => {
  await page.goto(`${PLATFORM.origin}/course?user=instructor-1`);
  const tool = page.frameLocator("#tool");
  await expect(tool.getByRole("heading", { name: "Faculty Advisor Approval Queue" })).toBeVisible();
  await expect(tool.getByRole("link", { name: "Morgan Ellis" })).toBeVisible();
  // Seeded sandbox-course students are in a different course and must not appear.
  await expect(tool.getByText("Jordan Rivers")).toHaveCount(0);
});

test("observers are turned away with a clear message", async ({ page }) => {
  await page.goto(`${PLATFORM.origin}/course?user=observer-1`);
  const tool = page.frameLocator("#tool");
  await expect(tool.getByText("available to students and instructors of this course only")).toBeVisible();
});

test("a launch with an unknown state is rejected", async ({ page }) => {
  // (Replaying a real, already-used state is covered in lib/lti/launch.test.ts.)
  const res = await page.request.post(`${APP}/api/lti/launch`, { form: { id_token: "x.y.z", state: "used-or-bogus" }, maxRedirects: 0 });
  expect(res.status()).toBe(303);
  expect(res.headers().location).toContain("/launch-required?reason=invalid_state");
});

test("blocked cookies fall back to a single-use new-tab ticket", async ({ browser }) => {
  // Launch in one context and capture the landing URL (with its ticket)...
  const launchCtx = await browser.newContext();
  const launchPage = await launchCtx.newPage();
  let landing = "";
  launchPage.on("response", (r) => {
    const loc = r.headers().location;
    if (r.status() === 303 && loc?.includes("/lti/landing?t=")) landing = loc;
  });
  await launchPage.goto(platform.loginUrl("student-1"));
  await expect.poll(() => landing).not.toBe("");
  await launchCtx.close();

  // ...then open it in a context with no cookies, as if the iframe had dropped them.
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(landing);
  await expect(page.getByRole("heading", { name: "Continue to the Capstone Hub" })).toBeVisible();
  const [tab] = await Promise.all([ctx.waitForEvent("page"), page.getByRole("link", { name: "Open Capstone Hub in a new tab" }).click()]);
  await expect(tab.getByText("Morgan Ellis")).toBeVisible();

  // The ticket can't be used twice.
  const reuse = await ctx.newPage();
  await reuse.goto(landing.replace("/lti/landing?t=", "/api/lti/ticket?t="));
  await expect(reuse.getByText("The launch expired or was already used.")).toBeVisible();
  await ctx.close();
});

test("tool configuration and public keys are served", async ({ request }) => {
  const config = await (await request.get(`${APP}/api/lti/config`)).json();
  expect(config).toMatchObject({
    oidc_initiation_url: `${APP}/api/lti/login`,
    target_link_uri: `${APP}/api/lti/launch`,
    public_jwk_url: `${APP}/api/lti/jwks`,
  });
  expect(config.extensions[0].privacy_level).toBe("name_only");
  const jwks = await (await request.get(`${APP}/api/lti/jwks`)).json();
  expect(jwks.keys[0]).toMatchObject({ kty: "RSA", alg: "RS256", use: "sig" });
  expect(jwks.keys[0]).not.toHaveProperty("d"); // never the private part
  expect((await request.get(`${APP}/api/health`)).status()).toBe(200);
});

test("the cleanup cron requires its secret", async ({ request }) => {
  expect((await request.get(`${APP}/api/cron/cleanup`)).status()).toBe(401);
  expect((await request.get(`${APP}/api/cron/cleanup`, { headers: { Authorization: "Bearer wrong" } })).status()).toBe(401);
  const ok = await request.get(`${APP}/api/cron/cleanup`, { headers: { Authorization: "Bearer e2e-cron-secret" } });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toMatchObject({ ok: true, deleted: { ltiStates: expect.any(Number), rateLimits: expect.any(Number) } });
});

import { expect, test, type Page } from "@playwright/test";

// One story over the seeded sandbox data (see db/seed.ts). Tests run in order.
test.describe.configure({ mode: "serial" });

async function signInAs(page: Page, name: string) {
  await page.goto("/dev/login");
  await page.getByRole("button", { name: new RegExp(name) }).click();
  // The login page has its own h1, so wait until we've actually been redirected.
  await page.waitForURL((url) => !url.pathname.startsWith("/dev/login"));
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  await expectUniqueIds(page);
}

/** Duplicate ids break label/input wiring (and screen readers). Check on every page we land on. */
async function expectUniqueIds(page: Page) {
  const dups = await page.evaluate(() => {
    const seen: Record<string, number> = {};
    document.querySelectorAll("[id]").forEach((el) => (seen[el.id] = (seen[el.id] ?? 0) + 1));
    return Object.keys(seen).filter((id) => seen[id] > 1);
  });
  expect(dups).toEqual([]);
}

test("student logs lab hours with validation", async ({ page }) => {
  await signInAs(page, "Jordan Rivers");
  await expect(page.getByText("Verified: 28 / 50 hrs")).toBeVisible();
  await expect(page.getByText("pending advisor verification")).toBeVisible();

  await page.getByRole("tab", { name: /Log Lab Hours/ }).click();
  const form = page.locator("form", { has: page.getByRole("button", { name: "Log Hours for Approval" }) });
  await form.getByLabel("Date").fill("2026-11-10");
  await form.getByLabel("Hours Spent").fill("12");
  await form.getByLabel("Location / Lab Room").fill("SOE Lab 102");
  await form.getByLabel("Activity Description").fill("Heavy metal uptake assay");
  await form.getByRole("button", { name: "Log Hours for Approval" }).click();

  // Server-side validation error shown; the student's other input is kept.
  await expect(form.getByText("A single entry can't exceed 10 hours.")).toBeVisible();
  await expect(form.getByLabel("Location / Lab Room")).toHaveValue("SOE Lab 102");

  await form.getByLabel("Hours Spent").fill("2.5");
  await form.getByRole("button", { name: "Log Hours for Approval" }).click();
  await expect(page.getByRole("status").getByText(/Lab hours logged/)).toBeVisible();
  await expect(page.getByRole("cell", { name: "Heavy metal uptake assay" })).toBeVisible();
  await expect(form.getByLabel("Location / Lab Room")).toHaveValue("");
});

test("student cannot submit a locked stage", async ({ page }) => {
  await signInAs(page, "Jordan Rivers");
  await expect(page.getByText("Unlocks when Stage 2 is approved by your advisor.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit to Advisor" })).toHaveCount(0);
});

test("advisor approves the proposal and verifies hours", async ({ page }) => {
  await signInAs(page, "Dr. Casey Grant");
  await expect(page.getByRole("heading", { name: "Faculty Advisor Approval Queue" })).toBeVisible();

  const proposal = page.locator("article", { hasText: "Stage 2: Research Proposal" });
  // A revision request needs a comment.
  await proposal.getByRole("button", { name: "Request Revision" }).click();
  await expect(proposal.getByText("Add a comment explaining what needs to change.")).toBeVisible();
  await proposal.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByRole("status").getByText(/Approved/)).toBeVisible();
  await expect(page.locator("article", { hasText: "Stage 2: Research Proposal" })).toHaveCount(0);

  const entry = page.locator("article", { hasText: "Heavy metal uptake assay" });
  await entry.getByRole("button", { name: "Verify Hours" }).click();
  await expect(page.getByRole("status").getByText("Lab hours verified.")).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export verified hours (CSV)" }).click();
  const csv = await (await download).createReadStream();
  const chunks: Buffer[] = [];
  for await (const c of csv) chunks.push(c as Buffer);
  const text = Buffer.concat(chunks).toString("utf8");
  expect(text).toContain('"Jordan Rivers","2026-11-10","2.5"');
  expect(text).toContain('"Dr. Casey Grant"');
});

test("student sees the unlocked stage and notifications", async ({ page }) => {
  await signInAs(page, "Jordan Rivers");
  await expect(page.getByText("Verified: 30.5 / 50 hrs")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit to Advisor" })).toBeVisible();

  await page.getByRole("link", { name: /Notifications/ }).click();
  await expect(page.getByText("Stage 2: Research Proposal was approved. Stage 3 is now unlocked.")).toBeVisible();
  await page.getByRole("button", { name: "Mark all as read" }).click();
  await expect(page.getByRole("button", { name: "Mark all as read" })).toHaveCount(0);
});

test("advisors cannot open students assigned to someone else", async ({ page }) => {
  await signInAs(page, "Dr. Casey Grant");
  const href = await page.getByRole("link", { name: "Jordan Rivers" }).first().getAttribute("href");
  expect(href).toMatch(/^\/advisor\/students\//);

  await signInAs(page, "Dr. Robin Hale");
  await page.goto(href!);
  await expect(page.getByRole("heading", { name: "Not found" })).toBeVisible();

  // Students can't reach advisor pages; they're sent back to their own hub.
  await signInAs(page, "Avery Chen");
  await page.goto("/advisor");
  await expect(page).toHaveURL(/\/$/);
});

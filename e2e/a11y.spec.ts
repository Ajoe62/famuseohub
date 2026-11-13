import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Automated WCAG 2.1 AA checks (axe-core) on every page, for each role.
// Automated tools catch roughly a third of issues; a manual keyboard and screen-reader pass is still needed.
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function signInAs(page: Page, name: string) {
  await page.goto("/dev/login");
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/dev/login"));
}

async function expectNoViolations(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.map((n) => n.target.join(" ")).slice(0, 5).join("\n    ")}`);
  expect(summary, `${label}\n${summary.join("\n")}`).toEqual([]);
}

test("public pages", async ({ page }) => {
  await page.goto("/dev/login");
  await expectNoViolations(page, "dev login");
  await page.goto("/launch-required?reason=role_not_allowed");
  await expectNoViolations(page, "launch error");
  await page.goto("/does-not-exist");
  await expectNoViolations(page, "not found");
});

test("student pages", async ({ page }) => {
  await signInAs(page, "Jordan Rivers");
  await expectNoViolations(page, "student hub: capstone tab");
  await page.getByRole("tab", { name: /Log Lab Hours/ }).click();
  await expectNoViolations(page, "student hub: lab tab");

  // Error state: field errors must be announced and contrast-safe.
  await page.getByRole("button", { name: "Log Hours for Approval" }).click();
  await expect(page.getByText("Date is required.")).toBeVisible();
  await expectNoViolations(page, "lab form with errors");

  await page.goto("/notifications");
  await expectNoViolations(page, "notifications");

  await signInAs(page, "Taylor Brooks");
  await expectNoViolations(page, "track chooser");
});

test("advisor pages", async ({ page }) => {
  await signInAs(page, "Dr. Casey Grant");
  await expectNoViolations(page, "advisor queue");
  await page.getByRole("link", { name: "Jordan Rivers" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Jordan Rivers" })).toBeVisible();
  await expectNoViolations(page, "student detail");
});

test("keyboard: tabs and forms are reachable and operable", async ({ page }) => {
  await signInAs(page, "Jordan Rivers");
  const labTab = page.getByRole("tab", { name: /Log Lab Hours/ });
  await labTab.focus();
  await page.keyboard.press("Enter");
  await expect(labTab).toHaveAttribute("aria-selected", "true");

  // Every interactive control on the page is keyboard-focusable (no tabindex="-1" traps on controls).
  const unfocusable = await page.locator("button:visible, a[href]:visible, input:visible, select:visible, textarea:visible").evaluateAll(
    (els) => els.filter((el) => (el as HTMLElement).tabIndex < 0).map((el) => el.outerHTML.slice(0, 80)),
  );
  expect(unfocusable).toEqual([]);
});

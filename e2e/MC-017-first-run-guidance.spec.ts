import { test, expect } from "./fixtures";
import { open, step, upload, GEOJSON } from "./helpers";

test("MC-017 First-run guidance", async ({ page }) => {
  await open(page, "MC-017", "First-run guidance", { showGuidance: true });

  await step(page, "Step 1 of 3 — a new user is told what to do first", 2200);
  await expect(page.getByText("Start with your data", { exact: true })).toBeVisible();

  await step(page, "Its own Browse button — no hunting through the sidebar");
  await upload(page, GEOJSON);

  await step(page, "Step 2 appears on its own: data is in, go compose the sheet", 2400);
  await expect(page.getByText("Now compose the sheet", { exact: true })).toBeVisible();

  await step(page, "The prompt does the switch for you");
  await page.getByRole("button", { name: /Go to Layout/ }).click();
  await page.waitForTimeout(1600);

  await step(page, "Step 3 — pick a template", 2200);
  await expect(page.getByText("Pick a template", { exact: true })).toBeVisible();

  await step(page, "Apply one, and the guidance retires itself");
  await page.getByText("Peta Administrasi").first().click();
  await page.waitForTimeout(1800);
  await expect(page.getByText("Pick a template", { exact: true })).toHaveCount(0);
  await page.waitForTimeout(1400);

  await step(page, "Steps derive from real state — delete the layer and it resets");
  await page.getByRole("tab", { name: "Analysis" }).click();
  await page.waitForTimeout(800);
  await page.locator('button[title="Remove layer"]').first().click();
  await page.waitForTimeout(1600);
  await expect(page.getByText("Start with your data", { exact: true })).toBeVisible();

  await step(page, "Dismiss it — stored on the account, not a cookie");
  await page.locator('button[title="Dismiss"]').click();
  await page.waitForTimeout(1600);
  await expect(page.getByText("Start with your data", { exact: true })).toHaveCount(0);

  await step(page, "Reload — the account remembers, so it only ever runs once");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await expect(page.getByText("Start with your data", { exact: true })).toHaveCount(0);
  await step(page, "First-run guidance really is first-run", 2200);
});

import { test } from "./fixtures";
import { open, step, upload, toMode, toLayoutTab, GEOJSON } from "./helpers";

test("MC-010 Coordinate graticule", async ({ page }) => {
  await open(page, "MC-010", "Coordinate graticule");
  await upload(page, GEOJSON);
  await toMode(page, "Layout");
  await toLayoutTab(page, "Page");

  await step(page, "Turn the coordinate grid on");
  await page.locator("[role='switch']").first().click();
  await page.waitForTimeout(2000);

  await step(page, "Set a fixed interval of 0.1°");
  await page.locator('[data-slot="select-trigger"]').first().click();
  await page.getByRole("option", { name: "0.1°" }).click();
  await page.waitForTimeout(2000);

  await step(page, "Make the edge labels bigger");
  await page.locator('[data-slot="select-trigger"]').filter({ hasText: "px" }).first().click();
  await page.getByRole("option", { name: "16px" }).click();
  await page.waitForTimeout(2000);

  await step(page, "Turn the labels off, then the grid off", 1200);
  await page.locator("[role='switch']").nth(1).click();
  await page.waitForTimeout(1600);
  await page.locator("[role='switch']").first().click();
  await page.waitForTimeout(1600);
});

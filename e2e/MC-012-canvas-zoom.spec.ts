import { test } from "./fixtures";
import { open, step, upload, toMode, applyTemplate, GEOJSON } from "./helpers";

test("MC-012 Canvas zoom and fit-to-screen", async ({ page }) => {
  await open(page, "MC-012", "Canvas zoom and fit-to-screen");
  await upload(page, GEOJSON);
  await toMode(page, "Layout");
  await applyTemplate(page, "Peta Administrasi");

  await step(page, "The A4 sheet is auto-fitted to the viewport on arrival", 1800);

  await step(page, "Zoom in past 100%");
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Zoom in" }).click();
    await page.waitForTimeout(450);
  }
  await page.waitForTimeout(1200);

  await step(page, "Click the percentage to snap back to 100%");
  await page.locator('button[title="Reset to 100%"]').click();
  await page.waitForTimeout(1600);

  await step(page, "Zoom out");
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Zoom out" }).click();
    await page.waitForTimeout(450);
  }

  await step(page, "Fit — the whole page returns to view");
  await page.getByRole("button", { name: "Fit page to screen" }).click();
  await page.waitForTimeout(2200);
});

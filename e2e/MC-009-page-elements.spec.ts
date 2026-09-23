import { test } from "./fixtures";
import { open, step, upload, toMode, dragSlider, GEOJSON } from "./helpers";

test("MC-009 Page elements and properties", async ({ page }) => {
  await open(page, "MC-009", "Page elements and properties");
  await upload(page, GEOJSON);
  await toMode(page, "Layout");

  await step(page, "Add a title, then a legend, north arrow and scale bar");
  for (const el of ["Title", "Legend", "North", "Scale"]) {
    await page.getByRole("button", { name: el, exact: true }).click();
    await page.waitForTimeout(700);
  }

  await step(page, "Select the title and retype it");
  await page.locator("aside").getByText("Title", { exact: true }).last().click();
  await page.waitForTimeout(600);
  const input = page.locator("aside input[type='text'], aside input:not([type])").first();
  await input.fill("PETA WILAYAH STUDI");
  await page.waitForTimeout(1400);

  await step(page, "Change its font size from the dropdown");
  await page.locator('[data-slot="select-trigger"]').filter({ hasText: "px" }).first().click();
  await page.getByRole("option", { name: "36px" }).click();
  await page.waitForTimeout(1600);

  await step(page, "Rotate the north arrow");
  await page.locator("aside").getByText("North arrow").last().click();
  await page.waitForTimeout(600);
  await dragSlider(page, page.locator("aside [data-slot='slider-thumb']").first(), 60);
  await page.waitForTimeout(1200);
});

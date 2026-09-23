import { test, expect } from "./fixtures";
import { open, step, upload, toMode, applyTemplate, regionRows, GEOJSON } from "./helpers";

test("MC-022 Legend auto-populated from layers", async ({ page }) => {
  await open(page, "MC-022", "Legend auto-populated from layers");
  await upload(page, GEOJSON);

  await step(page, "Colour the layer by kota name first");
  const card = page.locator("aside .rounded-lg.border").first();
  await card.locator('[data-slot="select-trigger"]').first().click();
  await page.getByRole("option", { name: "nama" }).click();
  await page.waitForTimeout(2000);

  await toMode(page, "Layout");
  await applyTemplate(page, "Peta Administrasi");

  await step(page, "The template legend still has its placeholder entries", 2200);

  await step(page, "Select the template's legend in the info column");
  // Scoped to the region: an unscoped "Legend" also matches the Add-element
  // button, which would create a second legend instead of selecting this one.
  await regionRows(page, "Info column").getByText("Legend", { exact: true }).click();
  await page.waitForTimeout(1000);

  await step(page, "Fill from layers — no retyping what is already in the data");
  await page.getByRole("button", { name: /Fill from layers/ }).click();
  await page.waitForTimeout(2400);

  await step(page, "The template legend now lists every kota, in its map colour", 2800);
  await expect(page.locator("#print-page").getByText("Jakarta Selatan")).toBeVisible();
  await expect(page.locator("#print-page").getByText("Batas Wilayah")).toHaveCount(0);
});

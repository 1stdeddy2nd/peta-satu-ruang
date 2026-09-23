import { test } from "./fixtures";
import { open, step, upload, dragSlider, GEOJSON, KML } from "./helpers";

test("MC-004 Layer manager", async ({ page }) => {
  await open(page, "MC-004", "Layer manager");
  await upload(page, GEOJSON, KML);

  const first = page.locator("aside .rounded-lg.border").first();

  await step(page, "Recolour a layer — fill and stroke update live");
  await first.locator('input[type="color"]').evaluate((el: HTMLInputElement) => {
    el.value = "#dc2626";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(1200);

  await step(page, "Drop its opacity to ~30%");
  await dragSlider(page, first.locator('[data-slot="slider-thumb"]').first(), -70);

  await step(page, "Hide the layer, then show it again");
  await first.locator('button[title="Hide layer"]').click();
  await page.waitForTimeout(1100);
  await first.locator('button[title="Show layer"]').click();
  await page.waitForTimeout(900);

  await step(page, "Zoom to a single layer");
  await first.locator('button[title="Zoom to layer"]').click();
  await page.waitForTimeout(1600);

  await step(page, "Zoom all — fits every loaded layer");
  await page.getByRole("button", { name: "Zoom all" }).click();
  await page.waitForTimeout(1600);

  await step(page, "Remove a layer — the OL layer goes too, not just the row");
  await first.locator('button[title="Remove layer"]').click();
  await page.waitForTimeout(1600);
});

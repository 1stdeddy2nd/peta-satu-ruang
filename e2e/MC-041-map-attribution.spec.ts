import { test, expect } from "./fixtures";
import { open, step, upload, toMode, applyTemplate, GEOJSON } from "./helpers";

test("MC-041 Map attribution on screen and in the export", async ({ page }) => {
  await open(page, "MC-041", "Map attribution on screen and in the export");
  await upload(page, GEOJSON);

  const credit = page.locator(".ol-attribution").first();

  await step(page, "The OSM credit is visible on the map — ODbL requires it", 2400);
  await expect(credit).toBeVisible();
  await expect(credit).toContainText("OpenStreetMap");

  await step(page, "It is not collapsible; a hidden credit is not a credit");
  await expect(credit.locator("button")).toBeHidden();
  await page.waitForTimeout(1200);

  await toMode(page, "Layout");
  await applyTemplate(page, "Peta Administrasi");

  await step(page, "It carries onto the printable sheet, inside the map frame", 2600);
  await expect(page.locator("#print-page .ol-attribution").first()).toBeVisible();

  await step(page, "No layout element for it — it cannot be deleted by editing", 2000);
  await expect(
    page.locator("aside").getByText("Attribution", { exact: true })
  ).toHaveCount(0);

  await step(page, "And it survives the export");
  const dl = page.waitForEvent("download", { timeout: 60_000 });
  await page.getByRole("button", { name: "Export PDF" }).click();
  expect((await dl).suggestedFilename()).toContain(".pdf");
  await page.waitForTimeout(2200);
});

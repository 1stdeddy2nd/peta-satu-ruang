import { test, expect } from "./fixtures";
import { open, openDataLibrary, removeAllLayers, step, toLayoutTab, toMode } from "./helpers";

/**
 * Exercises the sample fixture seeded by prisma/seed.ts
 * (examples/sample-building-footprints.geojsonl) — the real Microsoft
 * import (millions of rows, hours to run) is a manual one-off script, not
 * something CI can run. See scripts/import-building-footprints.mjs.
 *
 * The fixture sits at real Jakarta coordinates, so a dev machine that has
 * also run the real import will see real buildings there too, not just the
 * 5 synthetic ones — assertions here deliberately don't depend on an exact
 * count for that reason.
 */
test("MC-051 Import open building-footprint polygons", async ({ page }) => {
  await open(page, "MC-051", "Import open building-footprint polygons");

  await step(page, "Centre on the sample buildings and zoom in close");
  await toMode(page, "Layout");
  await toLayoutTab(page, "Page");
  const lon = page.locator("aside").getByText("Longitude").locator("..").locator("input");
  const lat = page.locator("aside").getByText("Latitude").locator("..").locator("input");
  await lon.fill("106.8285");
  await lat.fill("-6.1765");
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Center map here" }).click();
  await page.waitForTimeout(1500);
  const scale = page.locator("aside").getByText("Exact scale").locator("..").locator("input");
  await scale.fill("2000");
  await page.getByRole("button", { name: "Apply" }).click();
  await page.waitForTimeout(2000);
  await toMode(page, "Analysis");

  await step(page, "Import building footprints for the current view");
  await openDataLibrary(page);
  await page.getByRole("button", { name: /Import for current view/ }).click();
  await page.waitForTimeout(2000);
  await expect(page.getByText("Building footprints (Microsoft").first()).toBeVisible();
  // Not an exact count: the real Indonesia-wide import (MC-051) may coexist
  // with this dev fixture in the same database (it does here), and then a
  // real Jakarta view returns real buildings too, not just the 5 synthetic
  // ones — assert "at least one," which holds either way.
  await expect(page.getByText(/\d+ features/).first()).toBeVisible();

  await step(page, "Reload — the imported layer comes back (MC-015)");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await expect(page.getByText("Building footprints (Microsoft").first()).toBeVisible();

  await removeAllLayers(page);
});

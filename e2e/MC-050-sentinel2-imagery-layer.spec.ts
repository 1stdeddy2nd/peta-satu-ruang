import { test, expect } from "./fixtures";
import { open, openDataLibrary, step } from "./helpers";

test("MC-050 Sentinel-2 imagery as a selectable layer", async ({ page }) => {
  const projectLoaded = page.waitForResponse(
    (res) => res.url().includes("/api/project") && res.request().method() === "GET"
  );
  await open(page, "MC-050", "Sentinel-2 imagery as a selectable layer");
  // The restore-on-mount fetch can otherwise land after an early selection and
  // silently overwrite it — wait for it to resolve before touching anything.
  await projectLoaded;
  await page.waitForTimeout(300);

  await openDataLibrary(page);
  const basemapTrigger = page.locator('[role=dialog] [data-slot="select-trigger"]').first();

  await step(page, "Switch the basemap to Sentinel-2 — a real annual mosaic, not generated");
  await basemapTrigger.click();
  await page.getByRole("option", { name: "Sentinel-2 cloudless" }).click();
  await page.waitForTimeout(2200);
  await expect(page.locator(".ol-attribution")).toContainText("Sentinel-2 cloudless");
  await expect(page.locator(".ol-attribution")).not.toContainText("OpenStreetMap");

  await step(page, "Reload — the selection and the layer both come back");
  await page.waitForTimeout(2200);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await expect(page.locator(".ol-attribution")).toContainText("Sentinel-2 cloudless");

  await step(page, "Switch back to OpenStreetMap — one basemap, one credit, never both");
  // The reload above closed the dialog, and basemapTrigger is scoped to it.
  await openDataLibrary(page);
  await basemapTrigger.click();
  await page.getByRole("option", { name: "OpenStreetMap" }).click();
  await page.waitForTimeout(1200);
  await expect(page.locator(".ol-attribution")).not.toContainText("Sentinel-2 cloudless");
  await expect(page.locator(".ol-attribution")).toContainText("OpenStreetMap");
});

import { test, expect } from "./fixtures";
import { open, pickArea, removeAllLayers, step } from "./helpers";

/**
 * Uses the real imported data (both AdminBoundary and BuildingFootprint are
 * global reference tables, populated once by scripts/import-admin-boundaries.mjs
 * and scripts/import-building-footprints.mjs — not per-project, so this spec
 * doesn't need its own fixture the way MC-051's does).
 */
test("MC-059 Import Indonesia admin boundaries, clip buildings on request", async ({ page }) => {
  await open(page, "MC-059", "Import Indonesia admin boundaries, clip buildings on request");

  await step(page, "Narrow down to a village with the nested pickers");
  await pickArea(page, {
    province: "Dki Jakarta",
    regency: "Kota Jakarta Utara",
    district: "Pademangan",
    village: "Ancol",
  });

  await step(page, "Import — buildings come from its real boundary, no bbox involved");
  const saved = page.waitForResponse(
    (r) => r.url().includes("/api/project/layers") && r.request().method() === "POST",
    { timeout: 60_000 }
  );
  await page.getByRole("button", { name: "Import buildings in Ancol" }).click();
  await saved;
  await expect(page.getByText("Building footprints (Ancol").first()).toBeVisible();
  await expect(page.getByText(/\d+ features/).first()).toBeVisible();

  await step(page, "Reload — the clipped layer comes back (MC-015)");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await expect(page.getByText("Building footprints (Ancol").first()).toBeVisible();

  // Leaves the project as it found it.
  await removeAllLayers(page);
});

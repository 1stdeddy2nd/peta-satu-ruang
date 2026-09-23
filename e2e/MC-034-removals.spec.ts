import { test, expect } from "./fixtures";
import { open, step, upload, toMode, applyTemplate, GEOJSON } from "./helpers";

test("MC-034 Reordering and placement override removed", async ({ page }) => {
  await open(page, "MC-034", "Reordering and placement override removed");
  await upload(page, GEOJSON);
  await toMode(page, "Layout");
  await applyTemplate(page, "Peta Administrasi");

  await step(page, "No drag handles and no detach icons remain in the layers list");
  await expect(page.locator('[title="Drag to reorder"]')).toHaveCount(0);
  await expect(page.locator('button[title*="Detach"]')).toHaveCount(0);
  await page.waitForTimeout(1600);

  await step(page, "What is left: duplicate, hide, lock, delete", 2400);
  await step(page, "Auto-layout still reflows — the reason regions were kept", 2000);
});

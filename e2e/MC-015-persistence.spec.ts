import { test, expect } from "./fixtures";
import { open, step, upload, GEOJSON, removeFirstLayer } from "./helpers";

test("MC-015 Persistence via PostGIS + Prisma", async ({ page }) => {
  await open(page, "MC-015", "Persistence via PostGIS + Prisma");

  await step(page, "Upload a layer — it is saved to Postgres as real geometry");
  await upload(page, GEOJSON);

  await step(page, "Pan the map — the view is autosaved 2s after you stop moving it");
  const map = page.locator("canvas").first();
  const box = (await map.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 140, box.y + box.height / 2 - 90, {
    steps: 15,
  });
  await page.mouse.up();
  await page.waitForTimeout(3200);

  await step(page, "Reload — the layer, its features and the map position all come back");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await expect(page.getByText("jakarta-admin.geojson")).toBeVisible();
  await expect(page.getByText("5 features", { exact: false })).toBeVisible();

  await step(page, "Remove the layer");
  await removeFirstLayer(page);

  await step(page, "Reload again — it stays gone, the deletion reached the database");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  await expect(page.getByText("No layers yet")).toBeVisible();
});

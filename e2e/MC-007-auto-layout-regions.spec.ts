import { test } from "./fixtures";
import { open, step, upload, toMode, applyTemplate, regionRows, GEOJSON } from "./helpers";

test("MC-007 Auto-layout regions", async ({ page }) => {
  await open(page, "MC-007", "Auto-layout regions");
  await upload(page, GEOJSON);
  await toMode(page, "Layout");
  await applyTemplate(page, "Peta Administrasi");

  await step(page, "The info column stacks 14 blocks — none can overlap", 2000);

  const col = regionRows(page, "Info column");
  const legendRow = col.getByText("Legend", { exact: true }).locator("..");

  await step(page, "Hide the legend — the blocks below reflow up to close the gap");
  await legendRow.locator('button[title="Hide"]').click();
  await page.waitForTimeout(2200);

  await step(page, "Show it again — they reflow back down");
  await legendRow.locator('button[title="Show"]').click();
  await page.waitForTimeout(2200);
});

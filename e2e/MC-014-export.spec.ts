import { test, expect } from "./fixtures";
import { open, step, upload, toMode, applyTemplate, GEOJSON } from "./helpers";

test("MC-014 Export to PDF and PNG", async ({ page }) => {
  await open(page, "MC-014", "Export to PDF and PNG");
  await upload(page, GEOJSON);
  await toMode(page, "Layout");
  await applyTemplate(page, "Peta Administrasi");

  await step(page, "The sheet is displayed at ~80% — export must ignore that", 1800);

  await step(page, "Export PNG");
  const png = page.waitForEvent("download", { timeout: 60_000 });
  await page.getByRole("button", { name: "PNG" }).click();
  expect((await png).suggestedFilename()).toContain(".png");
  await page.waitForTimeout(1600);

  await step(page, "Export PDF — at true page size, not the zoomed size");
  const pdf = page.waitForEvent("download", { timeout: 60_000 });
  await page.getByRole("button", { name: "Export PDF" }).click();
  expect((await pdf).suggestedFilename()).toContain(".pdf");
  await page.waitForTimeout(2400);
});

import { test } from "./fixtures";
import { open, step, upload, toMode, applyTemplate, setFormat, GEOJSON } from "./helpers";

test("MC-016 Template set and page formats", async ({ page }) => {
  await open(page, "MC-016", "Template set and page formats");
  await upload(page, GEOJSON);
  await toMode(page, "Layout");

  await step(page, "Two templates only — Presentation is gone", 2000);
  await step(page, "Page format sits with template selection, not in another tab", 2000);

  await applyTemplate(page, "Peta Administrasi");

  await step(page, "A4 portrait");
  await setFormat(page, "A4", "Portrait");
  await step(page, "A4 landscape — the info column narrows, nothing overlaps");
  await setFormat(page, "A4", "Landscape");
  await step(page, "A3 portrait");
  await setFormat(page, "A3", "Portrait");
  await step(page, "A3 landscape — the column is clamped so it never goes absurdly wide");
  await setFormat(page, "A3", "Landscape");
  await step(page, "All four formats hold the full 14-block column", 2600);
});

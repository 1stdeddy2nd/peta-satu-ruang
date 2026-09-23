import { test, expect } from "./fixtures";
import { open, step, upload, GEOJSON, KML, SHP_ZIP } from "./helpers";

test("MC-003 Vector data upload", async ({ page }) => {
  await open(page, "MC-003", "Vector data upload");

  await step(page, "Upload GeoJSON — the view fits to the new layer");
  await upload(page, GEOJSON);

  await step(page, "Upload KML");
  await upload(page, KML);

  await step(page, "Upload a zipped Shapefile (.shp/.shx/.dbf/.prj)");
  await upload(page, SHP_ZIP);

  await step(
    page,
    "Three layers, listed separately — same geometry, so they overlap exactly",
    2600
  );

  await step(page, "Reload — all three survived, including the KML's altitudes");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  for (const name of ["jakarta-admin.geojson", "jakarta-admin.kml", "jakarta-admin-shp.zip"]) {
    await expect(page.getByText(name).first()).toBeVisible();
  }
});

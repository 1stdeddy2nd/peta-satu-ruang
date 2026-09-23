import { test, expect } from "./fixtures";
import { open, step, upload, GEOJSON } from "./helpers";

test("MC-040 OpenStreetMap is the only basemap", async ({ page }) => {
  const foreign: string[] = [];
  page.on("request", (r) => {
    const u = r.url();
    if (/cartocdn|mapbox|maptiler|stadiamaps|stamen/i.test(u)) foreign.push(u);
  });

  await open(page, "MC-040", "OpenStreetMap is the only basemap");
  await upload(page, GEOJSON);

  await step(page, "No basemap picker at all — there is nothing to choose", 2400);
  await expect(page.locator("aside").getByText("Basemap")).toHaveCount(0);

  await step(page, "One tile source, one set of terms, one credit", 2400);
  await expect(page.locator(".ol-attribution").first()).toContainText("OpenStreetMap");

  expect(foreign, "no third-party tile service should be contacted").toHaveLength(0);
  await step(page, "Nothing was requested from a third-party tile service", 2400);
});

import { test } from "./fixtures";
import { open, step, upload, toMode, toLayoutTab, GEOJSON } from "./helpers";

test("MC-011 Centre on coordinate and exact scale", async ({ page }) => {
  await open(page, "MC-011", "Centre on coordinate and exact scale");
  await upload(page, GEOJSON);
  await toMode(page, "Layout");
  await toLayoutTab(page, "Page");

  const lon = page.locator("aside").getByText("Longitude").locator("..").locator("input");
  const lat = page.locator("aside").getByText("Latitude").locator("..").locator("input");

  await step(page, "Type Yogyakarta's coordinates");
  await lon.fill("110.3695");
  await lat.fill("-7.7956");
  await page.waitForTimeout(900);

  await step(page, "Center map here — the view animates across");
  await page.getByRole("button", { name: "Center map here" }).click();
  await page.waitForTimeout(2600);

  await step(page, "Now set an exact scale of 1:50,000");
  const scale = page.locator("aside").getByText("Exact scale").locator("..").locator("input");
  await scale.fill("50000");
  await page.getByRole("button", { name: "Apply" }).click();
  await page.waitForTimeout(2600);

  await step(page, "The hint and the scale bar both read 1:50,000", 2600);
});

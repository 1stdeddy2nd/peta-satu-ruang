import { test } from "./fixtures";
import { open, step, upload, toMode, applyTemplate, GEOJSON } from "./helpers";

test("MC-006 Layout templates", async ({ page }) => {
  await open(page, "MC-006", "Layout templates");
  await upload(page, GEOJSON);
  await toMode(page, "Layout");

  await step(page, "Blank canvas — the map fills the whole page", 1600);

  await step(page, "Apply Peta Administrasi");
  await applyTemplate(page, "Peta Administrasi");

  await step(page, "Data and map position survived the template change", 2400);

  await step(page, "Switching back warns first, because there are elements to lose");
  await page.getByText("Blank canvas").first().click();
  await page.waitForTimeout(1600);
  await step(page, "Cancel — nothing is lost", 1400);
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.waitForTimeout(1200);
});

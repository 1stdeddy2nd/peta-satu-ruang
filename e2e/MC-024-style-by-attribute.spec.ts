import { test, expect } from "./fixtures";
import { open, step, upload, GEOJSON } from "./helpers";

test("MC-024 Style layers by attribute", async ({ page }) => {
  await open(page, "MC-024", "Style layers by attribute");
  await upload(page, GEOJSON);

  await step(page, "Five kota, all one flat colour — the gap we are closing", 2400);

  await step(page, "Colour by the 'nama' attribute");
  const card = page.locator("aside .rounded-lg.border").first();
  await card.locator('[data-slot="select-trigger"]').first().click();
  await page.getByRole("option", { name: "nama" }).click();
  await page.waitForTimeout(2400);

  await step(page, "One colour per kota, derived from the data", 2600);
  await expect(page.getByText("Jakarta Pusat")).toBeVisible();

  await step(page, "Every class is listed, and each colour is editable");
  await card.locator('input[type="color"]').nth(1).evaluate((el: HTMLInputElement) => {
    el.value = "#111111";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(2000);

  await step(page, "Colour by 'kode' instead — classes recompute");
  await card.locator('[data-slot="select-trigger"]').first().click();
  await page.getByRole("option", { name: "kode" }).click();
  await page.waitForTimeout(2400);

  await step(page, "Back to a single colour");
  await card.locator('[data-slot="select-trigger"]').first().click();
  await page.getByRole("option", { name: "Single colour" }).click();
  await page.waitForTimeout(2200);
});

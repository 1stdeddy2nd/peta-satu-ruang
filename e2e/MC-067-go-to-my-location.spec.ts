import { test, expect } from "./fixtures";
import { open, step } from "./helpers";

test.use({
  permissions: ["geolocation"],
  // Monas, central Jakarta.
  geolocation: { latitude: -6.1754, longitude: 106.8272 },
});

test("MC-067 Go to my location button", async ({ page }) => {
  await open(page, "MC-067", "Go to my location button");

  const readout = page.locator("div.tabular-nums").first();
  await expect(readout).toBeVisible();
  await step(page, "The map is wherever it was last left");

  await page.getByRole("button", { name: "Go to my location" }).click();
  await step(page, "One button, under the area picker — the map jumps there", 3000);

  await expect(readout).toContainText("106.82", { timeout: 15_000 });
  await expect(readout).toContainText("-6.17");
});

import { test } from "./fixtures";
import { open, step } from "./helpers";

test("MC-013 Desktop-only gate", async ({ page }) => {
  await open(page, "MC-013", "Desktop-only gate");

  await step(page, "Narrow the window below the 1024px threshold");
  await page.setViewportSize({ width: 900, height: 800 });
  await page.waitForTimeout(1800);
  await step(page, "The editor is replaced by an explainer with the live width", 2600);

  await step(page, "Narrow further — the readout follows");
  await page.setViewportSize({ width: 640, height: 800 });
  await page.waitForTimeout(2200);

  await step(page, "Widen past the threshold — the editor comes back");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(2400);
});

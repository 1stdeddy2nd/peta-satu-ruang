import { test, expect } from "./fixtures";
import { open, openDataLibrary, step } from "./helpers";

/** Needs a real FIRMS_MAP_KEY in .env — the layer stays off without one. */
test("MC-052 Fire hotspot layer (NASA FIRMS)", async ({ page }) => {
  await open(page, "MC-052", "Near-real-time fire/hotspot layer (NASA FIRMS)");

  await step(page, "Open the data library and find the Fire hotspots card");
  await openDataLibrary(page);
  await expect(page.getByText("Fire hotspots", { exact: true })).toBeVisible();
  await expect(page.getByText(/NASA FIRMS/).first()).toBeVisible();

  await step(page, "Turn it on — Indonesia-wide fire hotspots load, no zoom needed");
  await page.getByRole("switch").click();
  await expect(page.locator(".ol-attribution")).toContainText("NASA FIRMS", { timeout: 15_000 });

  // Whether a click actually lands on a point depends on real, current fire
  // activity in view — not something a deterministic assertion can rely on.
  // This just shows the interaction is wired up; MC-052's own inspection
  // criterion is confirmed by hand, against a view with a known active fire.
  await step(page, "Click the map — a hotspot under the cursor shows its detail", 2500);
  await page.keyboard.press("Escape");
  await page.mouse.click(640, 360);

  await step(page, "Turn it off — the layer and its attribution disappear");
  await openDataLibrary(page);
  await page.getByRole("switch").click();
  await page.waitForTimeout(500);
  await expect(page.locator(".ol-attribution")).not.toContainText("NASA FIRMS");
});

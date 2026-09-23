import { test, expect } from "./fixtures";
import { open, openDataLibrary, step } from "./helpers";

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025] as const;

test("MC-053 Sentinel-2 historical year picker", async ({ page }) => {
  const projectLoaded = page.waitForResponse(
    (res) => res.url().includes("/api/project") && res.request().method() === "GET"
  );
  await open(page, "MC-053", "Sentinel-2 historical year picker (2020-2025)");
  await projectLoaded;
  await page.waitForTimeout(300);

  await openDataLibrary(page);
  const triggers = page.locator('[role=dialog] [data-slot="select-trigger"]');

  await step(page, "Switch to Sentinel-2 — a year select appears alongside it");
  await triggers.nth(0).click();
  await page.getByRole("option", { name: "Sentinel-2 cloudless" }).click();
  await page.waitForTimeout(1000);
  await expect(triggers.nth(1)).toBeVisible();

  // Every year is real, distinct EOX data, not the same tile relabeled —
  // checked by hand by diffing raw tile bytes across years before writing
  // this. Cycle through all six so the recording actually shows each one
  // loading, not just the two endpoints.
  for (const year of YEARS) {
    await step(page, `Pick ${year}`);
    await triggers.nth(1).click();
    await page.getByRole("option", { name: String(year), exact: true }).click();
    await page.waitForTimeout(2500);
    await expect(page.locator(".ol-attribution")).toContainText(`Sentinel data ${year}`);
  }

  await step(page, "Reload — the last chosen year comes back, not the default");
  await page.waitForTimeout(2200);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await expect(page.locator(".ol-attribution")).toContainText(`Sentinel data ${YEARS.at(-1)}`);
});

import { test, expect } from "./fixtures";
import { mapPixels, searchArea, step } from "./helpers";
import type { Page } from "@playwright/test";

const BUILDING: [number, number, number] = [0xd9, 0x77, 0x06];

function catalogue(page: Page) {
  return page.getByRole("button", { name: "Katalog data" });
}

function buildingsLoaded(page: Page) {
  return page.waitForResponse((r) => r.url().includes("/api/building-geojson") && r.ok(), {
    timeout: 60_000,
  });
}

test("MC-082 Show the buildings of the picked area", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForSelector(".map-dashboard");
  await step(page, "MC-082 — Show the buildings of the picked area", 1500);

  const toggle = page.getByRole("switch", { name: "Bangunan" });
  const credit = page.locator(".ol-attribution");

  await catalogue(page).click();
  await expect(page.getByText("Pilih wilayah dulu")).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-disabled", "true");
  await step(page, "Nothing picked yet: there is no area to draw the buildings of", 2400);

  await searchArea(page, "Kota Bandung", "Kota Bandung", "Kota / Kabupaten");
  await catalogue(page).click();
  await expect(toggle).not.toHaveAttribute("aria-disabled", "true");
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  expect((await mapPixels(page, BUILDING)).count).toBe(0);
  await step(page, "A whole city is too far out for a building to mean anything", 2600);

  // They are fetched the first time the reader zooms in far enough to see them.
  const city = buildingsLoaded(page);
  await catalogue(page).click();
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Perbesar" }).click();
    await page.waitForTimeout(500);
  }
  await city;
  await expect.poll(async () => (await mapPixels(page, BUILDING)).count, { timeout: 60_000 }).toBeGreaterThan(0);
  await expect(credit).toContainText("Microsoft");
  await step(page, "Zoom in and they arrive, credited to Microsoft", 3000);

  await catalogue(page).click();
  await toggle.click();
  await expect.poll(async () => (await mapPixels(page, BUILDING)).count).toBe(0);
  await expect(credit).not.toContainText("Microsoft");
  await step(page, "Off: the buildings and their credit go together", 2400);

  const back = buildingsLoaded(page);
  await toggle.click();
  await back;
  await expect.poll(async () => (await mapPixels(page, BUILDING)).count, { timeout: 60_000 }).toBeGreaterThan(0);
  await step(page, "…and on again", 2000);

  // A province holds millions of buildings; it is never loaded whole.
  await searchArea(page, "Jawa Barat", "Jawa Barat", "Provinsi");
  await expect.poll(async () => (await mapPixels(page, BUILDING)).count).toBe(0);
  await catalogue(page).click();
  await expect(toggle).toHaveAttribute("aria-disabled", "true");
  await expect(credit).not.toContainText("Microsoft");
  await step(page, "A province is too much to draw, and the switch says so", 2600);

  const village = buildingsLoaded(page);
  await searchArea(page, "Braga", "Braga", "Desa / Kelurahan", "Kota Bandung");
  await village;
  await expect.poll(async () => (await mapPixels(page, BUILDING)).count, { timeout: 60_000 }).toBeGreaterThan(0);
  // Clipped to the desa: a patch, not a city-wide smear. Measured once the fit
  // has settled — the position drifts while the view is still animating.
  await page.waitForTimeout(2000);
  const box = await page.evaluate(([r, g, b]) => {
    let left = 1;
    let right = 0;
    for (const canvas of document.querySelectorAll<HTMLCanvasElement>(".ol-viewport canvas")) {
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      const { data, width } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== r || data[i + 1] !== g || data[i + 2] !== b || data[i + 3] !== 255) continue;
        const x = ((i / 4) % width) / width;
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
    return right - left;
  }, BUILDING);
  expect(box).toBeGreaterThan(0);
  expect(box).toBeLessThan(0.7);
  await step(page, "A desa: every building, only inside the line", 3000);
});

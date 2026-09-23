import { test, expect } from "./fixtures";
import { mapPixels, searchArea, step } from "./helpers";
import type { Page } from "@playwright/test";

const OUTLINE: [number, number, number] = [0x25, 0x63, 0xeb];

function catalogue(page: Page) {
  return page.getByRole("button", { name: "Katalog data" });
}

test("MC-081 Show or hide the picked area's boundary", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForSelector(".map-dashboard");
  await step(page, "MC-081 — Show or hide the picked area's boundary", 1500);

  const toggle = page.getByRole("switch", { name: "Batas wilayah" });

  await catalogue(page).click();
  await expect(page.getByText("Pilih wilayah dulu")).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-disabled", "true");
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await step(page, "Nothing picked yet: the boundary has nothing to draw", 2400);

  await searchArea(page, "Tampan", "Tampan", "Kecamatan");
  await expect.poll(async () => (await mapPixels(page, OUTLINE)).count).toBeGreaterThan(0);
  await step(page, "Picking a kecamatan outlines it", 2200);

  await catalogue(page).click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await toggle.click();
  await expect.poll(async () => (await mapPixels(page, OUTLINE)).count).toBe(0);
  await expect(page.locator(".ol-attribution")).not.toContainText("BPS/HDX");
  await expect(page.getByLabel("Cari wilayah")).toHaveValue("Tampan");
  await step(page, "Hidden — the place is still picked, the credit goes with the line", 2400);

  await toggle.click();
  await expect.poll(async () => (await mapPixels(page, OUTLINE)).count).toBeGreaterThan(0);
  await expect(page.locator(".ol-attribution")).toContainText("BPS/HDX");
  await step(page, "…and shown again", 1800);

  await toggle.click();
  await expect.poll(async () => (await mapPixels(page, OUTLINE)).count).toBe(0);
  await searchArea(page, "Pekanbaru", "Kota Pekanbaru", "Kota / Kabupaten");
  await expect.poll(async () => (await mapPixels(page, OUTLINE)).count).toBeGreaterThan(0);
  await catalogue(page).click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await step(page, "Picking another area while hidden shows its outline", 2400);
});

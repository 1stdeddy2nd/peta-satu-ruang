import { test, expect } from "./fixtures";
import { mapPixels, step } from "./helpers";
import type { Page } from "@playwright/test";

const OUTLINE: [number, number, number] = [0x25, 0x63, 0xeb];

async function pick(page: Page, query: string, name: string, level: string) {
  await page.getByLabel("Cari wilayah").fill(query);
  const row = page
    .locator(".map-dashboard ul button")
    .filter({ has: page.getByText(name, { exact: true }) })
    .filter({ hasText: level })
    .first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  await step(page, `"${query}" — ${level}`, 1400);
  const outline = page.waitForResponse((r) => r.url().includes("/api/admin-boundaries?pcode="));
  await row.click();
  expect((await outline).ok()).toBe(true);
  await expect.poll(async () => (await mapPixels(page, OUTLINE)).count).toBeGreaterThan(0);
  await expect(page.getByLabel("Cari wilayah")).toHaveValue(name);
}

test("MC-080 Search an admin area and show its boundary", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForSelector(".map-dashboard");
  await step(page, "MC-080 — Search an admin area and show its boundary", 1500);

  await page.getByLabel("Cari wilayah").fill("Surabaya");
  const first = page.locator(".map-dashboard ul button").first();
  await expect(first).toContainText("Kota Surabaya", { timeout: 10_000 });
  await step(page, "Larger areas first: the city, not the villages named Surabaya", 2400);

  await pick(page, "Riau", "Riau", "Provinsi");
  await expect(page.locator(".ol-attribution")).toContainText("BPS/HDX");
  await step(page, "The province, outlined, with its source credited", 2200);

  // Typing the exact name and picking it once swallowed the next search.
  await pick(page, "Pekanbaru", "Kota Pekanbaru", "Kota / Kabupaten");
  await step(page, "A city replaces it", 2000);

  await pick(page, "Tampan", "Tampan", "Kecamatan");
  await step(page, "A kecamatan", 2000);

  await pick(page, "Muara Rupit", "Muara Rupit", "Desa / Kelurahan");
  await step(page, "Down to a single village", 2200);

  await page.getByRole("button", { name: "Kosongkan pencarian" }).click();
  await expect.poll(async () => (await mapPixels(page, OUTLINE)).count).toBe(0);
  await expect(page.locator(".ol-attribution")).not.toContainText("BPS/HDX");
  await step(page, "Clearing the box removes the boundary and its credit", 2000);

  await page.getByLabel("Cari wilayah").fill("zzzqqq");
  await expect(page.getByText("Tidak ada hasil")).toBeVisible({ timeout: 10_000 });
  await step(page, "No match says so", 1600);
});

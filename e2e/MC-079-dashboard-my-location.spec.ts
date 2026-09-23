import { test, expect } from "./fixtures";
import { mapPixels, step } from "./helpers";

const DOT: [number, number, number] = [0x25, 0x63, 0xeb];

test.describe("with location allowed", () => {
  test.use({
    permissions: ["geolocation"],
    // Monas, central Jakarta.
    geolocation: { latitude: -6.1754, longitude: 106.8272 },
  });

  test("MC-079 Go to my location on the dashboard", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".map-dashboard");
    await step(page, "MC-079 — Go to my location on the dashboard", 1500);

    await step(page, "The dashboard opens on all of Indonesia");
    expect((await mapPixels(page, DOT)).count).toBe(0);
    await expect(page.getByRole("button", { name: /penanda lokasi/ })).toHaveCount(0);

    await page.getByRole("button", { name: "Ke lokasi saya" }).click();
    await step(page, "One press: the map zooms to you and marks the spot", 3000);

    await expect.poll(async () => (await mapPixels(page, DOT)).count).toBeGreaterThan(0);
    const dot = await mapPixels(page, DOT);
    expect(Math.abs(dot.x! - 0.5)).toBeLessThan(0.05);
    expect(Math.abs(dot.y! - 0.5)).toBeLessThan(0.05);
    await expect(page.getByText("Mencari lokasi Anda")).toHaveCount(0);
    await step(page, "Monas, with the blue dot at the centre", 2000);

    await page.getByRole("button", { name: "Sembunyikan penanda lokasi" }).click();
    await expect.poll(async () => (await mapPixels(page, DOT)).count).toBe(0);
    await step(page, "The pin button hides the dot", 1800);

    await page.getByRole("button", { name: "Tampilkan penanda lokasi" }).click();
    await expect.poll(async () => (await mapPixels(page, DOT)).count).toBeGreaterThan(0);
    await step(page, "…and shows it again", 1800);

    await page.getByRole("button", { name: "Sembunyikan penanda lokasi" }).click();
    await expect.poll(async () => (await mapPixels(page, DOT)).count).toBe(0);
    await page.getByRole("button", { name: "Ke lokasi saya" }).click();
    await expect.poll(async () => (await mapPixels(page, DOT)).count).toBeGreaterThan(0);
    await expect(page.getByRole("button", { name: "Sembunyikan penanda lokasi" })).toBeVisible();
    await step(page, "Locating again brings the dot back", 1800);
  });
});

test("MC-079 A denied location says so", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_found, fail) =>
      fail?.({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: "denied" });
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForSelector(".map-dashboard");
  await step(page, "MC-079 — When the browser refuses", 1500);

  await page.getByRole("button", { name: "Ke lokasi saya" }).click();
  await expect(page.getByText("Izin lokasi ditolak")).toBeVisible();
  await step(page, "A denied permission is said out loud, at the top", 2400);
  expect((await mapPixels(page, DOT)).count).toBe(0);
});

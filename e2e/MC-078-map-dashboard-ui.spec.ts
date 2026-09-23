import { test, expect } from "./fixtures";
import { step } from "./helpers";

test("MC-078 Map dashboard UI", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForSelector(".map-dashboard");
  await step(page, "MC-078 — Map dashboard UI", 1500);

  await step(page, "The front page is a map of Indonesia, not the editor", 2000);
  await expect(page.getByText("Peta Satu Ruang")).toBeVisible();
  await expect(page.getByText(/Langsung · \d{2}[.:]\d{2} WIB/)).toBeVisible();
  await expect(page.getByRole("tab", { name: "Analysis" })).toHaveCount(0);

  await step(page, "Search, and the map controls beside it");
  await expect(page.getByLabel("Cari wilayah")).toBeVisible();
  for (const name of ["Ke lokasi saya", "Perbesar", "Perkecil", "Cara pakai peta"]) {
    await expect(page.getByRole("button", { name })).toBeVisible();
  }

  await step(page, "One summary across the top: a chip per hazard", 1600);
  const summary = page.getByRole("group", { name: "Ringkasan peristiwa" });
  for (const name of [/^Titik api/, /^Gunung/, /^Gempa/]) {
    await expect(summary.getByRole("button", { name })).toBeVisible();
  }
  await expect(summary.getByRole("button", { name: "Katalog data" })).toBeVisible();

  await step(page, "And one timeline along the bottom, live by default", 1600);
  await expect(page.getByRole("radiogroup", { name: "Rentang waktu" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "24 jam" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Sekarang")).toBeVisible();

  await step(page, "Poppins, app-wide");
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain("Poppins");

  await step(page, "The editor moved to /editor");
  await page.goto("/editor", { waitUntil: "networkidle" });
  await expect(page.getByRole("tab", { name: "Analysis" })).toBeVisible();
  await step(page, "Unchanged, one step further in", 1800);
});

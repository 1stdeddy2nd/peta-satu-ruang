import { test, expect } from "./fixtures";
import { step } from "./helpers";

function countOf(text: string) {
  const match = /([\d.,]+)\s*(rb)?/.exec(text.replace(/\s+/g, ""));
  if (!match) return 0;
  const value = Number(match[1].replace(/\./g, "").replace(",", "."));
  return match[2] ? value * 1000 : value;
}

/** Needs the FireHotspot table filled (POST /api/admin/fire-history/backfill on a fresh database). */
test("MC-070 30 days of fire history, on a timeline", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForSelector(".map-dashboard");
  await step(page, "MC-070 — 30 days of fire history, on a timeline", 1500);

  const chip = page.getByRole("button", { name: /^Titik api/ });
  await expect.poll(async () => countOf(await chip.innerText()), { timeout: 90_000 }).toBeGreaterThan(0);
  const day = countOf(await chip.innerText());
  await expect(page.getByRole("radio", { name: "24 jam" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Sekarang")).toBeVisible();
  await step(page, "The map opens on the last 24 hours, and says so", 2600);

  // Time is a dimension of the map, not a layer: the same events, a longer window.
  await page.getByRole("radio", { name: "30 hari" }).click();
  await expect.poll(async () => countOf(await chip.innerText()), { timeout: 90_000 }).toBeGreaterThan(day);
  const month = countOf(await chip.innerText());
  await step(page, "One press widens the window to a month, counts and all", 3000);

  // Replay: events appear when their own timestamp is reached, so the count
  // starts near nothing and climbs back to the month's total.
  await page.getByRole("button", { name: "Putar ulang" }).click();
  await expect.poll(async () => countOf(await chip.innerText()), { timeout: 20_000 }).toBeLessThan(month);
  await step(page, "Replay: the month plays back from its start", 3600);
  const partway = countOf(await chip.innerText());
  await expect.poll(async () => countOf(await chip.innerText()), { timeout: 30_000 }).toBeGreaterThan(partway);
  await step(page, "Every hotspot appears at the hour it was actually detected", 3000);

  await page.getByRole("button", { name: "Jeda" }).click();
  const paused = await page.getByRole("slider", { name: "Posisi waktu" }).getAttribute("aria-valuenow");
  await page.waitForTimeout(1200);
  await expect(page.getByRole("slider", { name: "Posisi waktu" })).toHaveAttribute("aria-valuenow", paused!);
  await step(page, "Paused on one moment", 2000);

  // Scrubbing: drag the bars to any moment in the window.
  const bars = page.getByRole("slider", { name: "Posisi waktu" });
  const box = (await bars.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.35, box.y + box.height / 2);
  await expect(bars).not.toHaveAttribute("aria-valuenow", paused!);
  await step(page, "Or drag to a moment yourself", 2400);

  await page.getByRole("button", { name: "Kembali ke sekarang" }).click();
  await expect(page.getByText("Sekarang")).toBeVisible();
  await expect.poll(async () => countOf(await chip.innerText()), { timeout: 60_000 }).toBe(month);
  await step(page, "Back to now: the whole month again, live", 2600);

  await page.getByRole("radio", { name: "1 jam" }).click();
  await expect.poll(async () => countOf(await chip.innerText()), { timeout: 90_000 }).toBeLessThan(month);
  await step(page, "And down to the last hour, for what is burning right now", 2600);
});

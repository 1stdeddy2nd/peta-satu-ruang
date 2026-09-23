import { test, expect } from "./fixtures";
import { step } from "./helpers";
import type { Page } from "@playwright/test";

// Markers overlap: an erupting volcano's badge is red too, and it sits above
// the hotspots. So try candidates until the wanted popup is the one that
// opens, closing whatever else answers the click.
async function openPopup(page: Page, points: { x: number; y: number }[], name: string) {
  await page.waitForLoadState("networkidle");
  for (const at of points.slice(0, 12)) {
    for (let attempt = 0; attempt < 2; attempt++) {
      await page.mouse.click(at.x, at.y);
      await page.waitForTimeout(600);
      if (await page.getByRole("dialog", { name }).count()) return at;
      const other = page.locator('[role=dialog][aria-label^="Detail"]');
      if (await other.count()) {
        await other.first().getByRole("button", { name: "Tutup" }).click();
        await page.waitForTimeout(300);
      }
    }
  }
  throw new Error(`no "${name}" popup opened on ${points.length} candidates`);
}

async function pixelOf(page: Page, lon: number, lat: number) {
  return page.evaluate(([lon, lat]) => {
    const viewport = document.querySelector(".ol-viewport")!.getBoundingClientRect();
    const R = 6378137;
    const merc = (lo: number, la: number) => [
      (R * lo * Math.PI) / 180,
      R * Math.log(Math.tan(Math.PI / 4 + (la * Math.PI) / 360)),
    ];
    const resolution = 40075016.68557849 / 256 / 2 ** 4.6;
    const [cx, cy] = merc(118, -2.5);
    const [x, y] = merc(lon, lat);
    return {
      x: viewport.left + viewport.width / 2 + (x - cx) / resolution,
      y: viewport.top + viewport.height / 2 - (y - cy) / resolution,
    };
  }, [lon, lat]);
}

function countOf(text: string) {
  const match = /([\d.,]+)\s*(rb)?/.exec(text.replace(/\s+/g, ""));
  if (!match) return 0;
  const value = Number(match[1].replace(/\./g, "").replace(",", "."));
  return match[2] ? value * 1000 : value;
}

/** Needs a real FIRMS_MAP_KEY in .env, and a season with fires in Indonesia. */
test("MC-083 Show fire hotspots on the dashboard", async ({ page }) => {
  test.setTimeout(180_000);
  const hotspots = page.waitForResponse((r) => r.url().includes("/api/fire-hotspots/history?") && r.ok(), {
    timeout: 90_000,
  });
  // Only points well inside the map: a popup that would overflow the window
  // pans the map, and every later projection would then be off.
  const fits = (at: { x: number; y: number }) => at.x > 380 && at.x < 1050 && at.y > 380 && at.y < 610;
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForSelector(".map-dashboard");
  await step(page, "MC-083 — Show fire hotspots on the dashboard", 1500);

  // Events are what the map is for: nothing to switch on first.
  const points = ((await (await hotspots).json()).points as [number, number][]).slice(0, 400);
  const chip = page.getByRole("button", { name: /^Titik api/ });
  await expect(page.locator(".ol-attribution")).toContainText("NASA FIRMS");
  expect(points.length).toBeGreaterThan(0);
  await step(page, "The map opens on Indonesia's hotspots, credited to NASA FIRMS", 2800);

  await chip.click();
  const card = page.getByRole("dialog", { name: "Titik api" });
  await expect(card).toContainText("24 jam");
  const high = page.getByRole("switch", { name: "Keyakinan tinggi" });
  await expect(high).toHaveAttribute("aria-checked", "true");
  const medium = page.getByRole("switch", { name: "Keyakinan sedang" });
  await expect(medium).toHaveAttribute("aria-checked", "false");
  await step(page, "The counter opens a card: how sure the satellite is, level by level", 3000);

  // Every level is counted, including the ones not drawn, so a reader can see
  // what switching one on would add.
  const shown = countOf(await chip.innerText());
  await expect(card).toContainText(/Keyakinan sedang[\s\S]*\d/);
  await medium.click();
  await expect.poll(async () => countOf(await chip.innerText()), { timeout: 40_000 }).toBeGreaterThan(shown);
  await step(page, "Switching a level on adds exactly what the card said it would", 2600);
  await medium.click();
  await expect.poll(async () => countOf(await chip.innerText()), { timeout: 30_000 }).toBe(shown);

  await page.getByRole("button", { name: "Tentang titik api" }).click();
  await expect(card).toContainText("indikasi panas");
  await expect(card.locator('a[href="https://firms.modaps.eosdis.nasa.gov/map/"]')).toContainText("NASA FIRMS");
  await expect(card.locator('a[href="https://sipongi.gakkum.kehutanan.go.id/"]')).toContainText("SiPongi");
  await step(page, "ⓘ says what a hotspot is, and who publishes it", 3200);
  await page.getByRole("button", { name: "Tentang titik api" }).click();
  await chip.click();

  const placed = (await Promise.all(points.map(async (p) => pixelOf(page, p[0], p[1])))).filter(fits);
  await openPopup(page, placed, "Detail titik api");
  const popup = page.getByRole("dialog", { name: "Detail titik api" });
  await expect(popup).toContainText("Terdeteksi");
  await expect(popup).toContainText(/satelit (Suomi NPP|NOAA-20|NOAA-21|Aqua|Terra)/);
  await expect(popup).not.toContainText("Mencari lokasi", { timeout: 15_000 });
  await step(page, "A point: when, where, how sure, and which satellite saw it", 3200);
  await popup.getByRole("button", { name: "Tutup" }).click();

  await chip.click();
  await page.getByRole("switch", { name: "Sembunyikan Titik api" }).click();
  await expect(page.locator(".ol-attribution")).not.toContainText("NASA FIRMS");
  // Switched off it is only hidden: the count stays, so the card still says
  // what is out there.
  await expect(card).toContainText(/\d/);
  await step(page, "Switched off: gone from the map, still counted in the card", 2400);
});

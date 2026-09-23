import { test, expect } from "./fixtures";
import { step } from "./helpers";
import type { Page } from "@playwright/test";

interface Quake {
  id: string;
  source: string;
  occurredAt: string;
  lat: number;
  lon: number;
  magnitude: number;
  area: string;
  potential: string | null;
}

// The dashboard opens on a known view, so BMKG's own coordinates give the pixel
// to click. Only points in this box are used: a popup that would overflow the
// window pans the map, and every later projection would then be off.
function fits(at: { x: number; y: number }) {
  return at.x > 430 && at.x < 1050 && at.y > 400 && at.y < 600;
}

function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
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

// How many different frames the map draws — a still map gives 1.
async function mapFrames(page: Page) {
  const seen = new Set<number>();
  for (let i = 0; i < 4; i++) {
    seen.add(
      await page.evaluate(() => {
        let hash = 0;
        for (const canvas of document.querySelectorAll<HTMLCanvasElement>(".ol-viewport canvas")) {
          const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
          for (let at = 0; at < data.length; at += 97) hash = (hash * 31 + data[at]) >>> 0;
        }
        return hash;
      })
    );
    await page.waitForTimeout(160);
  }
  return seen.size;
}

// Markers overlap: an erupting volcano's badge is red like a hotspot's, and
// sits above it. So try candidates until the wanted popup is the one that
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

/** Needs BMKG reachable; its feeds always carry recent earthquakes. */
test("MC-085 Show earthquakes on the dashboard", async ({ page }) => {
  test.setTimeout(180_000);
  const response = page.waitForResponse((r) => r.url().includes("/api/earthquakes") && r.ok(), { timeout: 90_000 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForSelector(".map-dashboard");
  await step(page, "MC-085 — Show earthquakes on the dashboard", 1500);

  const body = await (await response).json();
  const quakes = body.events as Quake[];
  expect(quakes.length).toBeGreaterThan(0);
  await expect(page.locator(".ol-attribution")).toContainText("BMKG");
  await step(page, "The map opens with BMKG's earthquakes, sized by magnitude", 2800);

  const chip = page.getByRole("button", { name: /^Gempa/ });
  await chip.click();
  const card = page.getByRole("dialog", { name: "Gempa" });
  const strong = page.getByRole("switch", { name: /^M 5.0 ke atas/ });
  await expect(strong).toHaveAttribute("aria-checked", "true");
  await expect(card).toContainText("M 3,0 – 4,9");
  await expect(card).toContainText("Di bawah M 3,0");
  await step(page, "Every band is counted: what can damage, what is felt, what is not", 3200);

  await strong.click();
  await expect(strong).toHaveAttribute("aria-checked", "false");
  // A hidden band keeps its number: the card still says what is out there.
  await expect(card).toContainText(/M 5.0 ke atas[\s\S]*\d/);
  await step(page, "A band can be switched off without losing its count", 2600);
  await strong.click();

  await page.getByRole("button", { name: "Tentang gempa" }).click();
  await expect(card).toContainText("perkiraan sejauh mana getaran terasa");
  await expect(card.locator('a[href*="bmkg.go.id"]').first()).toContainText("BMKG");
  await step(page, "ⓘ: the wave is an estimate of the shaking's reach, not a BMKG measurement", 3400);
  await page.getByRole("button", { name: "Tentang gempa" }).click();
  await chip.click();

  // The shockwave keeps moving while a quake is on the map.
  expect(await mapFrames(page)).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Katalog data" }).click();
  await page.getByRole("switch", { name: "Animasi" }).click();
  await expect.poll(() => mapFrames(page), { timeout: 20_000 }).toBe(1);
  await step(page, "One switch stills every moving thing on the map", 2800);
  await page.getByRole("switch", { name: "Animasi" }).click();
  await page.getByRole("button", { name: "Katalog data" }).click();

  // The month's catalogue, so every quake in the response is on the map — the
  // dashboard opens on the last 24 hours, which holds only a handful.
  await page.getByRole("radio", { name: "30 hari" }).click();
  await expect.poll(async () => (await chip.innerText()).trim(), { timeout: 60_000 }).not.toBe("–");
  await step(page, "Thirty days, with USGS filling what BMKG's short feeds never carried", 3000);

  // A quake with BMKG's tsunami sentence, which is what a reader needs first —
  // and far from every other quake, or the click can land on an overlapping one.
  const candidates = quakes.filter(
    (q) => q.potential && q.source === "bmkg" && quakes.every((o) => o === q || km(q, o) > 80)
  );
  const placed = (await Promise.all(candidates.map(async (q) => ({ q, at: await pixelOf(page, q.lon, q.lat) })))).filter(
    ({ at }) => fits(at)
  );
  expect(placed.length).toBeGreaterThan(0);

  // Whichever of them owns the pixel: a month of quakes overlap, and closing a
  // wrong popup leaves the view where its autoPan moved it.
  await openPopup(page, placed.map((p) => p.at), "Detail gempa");
  const popup = page.getByRole("dialog", { name: "Detail gempa" });
  await expect(popup).toContainText(/^M \d/);
  await expect(popup).toContainText("kedalaman");
  await expect(popup).toContainText(/Sumber: (BMKG|katalog USGS)/);
  const shown = await popup.innerText();
  expect(quakes.some((q) => shown.includes(q.area))).toBe(true);
  await step(page, "A quake: when, where, how deep, and which catalogue said so", 3400);
  await popup.getByRole("button", { name: "Tutup" }).click();

  if (quakes.some((q) => q.source === "usgs")) {
    await chip.click();
    await page.getByRole("button", { name: "Tentang gempa" }).click();
    await expect(card.locator('a[href*="usgs.gov"]')).toContainText("USGS");
    await step(page, "Both catalogues are named, and each quake says which one it came from", 3000);
  }
});

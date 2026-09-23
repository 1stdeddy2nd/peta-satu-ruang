import { test, expect } from "./fixtures";
import { step } from "./helpers";
import type { Page } from "@playwright/test";

interface VolcanoFeature {
  geometry: { coordinates: [number, number] };
  properties: { name: string; level: number | null; latestEruption: { eruptedAt: string } | null };
}

// The dashboard opens on a known view, so a volcano's own coordinates give the
// pixel to click. Only points well inside the map are used: a popup that would
// overflow the window pans the map under the next click.
function fits(at: { x: number; y: number }) {
  return at.x > 400 && at.x < 1040 && at.y > 380 && at.y < 600;
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

/** Needs MAGMA reachable; its status list covers every monitored volcano. */
test("MC-084 Show volcano status on the dashboard", async ({ page }) => {
  test.setTimeout(180_000);
  const volcanoes = page.waitForResponse((r) => r.url().includes("/api/volcanoes") && r.ok(), { timeout: 90_000 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForSelector(".map-dashboard");
  await step(page, "MC-084 — Show volcano status on the dashboard", 1500);

  const body = await (await volcanoes).json();
  const features = body.features as VolcanoFeature[];
  expect(features.length).toBeGreaterThan(100);
  await expect(page.locator(".ol-attribution")).toContainText("MAGMA Indonesia");
  await step(page, "The map opens with PVMBG's status, credited to MAGMA Indonesia", 2800);

  const chip = page.getByRole("button", { name: /^Gunung erupsi/ });
  await chip.click();
  const card = page.getByRole("dialog", { name: "Gunung api" });
  // Erupting, Awas and Siaga are on by default; the quieter levels are a choice.
  await expect(page.getByRole("switch", { name: "Erupsi" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("switch", { name: "Level IV · Awas" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("switch", { name: "Level III · Siaga" })).toHaveAttribute("aria-checked", "true");
  const waspada = page.getByRole("switch", { name: "Level II · Waspada" });
  await expect(waspada).toHaveAttribute("aria-checked", "false");
  await step(page, "The card opens on what matters: eruptions, Awas and Siaga", 3200);

  await waspada.click();
  await expect(waspada).toHaveAttribute("aria-checked", "true");
  await step(page, "Waspada is one press away when you want the whole picture", 2600);
  await waspada.click();

  await page.getByRole("button", { name: "Tentang gunung api" }).click();
  await expect(card).toContainText("Badan Geologi");
  await expect(card.locator('a[href*="magma.esdm.go.id"]').first()).toContainText("MAGMA Indonesia");
  await step(page, "ⓘ explains the levels and names the source", 3000);
  await page.getByRole("button", { name: "Tentang gunung api" }).click();
  await chip.click();

  // A volcano PVMBG watches most closely, or the most recently erupted one.
  const ranked = features
    .filter((f) => f.properties.level !== null)
    .sort(
      (a, b) =>
        (b.properties.level ?? 0) - (a.properties.level ?? 0) ||
        Date.parse(b.properties.latestEruption?.eruptedAt ?? "0") -
          Date.parse(a.properties.latestEruption?.eruptedAt ?? "0")
    );
  const placed = await Promise.all(
    ranked.map(async (f) => ({ f, at: await pixelOf(page, f.geometry.coordinates[0], f.geometry.coordinates[1]) }))
  );
  const candidates = placed.filter(({ at }) => fits(at));
  expect(candidates.length).toBeGreaterThan(0);

  const at = await openPopup(page, candidates.map((c) => c.at), "Detail gunung api");
  const chosen = candidates.find((c) => c.at === at)!;
  const popup = page.getByRole("dialog", { name: "Detail gunung api" });
  await expect(popup).toContainText(chosen.f.properties.name);
  await expect(popup).toContainText(/NORMAL|WASPADA|SIAGA|AWAS/);
  await step(page, "A volcano: its level, in PVMBG's own words, and what it means", 3400);
  await popup.getByRole("button", { name: "Tutup" }).click();

  await chip.click();
  await page.getByRole("switch", { name: "Sembunyikan Gunung api" }).click();
  await expect(page.locator(".ol-attribution")).not.toContainText("MAGMA Indonesia");
  await expect(card).toContainText(/\d/);
  await step(page, "Switched off: off the map, still counted in the card", 2400);
});

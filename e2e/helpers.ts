import path from "path";
import { expect, test } from "@playwright/test";
import { resetWorkerProject } from "./worker-project";
import type { Locator, Page } from "@playwright/test";

export const SAMPLES = path.join(process.cwd(), "examples");

export const GEOJSON = path.join(SAMPLES, "jakarta-admin.geojson");
export const KML = path.join(SAMPLES, "jakarta-admin.kml");
export const SHP_ZIP = path.join(SAMPLES, "jakarta-admin-shp.zip");

export async function step(page: Page, text: string, holdMs = 1100) {
  process.stdout.write(`      · ${text}\n`);
  await page.evaluate((label) => {
    let el = document.getElementById("__mc_caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "__mc_caption";
      Object.assign(el.style, {
        position: "fixed",
        left: "16px",
        bottom: "16px",
        zIndex: "2147483647",
        maxWidth: "46ch",
        padding: "9px 14px",
        borderRadius: "9999px",
        background: "rgba(15,23,42,0.93)",
        color: "#fff",
        font: "500 13px/1.45 ui-sans-serif, system-ui, sans-serif",
        boxShadow: "0 6px 20px rgba(0,0,0,.28)",
        pointerEvents: "none",
        transition: "opacity .15s ease",
      } satisfies Partial<CSSStyleDeclaration>);
      document.body.appendChild(el);
    }
    el.textContent = label;
  }, text);
  // Kept short rather than zero in fast mode: some specs lean on the hold to
  // let a map animation settle.
  await page.waitForTimeout(holdMs);
}

export async function open(
  page: Page,
  ticket: string,
  title: string,
  { showGuidance = false }: { showGuidance?: boolean } = {}
) {
  await resetWorkerProject(test.info().workerIndex);
  // Guidance lives on the user row now, so it is shared by every spec rather
  // than per browser context. Set it before navigating; the app reads it on mount.
  await page.request.post("/api/guidance", { data: { dismissed: !showGuidance } });
  await page.goto("/editor", { waitUntil: "networkidle" });
  await page.waitForSelector("text=MapCanva");
  await step(page, `${ticket} — ${title}`, 1500);
}

/** Match the colour exactly: an antialiased edge in the same hue is a near miss. */
export async function mapPixels(page: Page, rgb: [number, number, number]) {
  return page.evaluate(([r, g, b]) => {
    let count = 0;
    let sumX = 0;
    let sumY = 0;
    for (const canvas of document.querySelectorAll<HTMLCanvasElement>(".ol-viewport canvas")) {
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] === r && data[i + 1] === g && data[i + 2] === b && data[i + 3] === 255) {
          count++;
          sumX += ((i / 4) % width) / width;
          sumY += Math.floor(i / 4 / width) / height;
        }
      }
    }
    return { count, x: count ? sumX / count : null, y: count ? sumY / count : null };
  }, rgb);
}

export async function upload(page: Page, ...files: string[]) {
  await page.locator('input[type="file"]').first().setInputFiles(files);
  await page.waitForTimeout(1800);
}

export async function toMode(page: Page, mode: "Analysis" | "Layout") {
  await page.getByRole("tab", { name: mode }).click();
  await page.waitForTimeout(700);
}

export async function toLayoutTab(page: Page, tab: "Design" | "Page") {
  await page.getByRole("tab", { name: new RegExp(tab) }).click();
  await page.waitForTimeout(500);
}

export async function applyTemplate(page: Page, name: string) {
  await page.getByText(name, { exact: false }).first().click();
  await page.waitForTimeout(1600);
}

export async function setFormat(page: Page, size: "A4" | "A3", orient: "Portrait" | "Landscape") {
  const triggers = page.locator('[data-slot="select-trigger"]');
  await triggers.nth(0).click();
  await page.getByRole("option", { name: size }).click();
  await page.waitForTimeout(900);
  await triggers.nth(1).click();
  await page.getByRole("option", { name: orient }).click();
  await page.waitForTimeout(1400);
}

/**
 * Drags a slider thumb horizontally.
 *
 * Note the selector: Base UI exposes the slider role through a visually hidden
 * `input[type=range]`, so `[role="slider"]` matches nothing in the DOM even
 * though it shows up in the accessibility tree. Target the thumb by its
 * data-slot instead. Dragging also reads better on the recording than
 * click-then-arrow-keys.
 */
export async function dragSlider(page: Page, thumb: Locator, dx: number) {
  const b = (await thumb.boundingBox())!;
  const y = b.y + b.height / 2;
  await page.mouse.move(b.x + b.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + dx, y, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(700);
}

export function regionRows(page: Page, regionName: string) {
  return page.locator("section").filter({ hasText: regionName });
}

/** Sources live in a dialog, so anything driving one opens it first. */
export async function openDataLibrary(page: Page) {
  if (await page.locator("[role=dialog]").count()) return;
  await page.getByRole("button", { name: /Browse the data library/ }).click();
  await page.waitForTimeout(500);
}

/** Pass only the levels you want; stopping at a district imports all of it. */
export async function pickArea(
  page: Page,
  areas: { province: string; regency?: string; district?: string; village?: string }
) {
  await openDataLibrary(page);
  const steps: [string, string | undefined][] = [
    ["Province", areas.province],
    ["City / Regency", areas.regency],
    ["District", areas.district],
    ["Village", areas.village],
  ];
  for (const [label, name] of steps) {
    if (!name) break;
    await page.getByLabel(label).click();
    await page.getByRole("option", { name, exact: true }).click();
    await page.waitForTimeout(700);
  }
}

/** The card disappears before the DELETE lands, so wait for the response. */
export async function removeFirstLayer(page: Page) {
  const deleted = page.waitForResponse(
    (r) => r.url().includes("/api/project/layers/") && r.request().method() === "DELETE"
  );
  await page.getByTitle("Remove layer").first().click();
  await deleted;
}

/** Specs share one project, so each must clear the layers it added. */
export async function removeAllLayers(page: Page) {
  while (await page.getByTitle("Remove layer").count()) {
    await removeFirstLayer(page);
  }
}

export async function searchArea(page: Page, query: string, name: string, level: string, within = "") {
  await page.getByLabel("Cari wilayah").fill(query);
  const row = page
    .locator(".map-dashboard ul button")
    .filter({ has: page.getByText(name, { exact: true }) })
    .filter({ hasText: level })
    .filter({ hasText: within })
    .first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  const outline = page.waitForResponse((r) => r.url().includes("/api/admin-boundaries?pcode="));
  await row.click();
  expect((await outline).ok()).toBe(true);
}

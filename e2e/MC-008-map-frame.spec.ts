import { test } from "./fixtures";
import { open, step, upload, toMode, applyTemplate, GEOJSON } from "./helpers";

test("MC-008 Map frame", async ({ page }) => {
  await open(page, "MC-008", "Map frame");
  await upload(page, GEOJSON);
  await toMode(page, "Layout");
  await applyTemplate(page, "Peta Administrasi");

  const frame = page.locator(".map-frame-handle").first();
  const box = (await frame.boundingBox())!;

  await step(page, "Drag the frame by its EDGE to move it");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 30, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(1400);

  await step(page, "Dragging the MIDDLE pans the map instead — the frame stays put");
  const page_ = (await page.locator("#print-page").boundingBox())!;
  const cx = page_.x + page_.width * 0.3;
  const cy = page_.y + page_.height * 0.45;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 90, cy + 60, { steps: 25 });
  await page.mouse.up();
  await page.waitForTimeout(2000);

  await step(page, "Note: the drag rim is only ~10px — judge the feel yourself", 2600);
});

import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 393, height: 780 },
  hasTouch: true,
  isMobile: true,
  storageState: "/Users/deddysetiawan/Documents/bismillah/map-canva/e2e/.auth/w0.json",
});
const page = await context.newPage();
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") console.log("CONSOLE", m.type(), m.text().slice(0, 200));
});
page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));

await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector(".map-dashboard");
await page.waitForTimeout(2000);

const dialogs = async () => {
  const all = await page.locator("[role=dialog]").all();
  const labels = [];
  for (const d of all) labels.push(await d.getAttribute("aria-label"));
  return labels;
};

console.log("--- tap Katalog (nothing else open) ---");
await page.getByRole("button", { name: "Katalog data" }).tap();
await page.waitForTimeout(150);
console.log("after 150ms:", await dialogs());
await page.waitForTimeout(600);
console.log("after 750ms:", await dialogs());

console.log("--- tap Katalog again (close) ---");
await page.getByRole("button", { name: "Katalog data" }).tap();
await page.waitForTimeout(600);
console.log("closed?", await dialogs());

console.log("--- open fire card, then Katalog ---");
await page.getByRole("button", { name: /^Titik api/ }).tap();
await page.waitForTimeout(500);
console.log("fire open:", await dialogs());
await page.getByRole("button", { name: "Katalog data" }).tap();
await page.waitForTimeout(150);
console.log("after 150ms:", await dialogs());
await page.waitForTimeout(600);
console.log("after 750ms:", await dialogs());

console.log("--- rapid double tap Katalog ---");
await page.getByRole("button", { name: "Katalog data" }).tap();
await page.getByRole("button", { name: "Katalog data" }).tap();
await page.waitForTimeout(700);
console.log("after rapid:", await dialogs());

await page.screenshot({ path: "/private/tmp/claude-501/-Users-deddysetiawan-Documents-bismillah-map-canva/7931fddc-ea20-4b90-8bb5-72673caddb27/scratchpad/katalog-glitch.png" });
await browser.close();

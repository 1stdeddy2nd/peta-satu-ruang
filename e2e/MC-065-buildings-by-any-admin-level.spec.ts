import { test, expect } from "./fixtures";
import { open, pickArea, removeAllLayers, step } from "./helpers";

/** Needs the real Indonesia import, tagged; an untagged database returns none. */
test("MC-065 Get buildings by province, city or district, not only village", async ({ page }) => {
  await open(page, "MC-065", "Buildings by any admin level, not only village");

  await step(page, "Province, city, district, village — the usual nested pickers, in the panel");
  await pickArea(page, { province: "Dki Jakarta" });
  await step(page, "Choosing a province loads the cities inside it");

  await pickArea(page, {
    province: "Dki Jakarta",
    regency: "Kota Jakarta Pusat",
    district: "Gambir",
  });
  await step(page, "Stop at a district — no need to drill all the way to a village");

  await expect(page.getByRole("button", { name: "Import buildings in Gambir" })).toBeEnabled();

  const response = page.waitForResponse((r) => r.url().includes("/api/building-footprints"), {
    timeout: 60_000,
  });
  await page.getByRole("button", { name: "Import buildings in Gambir" }).click();
  expect((await response).status()).toBe(200);

  await expect(page.getByText(/Building footprints \(Gambir\)/).first()).toBeVisible({
    timeout: 60_000,
  });
  await step(page, "A whole district's buildings arrive as one layer", 2500);

  await removeAllLayers(page);

  await step(page, "Province and city are navigation — importing starts at district");
  await pickArea(page, { province: "Bali", regency: "Kota Denpasar" });
  await expect(page.getByRole("button", { name: "Choose a district or village" })).toBeDisabled();
  await step(page, "Picking only province/city leaves nothing to import yet", 2000);
});

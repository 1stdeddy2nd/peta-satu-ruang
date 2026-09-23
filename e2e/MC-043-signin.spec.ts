import { test, expect } from "./fixtures";
import { step } from "./helpers";

// The one spec that must start signed out.
test.use({ storageState: { cookies: [], origins: [] } });

test("MC-043 Sign in with the seeded admin", async ({ page }) => {
  await page.goto("/editor", { waitUntil: "networkidle" });
  await step(page, "MC-043 — Sign in with the seeded admin", 1500);

  await step(page, "Signed out, the editor sends you to sign in", 2200);
  expect(new URL(page.url()).pathname).toBe("/signin");

  await step(page, "A wrong password is rejected");
  await page.getByLabel("Email").fill("admin");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: /Sign in/ }).click();
  await page.waitForTimeout(2200);
  await expect(page.getByText("do not match", { exact: false })).toBeVisible();

  await step(page, "admin / admin — the one seeded account");
  await page.getByLabel("Password").fill("admin");
  await page.getByRole("button", { name: /Sign in/ }).click();
  await page.waitForURL("**/editor", { timeout: 30_000 });
  await page.waitForTimeout(2000);

  await step(page, "Signed in, and the editor loads", 2400);
  await expect(page.getByText("MapCanva").first()).toBeVisible();

  await step(page, "The session survives a reload");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  expect(new URL(page.url()).pathname).toBe("/editor");
  await step(page, "Stored as a bcrypt hash, never the password itself", 2400);
});

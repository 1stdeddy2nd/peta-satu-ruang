import { test, expect } from "./fixtures";
import { step } from "./helpers";

/** Each step's status depends on what this environment has already imported. */
test("MC-063 Composite data pipelines with idempotent steps, visualized as a DAG", async ({
  page,
}) => {
  await page.goto("/admin/pipelines", { waitUntil: "networkidle" });
  await step(page, "MC-063 — Composite data pipelines, visualized as a DAG", 1500);

  await expect(page.getByText("Indonesia reference data")).toBeVisible();
  await step(page, "Three steps, each broken into the processes it runs");
  await expect(page.getByText("Admin boundaries", { exact: true })).toBeVisible();
  await expect(page.getByText("Building footprints", { exact: true })).toBeVisible();
  await expect(page.getByText("Tag buildings by village")).toBeVisible();

  await step(page, "Download and MinIO archiving are their own nodes, not one box");
  await expect(page.getByText("Archive to MinIO").first()).toBeVisible();
  await expect(page.getByText("Import to PostGIS").first()).toBeVisible();

  await step(page, "Run — a step already imported is skipped, not re-downloaded");
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByText(/Queued \d+ step\(s\)|Already up to date/)).toBeVisible({
    timeout: 10_000,
  });
  await step(page, "Status updates in the graph without leaving the page", 1800);
});

import { defineConfig } from "@playwright/test";

// Recording is opt-in: `make verify` sets it to produce one watchable video
// per ticket. The default is a plain parallel run.
const RECORD = process.env.E2E_RECORD === "1";

/**
 * Acceptance walkthroughs (MC-038). These are recordings, not assertions —
 * one spec per ticket, producing one watchable video per ticket.
 */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.output",
  fullyParallel: true,
  workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : undefined,
  retries: 0,
  reporter: [["list"]],
  timeout: 120_000,
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1440, height: 900 },
    video: RECORD ? { mode: "on", size: { width: 1440, height: 900 } } : "off",
    trace: "off",
    // Slow enough that a human can follow what is happening, when recording.
    launchOptions: { slowMo: RECORD ? 220 : 0 },
  },
  // Records against a production build, not dev: a dev server recompiles on
  // demand, which stalls runs badly enough that specs time out. `make verify`
  // refuses to start while a dev server holds the port.
  // No shared `setup` project: each worker signs in as its own user through
  // the fixture in e2e/fixtures.ts, so workers cannot share a project.
  projects: [{ name: "walkthroughs" }],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 240_000,
  },
});

import path from "path";
import { test as base } from "@playwright/test";
import { ensureWorkerUser, workerEmail, WORKER_PASSWORD } from "./worker-project";

const AUTH_DIR = path.join(process.cwd(), "e2e/.auth");

/**
 * Signs each worker in as its own user once, then hands every test in that
 * worker the resulting session. Replaces the single shared `setup` project,
 * which produced one session for everyone and so one project for everyone.
 */
export const test = base.extend<object, { workerStorageState: string }>({
  // Playwright's fixture callback is named `use`; it is not a React hook.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  workerStorageState: [
    async ({ browser }, use, workerInfo) => {
      const index = workerInfo.workerIndex;
      await ensureWorkerUser(index);

      const file = path.join(AUTH_DIR, `w${index}.json`);
      const baseURL = workerInfo.project.use.baseURL;
      const context = await browser.newContext({ storageState: undefined, baseURL });
      const page = await context.newPage();

      await page.goto("/signin", { waitUntil: "networkidle" });
      await page.getByLabel("Email").fill(workerEmail(index));
      await page.getByLabel("Password").fill(WORKER_PASSWORD);
      await page.getByRole("button", { name: /Sign in/ }).click();
      await page.waitForURL("**/editor", { timeout: 60_000 });

      await context.storageState({ path: file });
      await context.close();

      await use(file);
    },
    { scope: "worker" },
  ],
});

export { expect } from "@playwright/test";

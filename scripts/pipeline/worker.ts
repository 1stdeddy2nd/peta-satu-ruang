#!/usr/bin/env -S npx tsx
import pg from "pg";
import { JOB_RUNNERS, type JobProgress, type JobRunner } from "./job-runners";

try {
  process.loadEnvFile();
} catch {
  // no .env file — assume the environment already has what's needed (docker-compose)
}

const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 5000);
const MAX_ATTEMPTS = Number(process.env.WORKER_MAX_ATTEMPTS ?? 5);
const HEARTBEAT_MS = 30_000;

interface JobRow {
  id: string;
  type: string;
  params: Record<string, unknown>;
  status: string;
  attempts: number;
}

function backoffMinutes(attempts: number): number {
  return Math.pow(2, attempts - 1);
}

async function withClient<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/** Claims one due job atomically (SELECT ... FOR UPDATE SKIP LOCKED, so a
 * second worker instance — if one is ever run — can't grab the same job). */
async function claimNextJob(client: pg.Client): Promise<JobRow | null> {
  await client.query("BEGIN");
  try {
    const { rows } = await client.query(
      `
      SELECT * FROM "ImportJob"
      WHERE status = 'pending'
         OR (status = 'failed' AND attempts < $1 AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= now()))
      ORDER BY "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `,
      [MAX_ATTEMPTS]
    );

    const job = rows[0] as JobRow | undefined;
    if (!job) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `UPDATE "ImportJob" SET status = 'running', progress = NULL, "updatedAt" = now() WHERE id = $1`,
      [job.id]
    );
    await client.query("COMMIT");
    return job;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

async function runJob(job: JobRow): Promise<void> {
  const runner = JOB_RUNNERS[job.type];
  if (!runner) {
    throw new Error(`No job runner registered for type "${job.type}"`);
  }

  console.log(`[worker] running job ${job.id} (${job.type})`, job.params);

  // Liveness must not depend on stage progress: extracting a 4.4GB zip,
  // uploading it, and clearing 64M rows each report nothing while they run.
  const heartbeat = setInterval(() => {
    void withClient((client) =>
      client.query(`UPDATE "ImportJob" SET "updatedAt" = now() WHERE id = $1`, [job.id])
    ).catch((err) => console.error(`[worker] heartbeat failed for ${job.id}:`, err));
  }, HEARTBEAT_MS);

  try {
    await runWithProgress(job, runner);
  } finally {
    clearInterval(heartbeat);
  }
}

async function runWithProgress(job: JobRow, runner: JobRunner): Promise<void> {
  const result = await runner(job.params, {
    onProgress: (info: JobProgress) => {
      console.log(`[worker] job ${job.id}:`, info);
      void withClient((client) =>
        client.query(`UPDATE "ImportJob" SET progress = $2, "updatedAt" = now() WHERE id = $1`, [
          job.id,
          JSON.stringify(info),
        ])
      ).catch((err) => console.error(`[worker] failed to persist progress for ${job.id}:`, err));
    },
  });
  console.log(`[worker] job ${job.id} done:`, result);

  await withClient((client) =>
    client.query(
      `UPDATE "ImportJob"
       SET status = 'done', "lastError" = NULL, "archiveKey" = $2, "updatedAt" = now()
       WHERE id = $1`,
      [job.id, result.archiveKey ?? null]
    )
  );
}

async function failJob(job: JobRow, err: unknown): Promise<void> {
  const attempts = job.attempts + 1;
  const nextAttemptAt =
    attempts < MAX_ATTEMPTS ? new Date(Date.now() + backoffMinutes(attempts) * 60_000) : null;

  console.error(`[worker] job ${job.id} failed (attempt ${attempts}/${MAX_ATTEMPTS}):`, err);

  const message = err instanceof Error ? err.message : String(err);
  await withClient((client) =>
    client.query(
      `UPDATE "ImportJob"
       SET status = 'failed', attempts = $2, "lastError" = $3, "nextAttemptAt" = $4, "updatedAt" = now()
       WHERE id = $1`,
      [job.id, attempts, message, nextAttemptAt]
    )
  );
}

async function tick(): Promise<void> {
  const job = await withClient(claimNextJob);
  if (!job) return;

  try {
    await runJob(job);
  } catch (err) {
    await failJob(job, err);
  }
}

/** Resets a job stuck "running" from a previous instance dying mid-job —
 * only valid because a single worker instance is ever expected to run. */
async function reclaimOrphanedJobs() {
  const { rowCount } = await withClient((client) =>
    client.query(`UPDATE "ImportJob" SET status = 'pending', "updatedAt" = now() WHERE status = 'running'`)
  );
  if (rowCount) console.log(`[worker] reclaimed ${rowCount} orphaned running job(s)`);
}

async function main() {
  console.log(`[worker] started, polling every ${POLL_INTERVAL_MS}ms`);
  await reclaimOrphanedJobs();
  for (;;) {
    try {
      await tick();
    } catch (err) {
      console.error("[worker] tick failed:", err);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main();

import pg from "pg";
import { from as copyFrom } from "pg-copy-streams";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

export function csvField(value: unknown): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

/** Empty and unquoted is how CSV COPY spells NULL; quoting stores "" instead. */
export function csvFieldOrNull(value: unknown): string {
  return value == null ? "" : csvField(value);
}

export async function execRaw(sql: string, params: unknown[] = []) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return await client.query(sql, params);
  } finally {
    await client.end();
  }
}

/** One connection per call — callers must not run batches concurrently. */
export async function copyRows(table: string, columns: string[], rows: string[]) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const stream = client.query(
      copyFrom(`COPY "${table}" (${columns.map((c) => `"${c}"`).join(", ")}) FROM STDIN WITH (FORMAT csv)`)
    );
    const source = Readable.from(rows.map((r) => r + "\n"));
    await pipeline(source, stream);
  } finally {
    await client.end();
  }
}

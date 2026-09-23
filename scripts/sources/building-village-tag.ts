import pg from "pg";

export interface TagResult {
  tagged: number;
}

export interface TagProgress {
  stage: "tagging";
  processed: number;
  total: number;
  percent: number;
  tagged: number;
  [key: string]: unknown;
}

const VILLAGE_BATCH_SIZE = 200;
const CONCURRENCY = Number(process.env.TAG_CONCURRENCY ?? 6);

const UPDATE_BATCH = `
  UPDATE "BuildingFootprint" bf
  SET "villagePcode"  = v.pcode,
      "districtPcode" = v.properties ->> 'adm3_pcode',
      "regencyPcode"  = v.properties ->> 'adm2_pcode',
      "provincePcode" = v.properties ->> 'adm1_pcode'
  FROM "AdminBoundary" v
  WHERE v.id = ANY($1::text[])
    AND bf.source = $2
    AND bf."villagePcode" IS NULL
    AND bf.geom && v.geom
    AND ST_Contains(v.geom, ST_PointOnSurface(bf.geom))
`;

/**
 * Driven from villages, not buildings: inverting the loop makes the planner
 * re-scan the whole building table once per boundary.
 *
 * Point-in-polygon, not ST_Intersects: 2.1% of buildings straddle a border, so
 * intersection is non-deterministic and deadlocks concurrent batches.
 */
export async function tagBuildingsByVillage(
  source: string,
  onProgress?: (info: TagProgress) => void
): Promise<TagResult> {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: CONCURRENCY,
  });

  try {
    const { rows: villages } = await pool.query<{ id: string }>(
      `SELECT id FROM "AdminBoundary" WHERE level = 4 ORDER BY id`
    );
    const total = villages.length;

    const batches: string[][] = [];
    for (let i = 0; i < total; i += VILLAGE_BATCH_SIZE) {
      batches.push(villages.slice(i, i + VILLAGE_BATCH_SIZE).map((v) => v.id));
    }

    let next = 0;
    let processed = 0;
    let tagged = 0;
    // Each callback opens a connection, so throttle it.
    let lastReport = 0;
    const report = (force: boolean) => {
      const now = Date.now();
      if (!force && now - lastReport < 1000) return;
      lastReport = now;
      onProgress?.({
        stage: "tagging",
        processed,
        total,
        tagged,
        percent: total > 0 ? Math.round((processed / total) * 100) : 100,
      });
    };

    const runOne = async (ids: string[]) => {
      for (let attempt = 1; ; attempt++) {
        try {
          return await pool.query(UPDATE_BATCH, [ids, source]);
        } catch (err) {
          // Retrying a whole batch is safe: tagged rows drop out of the filter.
          const code = (err as { code?: string }).code;
          if ((code === "40P01" || code === "40001") && attempt < 5) {
            await new Promise((r) => setTimeout(r, 250 * attempt));
            continue;
          }
          throw err;
        }
      }
    };

    const worker = async () => {
      for (;;) {
        const index = next++;
        if (index >= batches.length) return;
        const ids = batches[index];
        const result = await runOne(ids);

        tagged += result.rowCount ?? 0;
        processed += ids.length;
        report(false);
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    report(true);

    return { tagged };
  } finally {
    await pool.end();
  }
}

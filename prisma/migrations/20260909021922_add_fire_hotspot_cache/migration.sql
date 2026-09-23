-- CreateTable
CREATE TABLE "FireHotspotCache" (
    "id" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "attribution" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FireHotspotCache_pkey" PRIMARY KEY ("id")
);

-- Prisma's DSL can't express these GiST indexes (Unsupported("geometry(...)")
-- columns), so it sees them as drift on every migration and wants to drop
-- them again here (03-gotchas.md). Re-asserted so a fresh `migrate deploy`
-- keeps them instead of silently losing spatial-query performance.
CREATE INDEX IF NOT EXISTS "AdminBoundary_geom_idx" ON "AdminBoundary" USING GIST ("geom");
CREATE INDEX IF NOT EXISTS "BuildingFootprint_geom_idx" ON "BuildingFootprint" USING GIST ("geom");

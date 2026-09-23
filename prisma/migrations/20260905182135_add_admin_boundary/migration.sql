-- CreateTable
CREATE TABLE "AdminBoundary" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "properties" JSONB NOT NULL,
    "geom" geometry(Geometry, 3857) NOT NULL,

    CONSTRAINT "AdminBoundary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminBoundary_level_idx" ON "AdminBoundary"("level");

-- CreateIndex
CREATE INDEX "AdminBoundary_name_idx" ON "AdminBoundary"("name");

-- Spatial index. Not optional — same reasoning as BuildingFootprint's own:
-- a clip query against 81,912 village polygons without one is a full scan.
CREATE INDEX "AdminBoundary_geom_idx" ON "AdminBoundary" USING GIST ("geom");

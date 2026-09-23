-- CreateTable
CREATE TABLE "BuildingFootprint" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "properties" JSONB NOT NULL,
    "geom" geometry(Geometry, 3857) NOT NULL,

    CONSTRAINT "BuildingFootprint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuildingFootprint_source_idx" ON "BuildingFootprint"("source");

-- Spatial index. Not optional: a bbox query against tens of millions of
-- rows without one is a full sequential scan.
CREATE INDEX "BuildingFootprint_geom_idx" ON "BuildingFootprint" USING GIST ("geom");

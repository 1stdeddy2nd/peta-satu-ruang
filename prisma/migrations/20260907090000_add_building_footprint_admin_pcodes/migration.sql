-- AlterTable
ALTER TABLE "BuildingFootprint" ADD COLUMN     "provincePcode" TEXT,
ADD COLUMN     "regencyPcode" TEXT,
ADD COLUMN     "districtPcode" TEXT,
ADD COLUMN     "villagePcode" TEXT;

-- AlterTable
ALTER TABLE "AdminBoundary" ADD COLUMN     "pcode" TEXT,
ADD COLUMN     "parentPcode" TEXT;

-- Backfill the two new AdminBoundary columns out of the properties blob they
-- already live in, so this migration does not depend on a re-import to be
-- useful. The importer sets them directly from now on.
UPDATE "AdminBoundary"
SET "pcode" = properties ->> ('adm' || level || '_pcode'),
    "parentPcode" = CASE WHEN level > 1 THEN properties ->> ('adm' || (level - 1) || '_pcode') END;

-- CreateIndex
-- Partial, and raw SQL rather than Prisma's DSL, which cannot express it.
-- Nothing queries these columns for NULL, so indexing the untagged rows would
-- only bloat the index -- and worse: with a plain index the planner BitmapAnds
-- `villagePcode IS NULL` (all 64M rows) into the tagging step's own UPDATE,
-- once per village, which is exactly what made that step unusable.
CREATE INDEX "BuildingFootprint_provincePcode_idx" ON "BuildingFootprint"("provincePcode") WHERE "provincePcode" IS NOT NULL;
CREATE INDEX "BuildingFootprint_regencyPcode_idx" ON "BuildingFootprint"("regencyPcode") WHERE "regencyPcode" IS NOT NULL;
CREATE INDEX "BuildingFootprint_districtPcode_idx" ON "BuildingFootprint"("districtPcode") WHERE "districtPcode" IS NOT NULL;
CREATE INDEX "BuildingFootprint_villagePcode_idx" ON "BuildingFootprint"("villagePcode") WHERE "villagePcode" IS NOT NULL;

-- CreateIndex
CREATE INDEX "AdminBoundary_pcode_idx" ON "AdminBoundary"("pcode");

-- CreateIndex
CREATE INDEX "AdminBoundary_parentPcode_idx" ON "AdminBoundary"("parentPcode");

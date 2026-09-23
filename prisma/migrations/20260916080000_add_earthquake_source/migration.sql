-- AlterTable
ALTER TABLE "EarthquakeEvent" ADD COLUMN "source" TEXT;
UPDATE "EarthquakeEvent" SET "source" = 'bmkg' WHERE "source" IS NULL;
ALTER TABLE "EarthquakeEvent" ALTER COLUMN "source" SET NOT NULL;

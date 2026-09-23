-- CreateTable
CREATE TABLE "EarthquakeCache" (
    "id" TEXT NOT NULL,
    "events" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EarthquakeCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarthquakeEvent" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "magnitude" DOUBLE PRECISION NOT NULL,
    "depthKm" DOUBLE PRECISION NOT NULL,
    "area" TEXT NOT NULL,
    "potential" TEXT,
    "felt" TEXT,
    "shakemapUrl" TEXT,

    CONSTRAINT "EarthquakeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EarthquakeEvent_occurredAt_idx" ON "EarthquakeEvent"("occurredAt");

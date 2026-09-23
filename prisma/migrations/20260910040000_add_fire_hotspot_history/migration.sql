-- CreateTable
CREATE TABLE "FireHotspot" (
    "key" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "day" DATE NOT NULL,
    "confidence" TEXT NOT NULL,
    "band" TEXT NOT NULL,
    "sensor" TEXT NOT NULL,
    "satellite" TEXT NOT NULL,
    "brightnessK" DOUBLE PRECISION,
    "frpMw" DOUBLE PRECISION,

    CONSTRAINT "FireHotspot_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "FireHotspot_day_idx" ON "FireHotspot"("day");

-- CreateIndex
CREATE INDEX "FireHotspot_day_band_idx" ON "FireHotspot"("day", "band");

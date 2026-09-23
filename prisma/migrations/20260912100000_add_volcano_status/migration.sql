-- CreateTable
CREATE TABLE "VolcanoCatalogCache" (
    "id" TEXT NOT NULL,
    "volcanoes" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolcanoCatalogCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolcanoEventCache" (
    "id" TEXT NOT NULL,
    "events" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolcanoEventCache_pkey" PRIMARY KEY ("id")
);

-- PostGIS must exist before the geometry column below. The docker image
-- already ships it; this makes the migration self-sufficient on a plain
-- Postgres such as Railway.
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Untitled map',
    "ownerKey" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Layer" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "geometryType" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "attributes" JSONB NOT NULL DEFAULT '[]',
    "styleMode" TEXT NOT NULL DEFAULT 'single',
    "categoryField" TEXT,
    "categories" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "Layer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "layerId" TEXT NOT NULL,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "geom" geometry(Geometry, 3857) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_ownerKey_updatedAt_idx" ON "Project"("ownerKey", "updatedAt");

-- CreateIndex
CREATE INDEX "Layer_projectId_sortOrder_idx" ON "Layer"("projectId", "sortOrder");

-- CreateIndex
CREATE INDEX "Feature_layerId_idx" ON "Feature"("layerId");

-- AddForeignKey
ALTER TABLE "Layer" ADD CONSTRAINT "Layer_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_layerId_fkey" FOREIGN KEY ("layerId") REFERENCES "Layer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "FireHotspot" ADD COLUMN "villagePcode" TEXT;

-- CreateIndex
CREATE INDEX "FireHotspot_villagePcode_idx" ON "FireHotspot"("villagePcode");

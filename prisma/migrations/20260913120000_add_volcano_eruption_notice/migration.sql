-- CreateTable
CREATE TABLE "VolcanoEruptionNotice" (
    "id" TEXT NOT NULL,
    "volcanoName" TEXT NOT NULL,
    "eruptedAt" TIMESTAMP(3) NOT NULL,
    "ashColumnM" INTEGER,
    "ashDirection" TEXT,

    CONSTRAINT "VolcanoEruptionNotice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VolcanoEruptionNotice_eruptedAt_idx" ON "VolcanoEruptionNotice"("eruptedAt");

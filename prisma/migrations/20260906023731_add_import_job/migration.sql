-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('pending', 'running', 'done', 'failed');

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "status" "ImportJobStatus" NOT NULL,
    "attempts" INTEGER NOT NULL,
    "lastError" TEXT,
    "nextAttemptAt" TIMESTAMP(3),
    "archiveKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportJob_status_nextAttemptAt_idx" ON "ImportJob"("status", "nextAttemptAt");

/*
  Warnings:

  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- AlterTable
ALTER TABLE "Feature" ALTER COLUMN "properties" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Layer" ALTER COLUMN "opacity" DROP DEFAULT,
ALTER COLUMN "visible" DROP DEFAULT,
ALTER COLUMN "sortOrder" DROP DEFAULT,
ALTER COLUMN "attributes" DROP DEFAULT,
ALTER COLUMN "styleMode" DROP DEFAULT,
ALTER COLUMN "categories" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "name" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" DROP DEFAULT,
ALTER COLUMN "guidanceDismissed" DROP DEFAULT;

-- The existing text default cannot be cast to the enum, so it has to go before
-- the type change rather than with it.
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::text::"Role";

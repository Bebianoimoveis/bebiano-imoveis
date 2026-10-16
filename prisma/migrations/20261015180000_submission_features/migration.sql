-- AlterTable
ALTER TABLE "PropertySubmission" ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[];


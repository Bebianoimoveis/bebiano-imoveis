-- CreateEnum
CREATE TYPE "SubmissionFileKind" AS ENUM ('DOCUMENT', 'VIDEO');

-- AlterTable
ALTER TABLE "PropertySubmission" ADD COLUMN     "bathrooms" INTEGER,
ADD COLUMN     "bedrooms" INTEGER,
ADD COLUMN     "builtArea" DECIMAL(8,2),
ADD COLUMN     "kitchens" INTEGER,
ADD COLUMN     "livingRooms" INTEGER,
ADD COLUMN     "parkingSpots" INTEGER,
ADD COLUMN     "suites" INTEGER,
ADD COLUMN     "totalArea" DECIMAL(8,2);

-- CreateTable
CREATE TABLE "PropertySubmissionFile" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "kind" "SubmissionFileKind" NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertySubmissionFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertySubmissionFile_submissionId_idx" ON "PropertySubmissionFile"("submissionId");

-- AddForeignKey
ALTER TABLE "PropertySubmissionFile" ADD CONSTRAINT "PropertySubmissionFile_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "PropertySubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;


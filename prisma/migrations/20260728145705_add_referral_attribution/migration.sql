-- CreateEnum
CREATE TYPE "LeadDistributionMode" AS ENUM ('FIXED', 'ROUND_ROBIN');

-- AlterTable
ALTER TABLE "Realtor" ADD COLUMN "slug" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "visitorId" TEXT,
ADD COLUMN "referralSource" TEXT,
ADD COLUMN "landingUrl" TEXT,
ADD COLUMN "utmSource" TEXT,
ADD COLUMN "utmMedium" TEXT,
ADD COLUMN "utmCampaign" TEXT;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "defaultRealtorId" TEXT,
ADD COLUMN "leadDistributionMode" "LeadDistributionMode" NOT NULL DEFAULT 'FIXED',
ADD COLUMN "roundRobinLastRealtorId" TEXT;

-- CreateTable
CREATE TABLE "VisitorAttribution" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "realtorId" TEXT NOT NULL,
    "referralSource" TEXT NOT NULL,
    "landingUrl" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "firstVisitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVisitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "overriddenByUserId" TEXT,
    "overriddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Realtor_slug_key" ON "Realtor"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorAttribution_visitorId_key" ON "VisitorAttribution"("visitorId");

-- CreateIndex
CREATE INDEX "VisitorAttribution_realtorId_idx" ON "VisitorAttribution"("realtorId");

-- CreateIndex
CREATE INDEX "Lead_visitorId_idx" ON "Lead"("visitorId");

-- AddForeignKey
ALTER TABLE "VisitorAttribution" ADD CONSTRAINT "VisitorAttribution_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "Realtor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "VisitorAttribution"("visitorId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_defaultRealtorId_fkey" FOREIGN KEY ("defaultRealtorId") REFERENCES "Realtor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

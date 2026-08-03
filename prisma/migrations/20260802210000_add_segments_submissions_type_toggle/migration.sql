-- Segmentos administráveis na home, captação de "quero vender meu imóvel"
-- e toggle de visibilidade por tipo de imóvel / interruptor de locação.

ALTER TABLE "PropertyType" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "SiteSettings" ADD COLUMN "rentalEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "Segment" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  "icon" TEXT NOT NULL DEFAULT 'Home',
  "imageUrl" TEXT,
  "propertyTypeId" TEXT,
  "purpose" "Purpose",
  "isLaunch" BOOLEAN NOT NULL DEFAULT false,
  "gatedCommunity" BOOLEAN NOT NULL DEFAULT false,
  "minPrice" DECIMAL(12,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Segment_slug_key" ON "Segment"("slug");
CREATE INDEX "Segment_active_order_idx" ON "Segment"("active", "order");

ALTER TABLE "Segment" ADD CONSTRAINT "Segment_propertyTypeId_fkey" FOREIGN KEY ("propertyTypeId") REFERENCES "PropertyType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "PropertySubmissionStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'DECLINED');

CREATE TABLE "PropertySubmission" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "purpose" "Purpose" NOT NULL DEFAULT 'SALE',
  "typeId" TEXT,
  "cityId" TEXT,
  "neighborhoodText" TEXT,
  "description" TEXT NOT NULL,
  "askingPrice" DECIMAL(12,2),
  "status" "PropertySubmissionStatus" NOT NULL DEFAULT 'NEW',
  "notes" TEXT,
  "convertedPropertyId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PropertySubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PropertySubmission_convertedPropertyId_key" ON "PropertySubmission"("convertedPropertyId");
CREATE INDEX "PropertySubmission_status_idx" ON "PropertySubmission"("status");

ALTER TABLE "PropertySubmission" ADD CONSTRAINT "PropertySubmission_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "PropertyType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PropertySubmission" ADD CONSTRAINT "PropertySubmission_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PropertySubmission" ADD CONSTRAINT "PropertySubmission_convertedPropertyId_fkey" FOREIGN KEY ("convertedPropertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PropertySubmissionImage" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PropertySubmissionImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PropertySubmissionImage_submissionId_idx" ON "PropertySubmissionImage"("submissionId");

ALTER TABLE "PropertySubmissionImage" ADD CONSTRAINT "PropertySubmissionImage_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "PropertySubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Novas permissões "submission.manage" e "segment.manage" (ver
-- prisma/seed.ts, concedidas a ADMIN e MANAGER) são criadas pelo seed
-- idempotente, não aqui — rodar `npm run db:seed` após esta migração,
-- em dev e produção.

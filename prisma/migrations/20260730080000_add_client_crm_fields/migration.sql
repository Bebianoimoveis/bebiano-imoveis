-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('BUYER', 'SELLER', 'TENANT', 'INVESTOR');
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable: Client — novos campos de perfil
ALTER TABLE "Client"
  ADD COLUMN "code" TEXT,
  ADD COLUMN "cpf" TEXT,
  ADD COLUMN "rg" TEXT,
  ADD COLUMN "birthDate" TIMESTAMP(3),
  ADD COLUMN "profession" TEXT,
  ADD COLUMN "maritalStatus" TEXT,
  ADD COLUMN "street" TEXT,
  ADD COLUMN "number" TEXT,
  ADD COLUMN "zipCode" TEXT,
  ADD COLUMN "cityId" TEXT,
  ADD COLUMN "types" "ClientType"[] DEFAULT ARRAY[]::"ClientType"[],
  ADD COLUMN "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "vip" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "origin" TEXT,
  ADD COLUMN "realtorId" TEXT,
  ADD COLUMN "lastInteractionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill: gera um código sequencial CL-0001, CL-0002... para clientes
-- já existentes, na ordem de criação, antes de tornar a coluna obrigatória.
UPDATE "Client" AS c
SET "code" = 'CL-' || LPAD(sub.rn::TEXT, 4, '0')
FROM (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS rn
  FROM "Client"
) AS sub
WHERE c."id" = sub."id";

ALTER TABLE "Client" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "Client_code_key" ON "Client"("code");

ALTER TABLE "Client" ADD CONSTRAINT "Client_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "Realtor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Client_realtorId_idx" ON "Client"("realtorId");

-- CreateTable: ClientPreference
CREATE TABLE "ClientPreference" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "propertyTypeId" TEXT,
  "purpose" "Purpose",
  "minValue" DECIMAL(12,2),
  "maxValue" DECIMAL(12,2),
  "cityId" TEXT,
  "neighborhoodId" TEXT,
  "bedrooms" INTEGER,
  "minArea" DECIMAL(8,2),
  "pool" BOOLEAN NOT NULL DEFAULT false,
  "gatedCommunity" BOOLEAN NOT NULL DEFAULT false,
  "acceptsFinancing" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClientPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientPreference_clientId_key" ON "ClientPreference"("clientId");

ALTER TABLE "ClientPreference" ADD CONSTRAINT "ClientPreference_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientPreference" ADD CONSTRAINT "ClientPreference_propertyTypeId_fkey" FOREIGN KEY ("propertyTypeId") REFERENCES "PropertyType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClientPreference" ADD CONSTRAINT "ClientPreference_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClientPreference" ADD CONSTRAINT "ClientPreference_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: ClientInteraction
CREATE TABLE "ClientInteraction" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "LeadInteractionType" NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ClientInteraction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClientInteraction_clientId_idx" ON "ClientInteraction"("clientId");

ALTER TABLE "ClientInteraction" ADD CONSTRAINT "ClientInteraction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientInteraction" ADD CONSTRAINT "ClientInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

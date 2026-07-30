-- Centro Financeiro Inteligente: status/forma de pagamento/vínculos diretos
-- em FinancialEntry, timeline (FinancialEntryInteraction) e Metas (Goal).

CREATE TYPE "FinancialEntryStatus" AS ENUM ('PENDING', 'SCHEDULED', 'PARTIAL', 'PAID', 'CANCELED');

CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'TED', 'CARD', 'CASH', 'BOLETO', 'TRANSFER', 'CHECK');

CREATE TYPE "GoalScope" AS ENUM ('COMPANY', 'REALTOR', 'CITY');

-- Novos campos em FinancialEntry
ALTER TABLE "FinancialEntry"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "paidAmount" DECIMAL(12,2),
  ADD COLUMN "status" "FinancialEntryStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "paymentMethod" "PaymentMethod",
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "attachmentUrl" TEXT,
  ADD COLUMN "attachmentName" TEXT,
  ADD COLUMN "clientId" TEXT,
  ADD COLUMN "realtorId" TEXT,
  ADD COLUMN "propertyId" TEXT;

-- Backfill honesto: lançamentos já pagos viram PAID, o resto fica PENDING
-- (o default já cobre PENDING, este UPDATE só cobre os já quitados).
UPDATE "FinancialEntry" SET "status" = 'PAID' WHERE "paidAt" IS NOT NULL;

ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "Realtor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "FinancialEntry_status_idx" ON "FinancialEntry"("status");
CREATE INDEX "FinancialEntry_realtorId_idx" ON "FinancialEntry"("realtorId");
CREATE INDEX "FinancialEntry_clientId_idx" ON "FinancialEntry"("clientId");
CREATE INDEX "FinancialEntry_propertyId_idx" ON "FinancialEntry"("propertyId");

-- CreateTable: FinancialEntryInteraction
CREATE TABLE "FinancialEntryInteraction" (
  "id" TEXT NOT NULL,
  "entryId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "LeadInteractionType" NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FinancialEntryInteraction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FinancialEntryInteraction_entryId_idx" ON "FinancialEntryInteraction"("entryId");

ALTER TABLE "FinancialEntryInteraction" ADD CONSTRAINT "FinancialEntryInteraction_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "FinancialEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FinancialEntryInteraction" ADD CONSTRAINT "FinancialEntryInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: Goal
CREATE TABLE "Goal" (
  "id" TEXT NOT NULL,
  "scope" "GoalScope" NOT NULL DEFAULT 'COMPANY',
  "year" INTEGER NOT NULL,
  "month" INTEGER,
  "targetAmount" DECIMAL(12,2) NOT NULL,
  "realtorId" TEXT,
  "cityId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Goal_scope_year_month_idx" ON "Goal"("scope", "year", "month");

ALTER TABLE "Goal" ADD CONSTRAINT "Goal_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "Realtor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

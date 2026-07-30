-- Recria o enum ProposalStatus (4 -> 9 valores), mapeando os dados
-- existentes: OPEN vira SENT (proposta já criada presumivelmente já foi
-- comunicada ao cliente), os demais mantêm o mesmo valor.
ALTER TYPE "ProposalStatus" RENAME TO "ProposalStatus_old";

CREATE TYPE "ProposalStatus" AS ENUM (
  'DRAFT', 'SENT', 'VIEWED', 'NEGOTIATING', 'ACCEPTED', 'REJECTED', 'SIGNING', 'COMPLETED', 'CANCELED'
);

ALTER TABLE "Proposal" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Proposal"
  ALTER COLUMN "status" TYPE "ProposalStatus"
  USING (
    CASE "status"::text
      WHEN 'OPEN' THEN 'SENT'
      WHEN 'ACCEPTED' THEN 'ACCEPTED'
      WHEN 'REJECTED' THEN 'REJECTED'
      WHEN 'CANCELED' THEN 'CANCELED'
    END
  )::"ProposalStatus";

ALTER TABLE "Proposal" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

DROP TYPE "ProposalStatus_old";

-- Novos campos do Wizard/pipeline/link público
ALTER TABLE "Proposal"
  ADD COLUMN "originalValue" DECIMAL(12,2),
  ADD COLUMN "downPayment" DECIMAL(12,2),
  ADD COLUMN "financingValue" DECIMAL(12,2),
  ADD COLUMN "fgtsValue" DECIMAL(12,2),
  ADD COLUMN "installments" INTEGER,
  ADD COLUMN "installmentValue" DECIMAL(12,2),
  ADD COLUMN "commissionPercent" DECIMAL(5,2),
  ADD COLUMN "paymentMethod" TEXT,
  ADD COLUMN "validUntil" TIMESTAMP(3),
  ADD COLUMN "shareToken" TEXT,
  ADD COLUMN "sentAt" TIMESTAMP(3),
  ADD COLUMN "viewedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Proposal_shareToken_key" ON "Proposal"("shareToken");

-- CreateTable: ProposalInteraction
CREATE TABLE "ProposalInteraction" (
  "id" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "LeadInteractionType" NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProposalInteraction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProposalInteraction_proposalId_idx" ON "ProposalInteraction"("proposalId");

ALTER TABLE "ProposalInteraction" ADD CONSTRAINT "ProposalInteraction_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProposalInteraction" ADD CONSTRAINT "ProposalInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

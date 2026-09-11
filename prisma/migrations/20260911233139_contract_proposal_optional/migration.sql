-- DropForeignKey
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_proposalId_fkey";

-- AlterTable
ALTER TABLE "Contract" ALTER COLUMN "proposalId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

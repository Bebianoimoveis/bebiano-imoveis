-- Limite de tentativas compartilhado e índices das telas mais usadas.
-- Idempotente: pode rodar de novo sem erro.
CREATE TABLE IF NOT EXISTS "RateLimitBucket" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "resetAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);
CREATE INDEX IF NOT EXISTS "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt");
CREATE INDEX IF NOT EXISTS "Proposal_realtorId_status_idx" ON "Proposal"("realtorId", "status");
CREATE INDEX IF NOT EXISTS "Proposal_clientId_idx" ON "Proposal"("clientId");
CREATE INDEX IF NOT EXISTS "Proposal_createdAt_idx" ON "Proposal"("createdAt");
CREATE INDEX IF NOT EXISTS "Contract_realtorId_status_idx" ON "Contract"("realtorId", "status");
CREATE INDEX IF NOT EXISTS "Contract_clientId_idx" ON "Contract"("clientId");
CREATE INDEX IF NOT EXISTS "Contract_propertyId_idx" ON "Contract"("propertyId");
CREATE INDEX IF NOT EXISTS "Contract_createdAt_idx" ON "Contract"("createdAt");

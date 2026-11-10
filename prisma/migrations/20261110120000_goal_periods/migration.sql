-- Metas com período livre (mês, trimestre, ano, acumulado até o mês,
-- todo mês, de/até) e a métrica "valor vendido" (SALES_VALUE).
-- Escrita idempotente: pode ser rodada de novo sem erro.

-- AlterEnum
ALTER TYPE "GoalMetric" ADD VALUE IF NOT EXISTS 'SALES_VALUE';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "GoalPeriod" AS ENUM ('MONTH', 'QUARTER', 'YEAR', 'YEAR_TO_MONTH', 'MONTHLY', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "period" "GoalPeriod" NOT NULL DEFAULT 'MONTH';
ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3);
ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3);

-- Metas antigas: month preenchido = meta daquele mês; month vazio = ano inteiro.
UPDATE "Goal"
SET
  "period" = (CASE WHEN "month" IS NULL THEN 'YEAR' ELSE 'MONTH' END)::"GoalPeriod",
  "startDate" = make_date("year", COALESCE("month", 1), 1),
  "endDate" = CASE
    WHEN "month" IS NULL THEN make_date("year", 12, 31)
    ELSE (make_date("year", "month", 1) + INTERVAL '1 month' - INTERVAL '1 day')
  END
WHERE "startDate" IS NULL OR "endDate" IS NULL;

ALTER TABLE "Goal" ALTER COLUMN "startDate" SET NOT NULL;
ALTER TABLE "Goal" ALTER COLUMN "endDate" SET NOT NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Goal_startDate_endDate_idx" ON "Goal"("startDate", "endDate");

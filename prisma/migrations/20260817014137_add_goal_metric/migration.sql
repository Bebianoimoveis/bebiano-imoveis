-- CreateEnum
CREATE TYPE "GoalMetric" AS ENUM ('REVENUE', 'SALES_COUNT');

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN "metric" "GoalMetric" NOT NULL DEFAULT 'REVENUE';

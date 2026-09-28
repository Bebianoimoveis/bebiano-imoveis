CREATE TABLE "FinancialInsight" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialInsight_pkey" PRIMARY KEY ("id")
);

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "App" ADD COLUMN     "embedding" vector(384);

-- CreateTable
CREATE TABLE "MarketTrend" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'Google Trends',
    "query" TEXT NOT NULL,
    "trendDirection" TEXT,
    "growthPercent" INTEGER,
    "currentInterest" INTEGER,
    "averageInterest" INTEGER,
    "timelineData" JSONB,
    "regionalData" JSONB,
    "relatedQueries" JSONB,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketTrend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketCache" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketTrend_appId_key" ON "MarketTrend"("appId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketCache_key_key" ON "MarketCache"("key");

-- AddForeignKey
ALTER TABLE "MarketTrend" ADD CONSTRAINT "MarketTrend_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;


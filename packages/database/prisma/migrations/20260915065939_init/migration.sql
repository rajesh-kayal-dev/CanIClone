-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('yes', 'kinda', 'no');

-- CreateTable
CREATE TABLE "App" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "tagline" TEXT,
    "priceMonthly" DECIMAL(10,2),
    "verdict" "Verdict" NOT NULL,
    "verdictConfidence" TEXT,
    "verdictSummary" TEXT,
    "coreLoopDIY" TEXT,
    "diyTimeEstimate" TEXT,
    "requirements" JSONB,
    "whatYouLose" JSONB,
    "moatTags" JSONB,
    "moatNotes" TEXT,
    "whyPeopleStillPay" TEXT,
    "priorArt" JSONB,
    "rejectedAlternatives" JSONB,
    "relatedSlugs" JSONB,
    "prompt" TEXT,
    "promptCurated" BOOLEAN NOT NULL DEFAULT false,
    "pagePriority" INTEGER NOT NULL DEFAULT 3,
    "verifiedOneShot" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "App_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingPlan" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthly" DECIMAL(10,2),
    "annualPerMonth" DECIMAL(10,2),
    "per" TEXT,
    "limits" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alternative" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "repo" TEXT,
    "platforms" JSONB,
    "description" TEXT,
    "stars" INTEGER,
    "lastCommit" TEXT,
    "selfHost" TEXT,
    "checkedOn" TEXT,
    "facts" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alternative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "buildabilityScore" INTEGER,
    "complexity" TEXT,
    "estimatedEffort" TEXT,
    "requiredFeatures" JSONB,
    "recommendedStack" JSONB,
    "limitations" JSONB,
    "buildPlan" JSONB,
    "generatedPrompt" TEXT,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "App_slug_key" ON "App"("slug");

-- CreateIndex
CREATE INDEX "App_category_idx" ON "App"("category");

-- CreateIndex
CREATE INDEX "App_verdict_idx" ON "App"("verdict");

-- CreateIndex
CREATE INDEX "App_name_idx" ON "App"("name");

-- CreateIndex
CREATE INDEX "PricingPlan_appId_idx" ON "PricingPlan"("appId");

-- CreateIndex
CREATE INDEX "Alternative_appId_idx" ON "Alternative"("appId");

-- CreateIndex
CREATE INDEX "AIAnalysis_appId_idx" ON "AIAnalysis"("appId");

-- AddForeignKey
ALTER TABLE "PricingPlan" ADD CONSTRAINT "PricingPlan_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternative" ADD CONSTRAINT "Alternative_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AppAIConversation" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "anonymousUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppAIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppAIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'chat',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppAIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppAIResearch" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "results" JSONB,
    "analysis" TEXT,
    "status" TEXT NOT NULL DEFAULT 'complete',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppAIResearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppAIPrompt" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppAIPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppAIMvp" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppAIMvp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppAIConversation_appId_anonymousUserId_key" ON "AppAIConversation"("appId", "anonymousUserId");

-- CreateIndex
CREATE INDEX "AppAIConversation_anonymousUserId_idx" ON "AppAIConversation"("anonymousUserId");

-- CreateIndex
CREATE INDEX "AppAIMessage_conversationId_createdAt_idx" ON "AppAIMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AppAIResearch_conversationId_createdAt_idx" ON "AppAIResearch"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AppAIPrompt_conversationId_updatedAt_idx" ON "AppAIPrompt"("conversationId", "updatedAt");

-- CreateIndex
CREATE INDEX "AppAIMvp_conversationId_updatedAt_idx" ON "AppAIMvp"("conversationId", "updatedAt");

-- AddForeignKey
ALTER TABLE "AppAIConversation" ADD CONSTRAINT "AppAIConversation_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppAIConversation" ADD CONSTRAINT "AppAIConversation_anonymousUserId_fkey" FOREIGN KEY ("anonymousUserId") REFERENCES "AnonymousUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppAIMessage" ADD CONSTRAINT "AppAIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AppAIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppAIResearch" ADD CONSTRAINT "AppAIResearch_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AppAIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppAIPrompt" ADD CONSTRAINT "AppAIPrompt_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AppAIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppAIMvp" ADD CONSTRAINT "AppAIMvp_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AppAIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

const fs = require('fs');
let content = fs.readFileSync('packages/database/prisma/schema.prisma', 'utf8');

content = content.replace(
  'provider = "prisma-client-js"',
  'provider = "prisma-client-js"\n  previewFeatures = ["postgresqlExtensions"]'
);

content = content.replace(
  'provider = "postgresql"',
  'provider = "postgresql"\n  extensions = [vector]'
);

content = content.replace(
  'aiAnalyses   AIAnalysis[]',
  'aiAnalyses   AIAnalysis[]\n  marketTrend  MarketTrend?'
);

content = content.replace(
  'voteCount Int @default(0)',
  'voteCount Int @default(0)\n\n  embedding Unsupported("vector(384)")?'
);

content += `\nmodel MarketTrend {
  id    String @id @default(cuid())
  appId String @unique

  source String @default("Google Trends")
  query  String

  trendDirection  String?
  growthPercent   Int?
  currentInterest Int?
  averageInterest Int?

  timelineData    Json?
  regionalData    Json?
  relatedQueries  Json?

  fetchedAt DateTime @default(now())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  app App @relation(fields: [appId], references: [id], onDelete: Cascade)
}\n`;

fs.writeFileSync('packages/database/prisma/schema.prisma', content);

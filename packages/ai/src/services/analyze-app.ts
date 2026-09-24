import { prisma } from "@caniclone/database";
import { generateObject } from "ai";

import { getAnalysisModel, getAnalysisModelId } from "../models.js";
import { buildAppAnalysisPrompt, prepareAnalysisInput } from "../prompts/app-analysis.js";
import { AppAnalysisSchema, type AppAnalysis } from "../schemas/app-analysis.js";

export interface StoredAnalysis {
  id: string;
  appId: string;
  model: string | null;
  verdict: string | null;
  analysis: AppAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export class AppNotFoundError extends Error {
  constructor(slug: string) {
    super(`App not found: ${slug}`);
    this.name = "AppNotFoundError";
  }
}

const appInclude = {
  pricingPlans: true,
  alternatives: true,
} as const;

function rowToStoredAnalysis(row: {
  id: string;
  appId: string;
  model: string | null;
  verdict: string | null;
  analysis: unknown;
  createdAt: Date;
  updatedAt: Date;
}): StoredAnalysis | null {
  const parsed = AppAnalysisSchema.safeParse(row.analysis);
  if (!parsed.success) return null;
  return {
    id: row.id,
    appId: row.appId,
    model: row.model,
    verdict: row.verdict,
    analysis: parsed.data,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function findApp(slug: string) {
  const app = await prisma.app.findUnique({
    where: { slug },
    include: appInclude,
  });
  if (!app) throw new AppNotFoundError(slug);
  return app;
}

/** Return the most recent valid cached analysis for a slug, or null. */
export async function getCachedAnalysis(slug: string): Promise<StoredAnalysis | null> {
  const app = await prisma.app.findUnique({ where: { slug }, select: { id: true } });
  if (!app) throw new AppNotFoundError(slug);

  const row = await prisma.aIAnalysis.findFirst({
    where: { appId: app.id },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return null;

  return rowToStoredAnalysis(row);
}

/** Generate a fresh analysis with Mistral, validate it, and persist it. */
export async function generateAnalysis(slug: string): Promise<StoredAnalysis> {
  const app = await findApp(slug);

  const input = prepareAnalysisInput(app as unknown as Record<string, unknown>);
  const { system, prompt } = buildAppAnalysisPrompt(input);

  const { object } = await generateObject({
    model: getAnalysisModel(),
    schema: AppAnalysisSchema,
    system,
    prompt,
    // Fail fast on provider rate limits instead of hammering the API.
    maxRetries: 1,
  });

  // Re-validate defensively so a malformed model response never reaches the DB.
  const analysis = AppAnalysisSchema.parse(object);
  const model = getAnalysisModelId();

  const existing = await prisma.aIAnalysis.findFirst({
    where: { appId: app.id },
    orderBy: { createdAt: "desc" },
  });

  const data = {
    verdict: analysis.verdict,
    analysis: analysis as unknown as object,
    model,
    complexity: analysis.difficulty,
    estimatedEffort: analysis.estimatedBuildTime,
    recommendedStack: analysis.recommendedStack,
  };

  const row = existing
    ? await prisma.aIAnalysis.update({ where: { id: existing.id }, data })
    : await prisma.aIAnalysis.create({ data: { appId: app.id, ...data } });

  const stored = rowToStoredAnalysis(row);
  if (!stored) {
    throw new Error("Generated analysis failed validation after save.");
  }
  return stored;
}

/** Cache-first: return the stored analysis if present, otherwise generate it. */
export async function getOrGenerateAnalysis(slug: string): Promise<StoredAnalysis> {
  const cached = await getCachedAnalysis(slug);
  if (cached) return cached;
  return generateAnalysis(slug);
}

import {
  getCachedAnalysis,
  generateAnalysis,
  type StoredAnalysis,
} from "@caniclone/ai";

import { getAppBySlug } from "./apps.service.js";

export interface AppAnalysisPayload {
  app: NonNullable<Awaited<ReturnType<typeof getAppBySlug>>>;
  analysis: StoredAnalysis | null;
}

/** Cache-only read: returns the app plus its stored analysis (or null). */
export async function getAppWithAnalysis(slug: string): Promise<AppAnalysisPayload | null> {
  const app = await getAppBySlug(slug);
  if (!app) return null;

  const analysis = await getCachedAnalysis(slug);
  return { app, analysis };
}

/** Generate (or regenerate) the analysis with the shared AI model and persist it. */
export async function analyzeApp(slug: string): Promise<AppAnalysisPayload | null> {
  const app = await getAppBySlug(slug);
  if (!app) return null;

  const analysis = await generateAnalysis(slug);
  return { app, analysis };
}

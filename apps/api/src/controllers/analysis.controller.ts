import type { Request, Response } from "express";

import { analyzeApp, getAppWithAnalysis } from "../services/analysis.service.js";

/** Walk an error chain looking for an HTTP status code (AI SDK wraps these). */
function findStatusCode(err: unknown): number | undefined {
  let cur = err as { statusCode?: number; cause?: unknown } | null | undefined;
  for (let i = 0; i < 5 && cur; i++) {
    if (typeof cur.statusCode === "number") return cur.statusCode;
    cur = cur.cause as typeof cur;
  }
  return undefined;
}

/**
 * Map a provider/config failure to a clean, client-safe response.
 * Never echoes the raw provider error body or any secret back to the client.
 */
function classifyAnalysisError(err: unknown): { status: number; message: string } {
  const statusCode = findStatusCode(err);
  const raw = err instanceof Error ? err.message : "";

  if (statusCode === 429 || /rate.?limit|429/i.test(raw)) {
    return {
      status: 429,
      message: "AI analysis is temporarily unavailable (provider rate limit). Please try again later.",
    };
  }
  if (statusCode === 401 || statusCode === 403) {
    return { status: 503, message: "AI analysis is not configured (provider authentication failed)." };
  }
  if (raw.includes("MISTRAL_API_KEY")) {
    return { status: 503, message: "AI analysis is not configured on this server." };
  }
  return { status: 502, message: "AI analysis could not be generated." };
}

export async function getAppAnalysis(req: Request, res: Response) {
  const { slug } = req.params;

  if (typeof slug !== "string") {
    return res.status(400).json({ success: false, message: "Invalid app slug" });
  }

  try {
    const data = await getAppWithAnalysis(slug);
    if (!data) {
      return res.status(404).json({ success: false, message: "App not found" });
    }
    return res.json({ success: true, data });
  } catch (err) {
    // Cache reads only touch the DB; log a sanitized line, never the raw object.
    console.error("[analysis] cache read failed for slug=%s", slug);
    return res.status(500).json({ success: false, message: "Failed to load analysis" });
  }
}

export async function generateAppAnalysis(req: Request, res: Response) {
  const { slug } = req.params;

  if (typeof slug !== "string") {
    return res.status(400).json({ success: false, message: "Invalid app slug" });
  }

  try {
    const data = await analyzeApp(slug);
    if (!data) {
      return res.status(404).json({ success: false, message: "App not found" });
    }
    return res.json({ success: true, data });
  } catch (err) {
    const { status, message } = classifyAnalysisError(err);
    // Sanitized server-side log: status + slug only. No provider body, no key.
    console.error("[analysis] generate failed for slug=%s status=%d", slug, status);
    return res.status(status).json({ success: false, message });
  }
}

import type { Request, Response } from "express";

import { AIConfigurationError } from "@caniclone/ai";

import { ResearchUnavailableError } from "../../integrations/firecrawl.js";
import {
  acceptAppPrompt,
  AppAINotFoundError,
  getAppAIWorkspace,
} from "../../services/ai/app-ai.service.js";
import {
  InvalidAnonymousIdError,
  isValidAnonymousId,
} from "../../services/ideas/ideas.service.js";

function readAnonymousId(req: Request): string | undefined {
  const header = req.header("x-anonymous-id");
  if (isValidAnonymousId(header)) return header;
  const body = (req.body ?? {}) as { anonymousUserId?: unknown };
  if (isValidAnonymousId(body.anonymousUserId)) return body.anonymousUserId;
  return undefined;
}

function findStatusCode(err: unknown): number | undefined {
  let current = err as { statusCode?: number; cause?: unknown } | null | undefined;
  for (let index = 0; index < 5 && current; index += 1) {
    if (typeof current.statusCode === "number") return current.statusCode;
    current = current.cause as typeof current;
  }
  return undefined;
}

function classifyAppAIError(err: unknown): { status: number; message: string } {
  if (err instanceof InvalidAnonymousIdError) {
    return { status: 400, message: "A valid anonymous user id is required" };
  }
  if (err instanceof AppAINotFoundError) {
    return { status: 404, message: "App not found" };
  }
  if (err instanceof ResearchUnavailableError) {
    return { status: 503, message: err.message };
  }
  const statusCode = findStatusCode(err);
  const raw = err instanceof Error ? err.message : "";
  if (statusCode === 429 || /rate.?limit|429/i.test(raw)) {
    return { status: 429, message: "AI is temporarily unavailable (provider rate limit). Try again later." };
  }
  if (err instanceof AIConfigurationError || statusCode === 401 || statusCode === 403) {
    return { status: 503, message: "AI is not configured on this server." };
  }
  return { status: 500, message: "The application AI request failed." };
}

export async function getAppAIWorkspaceHandler(req: Request, res: Response) {
  const anonymousUserId = readAnonymousId(req);
  const { slug } = req.params;
  if (!anonymousUserId || typeof slug !== "string" || !slug.trim()) {
    return res.status(400).json({ success: false, message: "A valid app and anonymous user id are required" });
  }
  try {
    const data = await getAppAIWorkspace(slug, anonymousUserId);
    if (!data) return res.status(404).json({ success: false, message: "App not found" });
    res.setHeader("Cache-Control", "private, no-store");
    return res.json({ success: true, data });
  } catch (err) {
    const { status, message } = classifyAppAIError(err);
    console.error("[app-ai] workspace read failed status=%d", status);
    return res.status(status).json({ success: false, message });
  }
}

export async function acceptAppPromptHandler(req: Request, res: Response) {
  const anonymousUserId = readAnonymousId(req);
  const { slug } = req.params;
  const body = (req.body ?? {}) as { promptId?: unknown; prompt?: unknown };
  if (
    !anonymousUserId ||
    typeof slug !== "string" ||
    typeof body.promptId !== "string" ||
    typeof body.prompt !== "string"
  ) {
    return res.status(400).json({ success: false, message: "promptId and prompt are required" });
  }
  try {
    const data = await acceptAppPrompt(slug, anonymousUserId, body.promptId, body.prompt);
    return res.json({ success: true, data });
  } catch (err) {
    const { status, message } = classifyAppAIError(err);
    console.error("[app-ai] prompt accept failed status=%d", status);
    return res.status(status).json({ success: false, message });
  }
}

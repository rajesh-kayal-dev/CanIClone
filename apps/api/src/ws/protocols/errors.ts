import { AIConfigurationError } from "@caniclone/ai";

import { ResearchUnavailableError } from "../../integrations/firecrawl.js";
import { AppAINotFoundError } from "../../services/ai/app-ai.service.js";
import {
  IdeaNotFoundError,
  InvalidAnonymousIdError,
} from "../../services/ideas/ideas.service.js";

export function findStatusCode(error: unknown): number | undefined {
  let current = error as { statusCode?: number; cause?: unknown } | null | undefined;
  for (let index = 0; index < 5 && current; index += 1) {
    if (typeof current.statusCode === "number") return current.statusCode;
    current = current.cause as typeof current;
  }
  return undefined;
}

export function classify(error: unknown): { code: string; message: string } {
  if (error instanceof InvalidAnonymousIdError) {
    return { code: "bad_request", message: "A valid anonymous user id is required" };
  }
  if (error instanceof IdeaNotFoundError) {
    return { code: "not_found", message: "Idea not found" };
  }
  if (error instanceof AppAINotFoundError) {
    return { code: "not_found", message: "App not found" };
  }
  if (error instanceof ResearchUnavailableError) {
    return { code: "research_unavailable", message: error.message };
  }

  const status = findStatusCode(error);
  const raw = error instanceof Error ? error.message : "";
  if (status === 429 || /rate.?limit|429/i.test(raw)) {
    return {
      code: "ai_unavailable",
      message: "AI is temporarily unavailable (provider rate limit). Try again later.",
    };
  }
  if (error instanceof AIConfigurationError || status === 401 || status === 403) {
    return { code: "ai_unavailable", message: "AI is not configured on this server." };
  }
  return { code: "internal", message: "Request failed" };
}

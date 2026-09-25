import { generateAIText } from "../models.js";
import {
  buildResearchIntentPrompt,
  messageLikelyNeedsResearch,
} from "../prompts/research-intent.js";

export interface ResearchIntentOptions {
  context: unknown;
  message: string;
  signal?: AbortSignal;
}

/**
 * Avoid a second model call for ordinary coding/product questions. For a
 * question that mentions external evidence, the shared AI model makes the final
 * routing decision; an unavailable classifier fails conservatively toward
 * research so the caller can surface the real research/provider error.
 */
export async function shouldUseResearch(opts: ResearchIntentOptions): Promise<boolean> {
  if (!messageLikelyNeedsResearch(opts.message)) return false;
  const { system, prompt } = buildResearchIntentPrompt(opts.context, opts.message);
  try {
    const text = await generateAIText({ system, prompt, signal: opts.signal });
    return /^research\b/i.test(text.trim());
  } catch (error) {
    if (opts.signal?.aborted) throw error;
    return true;
  }
}

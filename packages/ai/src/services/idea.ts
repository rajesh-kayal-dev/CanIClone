import { generateText, streamText } from "ai";

import { getAnalysisModel } from "../models.js";
import {
  buildIdeaChatMessages,
  buildMvpGenerationInput,
  buildPromptGenerationInput,
  buildResearchQueryPrompt,
  buildResearchSynthesisPrompt,
  type ChatTurn,
  type IdeaContext,
} from "../prompts/idea.js";

/**
 * Real Mistral calls for the Ideas workspace. These intentionally do NOT catch or
 * fake provider errors — a rate limit / auth failure propagates so the caller can
 * surface an honest "AI unavailable" state instead of a fabricated answer.
 */

export interface StreamChatOptions {
  context: IdeaContext;
  history: ChatTurn[];
  /** Called with each text chunk as it streams in. */
  onToken: (token: string) => void;
  signal?: AbortSignal;
}

/** Stream an assistant chat reply, returning the full text once complete. */
export async function streamIdeaChat(opts: StreamChatOptions): Promise<string> {
  const { system, messages } = buildIdeaChatMessages(opts.context, opts.history);
  const result = streamText({
    model: getAnalysisModel(),
    system,
    messages,
    maxRetries: 0,
    abortSignal: opts.signal,
  });
  let full = "";
  // Consume fullStream (not textStream) so provider errors — e.g. a Mistral rate
  // limit — surface as a thrown error instead of an silently empty completion.
  for await (const part of result.fullStream) {
    if (part.type === "text-delta") {
      full += part.text;
      opts.onToken(part.text);
    } else if (part.type === "error") {
      throw part.error instanceof Error ? part.error : new Error(String(part.error));
    }
  }
  if (!full.trim()) {
    throw new Error("Model returned an empty response");
  }
  return full;
}

export interface GenerateOptions {
  context: IdeaContext;
  conversation?: string;
  signal?: AbortSignal;
}

/** Generate the improved development prompt for an idea. */
export async function generateIdeaPrompt(opts: GenerateOptions): Promise<string> {
  const { system, prompt } = buildPromptGenerationInput(opts.context, opts.conversation ?? "");
  const { text } = await generateText({
    model: getAnalysisModel(),
    system,
    prompt,
    maxRetries: 0,
    abortSignal: opts.signal,
  });
  return text.trim();
}

/** Generate the MVP.md document for an idea. */
export async function generateIdeaMvp(opts: GenerateOptions): Promise<string> {
  const { system, prompt } = buildMvpGenerationInput(opts.context, opts.conversation ?? "");
  const { text } = await generateText({
    model: getAnalysisModel(),
    system,
    prompt,
    maxRetries: 0,
    abortSignal: opts.signal,
  });
  return text.trim();
}

/** Synthesize Firecrawl research results into the honest challenge/assessment. */
export async function synthesizeResearch(
  context: IdeaContext,
  resultsText: string,
  signal?: AbortSignal,
): Promise<string> {
  const { system, prompt } = buildResearchSynthesisPrompt(context, resultsText);
  const { text } = await generateText({
    model: getAnalysisModel(),
    system,
    prompt,
    maxRetries: 0,
    abortSignal: signal,
  });
  return text.trim();
}

/** Turn the idea into a single concise web-search query for Firecrawl. */
export async function generateResearchQuery(
  context: IdeaContext,
  signal?: AbortSignal,
): Promise<string> {
  const { system, prompt } = buildResearchQueryPrompt(context);
  const { text } = await generateText({
    model: getAnalysisModel(),
    system,
    prompt,
    maxRetries: 0,
    abortSignal: signal,
  });
  // Keep only the first non-empty line, in case the model adds prose.
  return text.split("\n").map((l) => l.trim()).find((l) => l.length > 0)?.slice(0, 300) ?? "";
}

import { generateAIText, streamAIText } from "../models.js";
import {
  buildIdeaChatMessages,
  buildIdeaInitialAnalysisPrompt,
  buildIdeaTitlePrompt,
  buildMvpGenerationInput,
  buildPromptGenerationInput,
  buildResearchQueryPrompt,
  buildResearchSynthesisPrompt,
  type ChatTurn,
  type IdeaContext,
  type IdeaResearchEvidence,
} from "../prompts/idea.js";

/**
 * Real direct-provider AI calls for the Ideas workspace. The shared provider
 * boundary tries Gemini first and Groq second without exposing that choice to
 * the product layer.
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
  return streamAIText({
    system,
    messages,
    onToken: opts.onToken,
    signal: opts.signal,
    emptyResponseMessage: "Model returned an empty response",
  });
}

export interface IdeaTitleOptions {
  context: IdeaContext;
  signal?: AbortSignal;
}

/** Generate a short, specific name for an idea using the shared AI model. */
export async function generateIdeaTitle(opts: IdeaTitleOptions): Promise<string> {
  const { system, prompt } = buildIdeaTitlePrompt(opts.context);
  const text = await generateAIText({ system, prompt, signal: opts.signal });

  const title = text
    .split(/\r?\n/, 1)[0]
    .trim()
    .replace(/^["'#*_`\s]+/, "")
    .replace(/["'`]+$/, "")
    .trim();
  if (!title) throw new Error("Model returned an empty idea name");
  return title.slice(0, 80).trim();
}

export interface StreamInitialAnalysisOptions {
  context: IdeaContext;
  research: IdeaResearchEvidence;
  onToken: (token: string) => void;
  signal?: AbortSignal;
}

/** Stream the structured first analysis after real research (or an honest fallback). */
export async function streamIdeaInitialAnalysis(
  opts: StreamInitialAnalysisOptions,
): Promise<string> {
  const { system, prompt } = buildIdeaInitialAnalysisPrompt(opts.context, opts.research);
  return streamAIText({
    system,
    prompt,
    onToken: opts.onToken,
    signal: opts.signal,
    emptyResponseMessage: "Model returned an empty analysis",
  });
}

export interface GenerateOptions {
  context: IdeaContext;
  conversation?: string;
  signal?: AbortSignal;
}

/** Generate the improved development prompt for an idea. */
export async function generateIdeaPrompt(opts: GenerateOptions): Promise<string> {
  const { system, prompt } = buildPromptGenerationInput(opts.context, opts.conversation ?? "");
  return (await generateAIText({ system, prompt, signal: opts.signal })).trim();
}

/** Generate the MVP.md document for an idea. */
export async function generateIdeaMvp(opts: GenerateOptions): Promise<string> {
  const { system, prompt } = buildMvpGenerationInput(opts.context, opts.conversation ?? "");
  return (await generateAIText({ system, prompt, signal: opts.signal })).trim();
}

/** Synthesize Firecrawl research results into the honest challenge/assessment. */
export async function synthesizeResearch(
  context: IdeaContext,
  resultsText: string,
  signal?: AbortSignal,
): Promise<string> {
  const { system, prompt } = buildResearchSynthesisPrompt(context, resultsText);
  return (await generateAIText({ system, prompt, signal })).trim();
}

/** Turn the idea into a single concise web-search query for Firecrawl. */
export async function generateResearchQuery(
  context: IdeaContext,
  signal?: AbortSignal,
): Promise<string> {
  const { system, prompt } = buildResearchQueryPrompt(context);
  const text = await generateAIText({ system, prompt, signal });
  // Keep only the first non-empty line, in case the model adds prose.
  return text.split("\n").map((line) => line.trim()).find((line) => line.length > 0)?.slice(0, 300) ?? "";
}

import { generateAIText, streamAIText } from "../models.js";
import {
  buildAppChatMessages,
  buildAppMvpPrompt,
  buildAppPromptRefinementPrompt,
  buildAppResearchQueryPrompt,
  buildAppResearchSynthesisPrompt,
  type AppChatTurn,
  type AppResearchEvidence,
  type AppWorkspaceContext,
} from "../prompts/app-workspace.js";

export interface StreamAppChatOptions {
  context: AppWorkspaceContext;
  history: AppChatTurn[];
  onToken: (token: string) => void;
  signal?: AbortSignal;
}

export async function streamAppChat(opts: StreamAppChatOptions): Promise<string> {
  const { system, messages } = buildAppChatMessages(opts.context, opts.history);
  return streamAIText({
    system,
    messages,
    onToken: opts.onToken,
    signal: opts.signal,
    emptyResponseMessage: "Model returned an empty application response",
  });
}

export interface AppResearchQueryOptions {
  context: AppWorkspaceContext;
  signal?: AbortSignal;
}

export async function generateAppResearchQuery(opts: AppResearchQueryOptions): Promise<string> {
  const { system, prompt } = buildAppResearchQueryPrompt(opts.context);
  const text = await generateAIText({ system, prompt, signal: opts.signal });
  return text.split(/\r?\n/).map((line) => line.trim()).find(Boolean)?.slice(0, 300) ?? "";
}

export interface AppResearchSynthesisOptions {
  context: AppWorkspaceContext;
  resultsText: string;
  signal?: AbortSignal;
}

export async function synthesizeAppResearch(opts: AppResearchSynthesisOptions): Promise<string> {
  const { system, prompt } = buildAppResearchSynthesisPrompt(opts.context, opts.resultsText);
  return (await generateAIText({ system, prompt, signal: opts.signal })).trim();
}

export interface AppPromptRefinementOptions {
  context: AppWorkspaceContext;
  instruction: string;
  conversation: string;
  signal?: AbortSignal;
}

export async function generateAppRefinedPrompt(opts: AppPromptRefinementOptions): Promise<string> {
  const { system, prompt } = buildAppPromptRefinementPrompt(
    opts.context,
    opts.instruction,
    opts.conversation,
  );
  const text = (await generateAIText({ system, prompt, signal: opts.signal })).trim();
  if (!text) throw new Error("Model returned an empty refined prompt");
  return text;
}

export interface AppMvpOptions {
  context: AppWorkspaceContext;
  conversation: string;
  research: AppResearchEvidence | null;
  signal?: AbortSignal;
}

export async function generateAppMvp(opts: AppMvpOptions): Promise<string> {
  const { system, prompt } = buildAppMvpPrompt(opts.context, opts.conversation, opts.research);
  const text = (await generateAIText({ system, prompt, signal: opts.signal })).trim();
  if (!text) throw new Error("Model returned an empty MVP specification");
  return text;
}

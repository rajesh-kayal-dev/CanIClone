import { createGoogle } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import {
  generateText,
  streamText,
  type LanguageModel,
  type ModelMessage,
} from "ai";

const GEMINI_MODEL = "gemini-2.5-flash";
const GROQ_MODEL = "openai/gpt-oss-120b";

/** A client-safe configuration failure; callers must not expose the cause. */
export class AIConfigurationError extends Error {
  constructor() {
    super("AI is not configured on this server.");
    this.name = "AIConfigurationError";
  }
}

function requireEnvironmentValue(name: "GEMINI_API_KEY" | "GROQ_API_KEY"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new AIConfigurationError();
  return value;
}

/** Both direct providers are required because Groq is the configured fallback. */
export function isAIConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim() && process.env.GROQ_API_KEY?.trim());
}

/** Model id used for persisted analysis metadata. */
export function getAnalysisModelId(): string {
  return GEMINI_MODEL;
}

/** Primary direct-provider model. */
export function getAnalysisModel(): LanguageModel {
  const google = createGoogle({ apiKey: requireEnvironmentValue("GEMINI_API_KEY") });
  return google(GEMINI_MODEL);
}

/** Single fallback direct-provider model. */
export function getFallbackModel(): LanguageModel {
  const groq = createGroq({ apiKey: requireEnvironmentValue("GROQ_API_KEY") });
  return groq(GROQ_MODEL);
}

function isAbortError(error: unknown, signal?: AbortSignal): boolean {
  if (signal?.aborted) return true;

  let current = error as { name?: unknown; message?: unknown; cause?: unknown } | null | undefined;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (current.name === "AbortError") return true;
    if (typeof current.message === "string" && /abort/i.test(current.message)) return true;
    current = current.cause as typeof current;
  }
  return false;
}

/** Run one primary request and, on failure, one Groq request. */
export async function withAIModelFallback<T>(
  operation: (model: LanguageModel) => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  try {
    return await operation(getAnalysisModel());
  } catch (error) {
    if (isAbortError(error, signal)) throw error;
    return operation(getFallbackModel());
  }
}

interface AITextOptionsBase {
  system?: string;
  temperature?: number;
  signal?: AbortSignal;
}

export type AITextOptions = AITextOptionsBase &
  (
    | { prompt: string; messages?: never }
    | { prompt?: never; messages: ModelMessage[] }
  );

/** Provider-neutral text generation with Gemini first and Groq second. */
export async function generateAIText(options: AITextOptions): Promise<string> {
  return withAIModelFallback(
    async (model) => {
      const result = await generateText({
        model,
        ...(options.messages ? { messages: options.messages } : { prompt: options.prompt! }),
        system: options.system,
        temperature: options.temperature,
        abortSignal: options.signal,
        maxRetries: 0,
      });
      return result.text;
    },
    options.signal,
  );
}

export type AIStreamTextOptions = AITextOptionsBase &
  (
    | { prompt: string; messages?: never }
    | { prompt?: never; messages: ModelMessage[] }
  ) & {
    onToken: (token: string) => void;
    emptyResponseMessage: string;
  };

async function consumeAIStream(
  model: LanguageModel,
  options: AIStreamTextOptions,
): Promise<string> {
  const common = {
    model,
    system: options.system,
    temperature: options.temperature,
    abortSignal: options.signal,
    maxRetries: 0,
    onError: () => undefined,
  };
  const result = options.messages
    ? streamText({ ...common, messages: options.messages })
    : streamText({ ...common, prompt: options.prompt! });

  let full = "";
  let streamError: unknown;
  for await (const part of result.fullStream) {
    if (part.type === "text-delta") {
      full += part.text;
      options.onToken(part.text);
    } else if (part.type === "error") {
      streamError = part.error;
    }
  }

  if (streamError) {
    throw streamError instanceof Error ? streamError : new Error(String(streamError));
  }
  if (!full.trim()) throw new Error(options.emptyResponseMessage);
  return full;
}

/** Stream from Gemini, falling back to Groq only before any text is emitted. */
export async function streamAIText(options: AIStreamTextOptions): Promise<string> {
  let emittedText = false;
  try {
    return await consumeAIStream(getAnalysisModel(), {
      ...options,
      onToken: (token) => {
        emittedText = true;
        options.onToken(token);
      },
    });
  } catch (error) {
    if (emittedText || isAbortError(error, options.signal)) throw error;
    return consumeAIStream(getFallbackModel(), options);
  }
}

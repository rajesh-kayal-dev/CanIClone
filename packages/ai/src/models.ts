import { createMistral, type MistralProvider } from "@ai-sdk/mistral";

export const DEFAULT_MISTRAL_MODEL = "mistral-small-latest";

let provider: MistralProvider | null = null;

function getProvider(): MistralProvider {
  if (!provider) {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error(
        "MISTRAL_API_KEY is not set. Add it to the root .env (server-side only, never NEXT_PUBLIC).",
      );
    }
    provider = createMistral({ apiKey });
  }
  return provider;
}

/**
 * Model id is configurable via MISTRAL_MODEL so the provider can be swapped
 * without touching CanIClone business logic.
 */
export function getAnalysisModelId(): string {
  return process.env.MISTRAL_MODEL ?? DEFAULT_MISTRAL_MODEL;
}

export function getAnalysisModel() {
  return getProvider()(getAnalysisModelId());
}

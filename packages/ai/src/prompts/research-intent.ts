export const RESEARCH_INTENT_SYSTEM_PROMPT = `Decide whether the user's question needs a fresh web-research tool call for the selected application or idea.

Return exactly one word:
- RESEARCH when current competitors, alternatives, market evidence, existing products, or up-to-date external information would materially improve the answer.
- CHAT when the application context and recent conversation are sufficient.

Do not answer the user's question. Do not explain your decision.`;

/** A cheap prefilter avoids a second model call for ordinary implementation questions. */
export function messageLikelyNeedsResearch(message: string): boolean {
  return /\b(research|competitor|competition|alternative|alternatives|market|similar apps?|similar products?|existing (?:products?|apps?|solutions?)|what are people using|current (?:products?|apps?|solutions?|market)|find current|look into)\b/i.test(
    message,
  );
}

export function buildResearchIntentPrompt(context: unknown, message: string): {
  system: string;
  prompt: string;
} {
  return {
    system: RESEARCH_INTENT_SYSTEM_PROMPT,
    prompt: `CURRENT APPLICATION OR IDEA CONTEXT:\n${JSON.stringify(context, null, 2)}\n\nUSER QUESTION:\n${message}\n\nReturn RESEARCH or CHAT now.`,
  };
}

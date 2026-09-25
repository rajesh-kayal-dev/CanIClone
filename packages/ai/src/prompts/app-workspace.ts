export interface AppWorkspaceAlternative {
  name: string;
  url: string;
  description: string | null;
  type: string | null;
}

export interface AppResearchHit {
  url: string;
  title: string;
  description: string;
}

export interface AppResearchEvidence {
  available: boolean;
  query: string | null;
  analysis: string | null;
  hits: AppResearchHit[];
  unavailableReason?: string | null;
}

export interface AppWorkspaceContext {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  category: string;
  subcategory: string | null;
  tagline: string | null;
  description: string | null;
  verdict: string;
  verdictConfidence: string | null;
  verdictSummary: string | null;
  whyPeopleStillPay: string | null;
  coreLoop: string | null;
  diyTimeEstimate: string | null;
  verifiedOneShot: boolean;
  priceMonthly: string | null;
  requirements: string[];
  features: string[];
  whatYouLose: string[];
  moat: string[];
  moatNotes: string | null;
  priorArt: string[];
  rejectedAlternatives: string[];
  relatedSlugs: string[];
  technology: string[];
  alternatives: AppWorkspaceAlternative[];
  currentPrompt: string | null;
  promptCurated: boolean;
  notes: string | null;
  pricingPlans: Array<{
    name: string;
    monthly: string | null;
    annualPerMonth: string | null;
    per: string | null;
    limits: string | null;
    notes: string | null;
  }>;
  marketTrend: {
    direction: string | null;
    growthPercent: number | null;
    currentInterest: number | null;
    fetchedAt: string | null;
  } | null;
  research: AppResearchEvidence | null;
}

export interface AppChatTurn {
  role: "user" | "assistant";
  content: string;
}

function renderContext(ctx: AppWorkspaceContext): string {
  const { research: _research, ...applicationContext } = ctx;
  return JSON.stringify(applicationContext, null, 2);
}

function compactEvidenceText(value: string, maxLength = 700): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}…`;
}

function renderResearch(evidence: AppResearchEvidence | null): string {
  if (!evidence || !evidence.available) {
    return [
      "LIVE RESEARCH STATUS: unavailable",
      evidence?.unavailableReason?.trim() || "No current live research results were supplied.",
      "Do not present remembered products, competitors, statistics, or market claims as researched facts.",
    ].join("\n");
  }

  const sources = evidence.hits.length
    ? evidence.hits
        .map(
          (hit, index) =>
            `[${index + 1}] ${hit.title}\nURL: ${hit.url}\n${compactEvidenceText(hit.description)}`,
        )
        .join("\n\n")
    : "(No usable source pages were returned.)";

  return [
    "LIVE RESEARCH STATUS: completed",
    evidence.query?.trim() ? `Search query: ${evidence.query.trim()}` : null,
    "",
    "SUPPLIED SOURCES:",
    sources,
    "",
    "RESEARCH SYNTHESIS:",
    evidence.analysis?.trim() || "(No research synthesis was returned.)",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export const APP_WORKSPACE_CHAT_SYSTEM_PROMPT = `You are the CanIClone application AI assistant. You help a builder understand, improve, research, and plan a faithful MVP for the selected application.

Answer rules:
- Answer the user's question directly in the first one or two sentences.
- Default to 80-140 words. Never exceed 180 words for an ordinary chat answer unless the user explicitly asks for a long or detailed response.
- Treat any user-provided word limit as a hard limit and target about 70% of it.
- Use a few useful Markdown headings, bullets, or numbered steps; never use headings just to fill a template.
- Prefer paragraphs of one or two sentences. Bold only the most important concepts.
- Explain technical terms in plain language, then include the technical term in parentheses when useful.
- Summarize research evidence instead of quoting pages. Never output raw webpage content, long URLs, or the internal search query.
- If a claim uses supplied research, cite it briefly as [1], [2], and so on. Sources are displayed separately by the product.
- Ask a clarifying question only when the application context is genuinely insufficient.
- Distinguish facts from interpretation and assumptions. Never invent competitors, statistics, integrations, or certainty.
- If live research is unavailable, say so plainly. Do not claim research happened unless the supplied evidence says it did.
- Stay focused on what the user is trying to build.`;

export function buildAppChatMessages(
  ctx: AppWorkspaceContext,
  history: AppChatTurn[],
): { system: string; messages: AppChatTurn[] } {
  return {
    system: `${APP_WORKSPACE_CHAT_SYSTEM_PROMPT}

CURRENT APPLICATION CONTEXT (source of truth):
${renderContext(ctx)}

CURRENT RESEARCH EVIDENCE:
${renderResearch(ctx.research)}`,
    messages: history,
  };
}

export const APP_RESEARCH_QUERY_SYSTEM_PROMPT = `You turn an application into ONE concise web-search query. Find existing products, alternatives, workflows, technical approaches, limitations, and gaps relevant to this application. Output ONLY the query on one line, with no quotes or explanation.`;

export function buildAppResearchQueryPrompt(ctx: AppWorkspaceContext): { system: string; prompt: string } {
  return {
    system: APP_RESEARCH_QUERY_SYSTEM_PROMPT,
    prompt: `APPLICATION:
${renderContext(ctx)}

Write one useful research query now.`,
  };
}

export const APP_RESEARCH_SYNTHESIS_SYSTEM_PROMPT = `You are a helpful product research consultant. Summarize only the supplied web results for a non-technical builder.

Return concise Markdown. Prefer this shape, but omit sections that add no value:

## What I found
A two or three sentence conclusion-first summary.

### Key findings
- **Finding:** short useful point
- **Finding:** short useful point
- **Finding:** short useful point

### What this means
A short practical explanation for the selected application.

### Things to validate
- Important risk
- Important unknown
- Important product or technical concern

### Bottom line
One or two final sentences.

Rules:
- Aim for roughly 180-280 words and never exceed 300 unless the user explicitly asks for depth. Answer first; do not write an exhaustive report by default.
- Use at most four key findings and four validation items; three is usually enough.
- Use only supplied sources as evidence. Cite claims briefly as [1], [2], and so on.
- Never quote or reproduce raw webpage extracts, code blocks, navigation text, long URLs, or the internal search query.
- The Sources section is rendered separately by the product. Do not create one.
- Prioritize conclusions, useful findings, practical implications, risks, and gaps.
- Do not invent competitors, numbers, features, or market facts. If evidence is thin, say so plainly.`;

export function buildAppResearchSynthesisPrompt(
  ctx: AppWorkspaceContext,
  resultsText: string,
): { system: string; prompt: string } {
  return {
    system: APP_RESEARCH_SYNTHESIS_SYSTEM_PROMPT,
    prompt: `APPLICATION:
${renderContext(ctx)}

WEB RESULTS:
${resultsText}

Write the research report now.`,
  };
}

export const APP_PROMPT_REFINEMENT_SYSTEM_PROMPT = `You refine a build prompt for the selected application. Preserve the user's intent and the application's factual context. Make the prompt more focused, concrete, and buildable for an MVP. Do not invent requirements that are not supported by the context or the user's instruction. Return ONLY the refined prompt, with no preamble or commentary.`;

export function buildAppPromptRefinementPrompt(
  ctx: AppWorkspaceContext,
  instruction: string,
  conversation: string,
): { system: string; prompt: string } {
  return {
    system: APP_PROMPT_REFINEMENT_SYSTEM_PROMPT,
    prompt: `APPLICATION CONTEXT:
${renderContext(ctx)}

CURRENT PROMPT:
${ctx.currentPrompt?.trim() || "(none)"}

USER REFINEMENT REQUEST:
${instruction.trim() || "Make this prompt clearer and more focused for a buildable MVP."}

CONVERSATION SO FAR:
${conversation || "(none)"}

Return the refined prompt now.`,
  };
}

export const APP_MVP_SYSTEM_PROMPT = `You are a staff software architect. Generate a practical MVP specification for the selected application using only the supplied application context, prompt, research evidence, and conversation.

Return Markdown titled with the application name and use these sections in order:
# Application Name
## 1. Overview
## 2. Problem Statement
## 3. Target Users
## 4. MVP Goal
## 5. Recommended Technology Stack
## 6. Core Features
## 7. User Flow
## 8. System Architecture
## 9. Database Structure
## 10. API Requirements
## 11. Folder Structure
## 12. Implementation Plan
## 13. Future Improvements
## 14. Summary

Be concrete, buildable, and honest about assumptions. Do not invent requirements, evidence, or integrations.`;

export function buildAppMvpPrompt(
  ctx: AppWorkspaceContext,
  conversation: string,
  research: AppResearchEvidence | null,
): { system: string; prompt: string } {
  return {
    system: APP_MVP_SYSTEM_PROMPT,
    prompt: `APPLICATION CONTEXT:
${renderContext(ctx)}

CURRENT RESEARCH:
${renderResearch(research)}

CONVERSATION SO FAR:
${conversation || "(none)"}

Generate the MVP specification now.`,
  };
}

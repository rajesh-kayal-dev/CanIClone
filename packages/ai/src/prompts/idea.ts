/**
 * Prompt builders for the Ideas workspace. All of these drive the shared
 * shared AI model via the Vercel AI SDK — nothing here fabricates a
 * response. They only shape the system/user text from data the caller already
 * has (the persisted idea,
 * its research, and the running conversation).
 */

export interface IdeaContext {
  title: string | null;
  description: string | null;
  targetUsers: string | null;
  purpose: string | null;
  budget: string | null;
  technology: string | null;
  prompt: string | null;
  research: string | null;
}

export interface IdeaResearchEvidence {
  available: boolean;
  query: string | null;
  analysis: string | null;
  hits: Array<{ url: string; title: string; description: string }>;
  unavailableReason?: string | null;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

function field(label: string, value: string | null): string {
  return value && value.trim() ? `- ${label}: ${value.trim()}` : null!;
}

function compactEvidenceText(value: string, maxLength = 700): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}…`;
}

/** Render the idea snapshot the model is allowed to reason over. */
export function renderIdeaContext(ctx: IdeaContext): string {
  const lines = [
    field("Title", ctx.title),
    field("Problem / idea", ctx.description),
    field("Target users", ctx.targetUsers),
    field("Purpose", ctx.purpose),
    field("Budget", ctx.budget),
    field("Technology preference", ctx.technology),
    field("Latest research", ctx.research ? compactEvidenceText(ctx.research, 1_800) : null),
    field("Current build prompt", ctx.prompt),
  ].filter((l): l is string => Boolean(l));
  return lines.length ? lines.join("\n") : "(no details captured yet)";
}

export const IDEA_TITLE_SYSTEM_PROMPT = `You name product ideas for a builder's workspace.
Return ONLY the name: no quotation marks, no explanation, no markdown, no hashtags.
Aim for 3-8 short, specific, human-readable words. Avoid generic names and marketing language.`;

export function buildIdeaTitlePrompt(ctx: IdeaContext): { system: string; prompt: string } {
  return {
    system: IDEA_TITLE_SYSTEM_PROMPT,
    prompt: `IDEA CONTEXT:
${renderIdeaContext(ctx)}

Generate a concise, meaningful name for this specific idea now.`,
  };
}

function renderResearchEvidence(evidence: IdeaResearchEvidence): string {
  if (!evidence.available) {
    return [
      "LIVE RESEARCH STATUS: unavailable",
      `Reason: ${evidence.unavailableReason?.trim() || "Live web research was not completed."}`,
      "No current web results were retrieved. Do not present remembered products, competitors, statistics, or market claims as researched facts.",
    ].join("\n");
  }

  const sources = evidence.hits.length
    ? evidence.hits
        .map(
          (hit, index) =>
            `[${index + 1}] ${hit.title}\nURL: ${hit.url}\n${compactEvidenceText(hit.description)}`,
        )
        .join("\n\n")
    : "(The search returned no usable source pages.)";
  const synthesis = evidence.analysis?.trim() || "(No research synthesis was returned.)";

  return [
    "LIVE RESEARCH STATUS: completed",
    evidence.query?.trim() ? `Search query: ${evidence.query.trim()}` : null,
    "",
    "SUPPLIED SOURCES (these are the only current external evidence):",
    sources,
    "",
    "AI RESEARCH SYNTHESIS (interpretation of the supplied sources, not a source itself):",
    synthesis,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export const IDEA_INITIAL_ANALYSIS_SYSTEM_PROMPT = `You are the CanIClone Idea Analyst. Give a direct, useful first analysis for a solo builder. Be constructive but do not blindly praise the idea.

Return concise Markdown, normally 300-450 words. Prefer this shape and omit sections that add no value:

## What I found
A two or three sentence conclusion-first summary.

### Key findings
- **Finding:** short useful point
- **Finding:** short useful point
- **Finding:** short useful point

### What this means
Explain the practical opportunity, existing solutions, and possible gap in plain language.

### Things to validate
- Important risk
- Important unknown
- Important product or technical concern

### MVP direction
Give a small, practical first-version direction in two or three sentences.

### Bottom line
One or two final sentences.

Rules:
- Use supplied live sources only for research-backed claims and cite them briefly as [1], [2], and so on.
- Never reproduce raw webpage extracts, code blocks, long URLs, or the internal search query. Sources are displayed separately by the product.
- Clearly separate retrieved evidence from interpretation and assumptions.
- If live research is unavailable, say so plainly. Do not present remembered competitors, statistics, or market facts as verified.
- Do not invent sources, customer evidence, requirements, integrations, or technical certainty.`;


export function buildIdeaInitialAnalysisPrompt(
  ctx: IdeaContext,
  evidence: IdeaResearchEvidence,
): { system: string; prompt: string } {
  return {
    system: IDEA_INITIAL_ANALYSIS_SYSTEM_PROMPT,
    prompt: `IDEA CONTEXT (the user's current context; do not treat missing details as facts):
${renderIdeaContext(ctx)}

CURRENT LIVE RESEARCH:
${renderResearchEvidence(evidence)}

Write the initial analysis now. Keep it practical and challenge the idea where the evidence or missing information warrants it.`,
  };
}

export const IDEA_CHAT_SYSTEM_PROMPT = `You are the CanIClone Idea Assistant. You help a solo builder turn a rough idea into something they could actually ship.

Response rules:
- Answer the user's question directly in the first one or two sentences.
- Default to 80-140 words. Never exceed 180 words for an ordinary chat answer unless the user explicitly asks for a long or detailed response.
- Treat any user-provided word limit as a hard limit and target about 70% of it.
- Use a few useful Markdown headings, bullets, or numbered steps; never use headings just to fill a template.
- Prefer paragraphs of one or two sentences. Bold only the most important concepts.
- Explain technical terms in plain language, then include the technical term in parentheses when useful.
- Summarize research evidence instead of quoting pages. Never output raw webpage content, long URLs, or the internal search query.
- If a claim uses supplied research, cite it briefly as [1], [2], and so on. Sources are displayed separately by the product.
- If you do not yet know what problem the user wants to solve, your first message is exactly: "What problem would you like to solve?"
- Ask only for context you genuinely need, one question at a time. Never interrogate the user.
- Distinguish retrieved evidence from analysis and assumptions. Never invent market facts, competitors, or customer evidence.
- You cannot browse the web yourself; a separate Research action performs live research.`;

export function buildIdeaChatMessages(
  ctx: IdeaContext,
  history: ChatTurn[],
): { system: string; messages: ChatTurn[] } {
  const system = `${IDEA_CHAT_SYSTEM_PROMPT}

CURRENT IDEA CONTEXT (source of truth — do not add anything not present here):
${renderIdeaContext(ctx)}`;
  return { system, messages: history };
}

export const IDEA_RESEARCH_SYSTEM_PROMPT = `You are a helpful product research consultant. Summarize only the supplied web results for a non-technical builder.

Return concise Markdown. Prefer this shape, but omit sections that add no value:

## What I found
A two or three sentence conclusion-first summary.

### Key findings
- **Finding:** short useful point
- **Finding:** short useful point
- **Finding:** short useful point

### What this means
A short practical explanation for this idea.

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

export const IDEA_RESEARCH_QUERY_SYSTEM_PROMPT = `You turn a product idea into ONE concise web-search query used to find existing products, competitors, alternative solutions, current workflows, market or product evidence, relevant technical approaches, limitations, and underserved gaps. Output ONLY the query text on a single line — no quotes, no explanation.`;

export function buildResearchQueryPrompt(ctx: IdeaContext): { system: string; prompt: string } {
  return {
    system: IDEA_RESEARCH_QUERY_SYSTEM_PROMPT,
    prompt: `IDEA:
${renderIdeaContext(ctx)}

Write the single web-search query now.`,
  };
}

export function buildResearchSynthesisPrompt(
  ctx: IdeaContext,
  resultsText: string,
): { system: string; prompt: string } {
  return {
    system: IDEA_RESEARCH_SYSTEM_PROMPT,
    prompt: `IDEA:
${renderIdeaContext(ctx)}

RESEARCH RESULTS:
${resultsText}

Write the assessment now.`,
  };
}

export const IDEA_PROMPT_SYSTEM_PROMPT = `You are an expert at writing build prompts for AI coding agents. Using the full idea context, the conversation, and any research, write ONE improved, self-contained development prompt that an engineer (or an AI coding agent) could follow to build an MVP.

The prompt must be concrete and technical, and must not invent requirements the user never stated. Prefer clarity over hype. Output ONLY the prompt text, with no preamble.`;

export function buildPromptGenerationInput(
  ctx: IdeaContext,
  conversation: string,
): { system: string; prompt: string } {
  return {
    system: IDEA_PROMPT_SYSTEM_PROMPT,
    prompt: `IDEA CONTEXT:
${renderIdeaContext(ctx)}

CONVERSATION SO FAR:
${conversation || "(none)"}

Write the improved development prompt now.`,
  };
}

export const IDEA_MVP_SYSTEM_PROMPT = `You are a staff software architect. Using the full idea context, conversation, and research, produce a complete MVP specification as a Markdown document titled "MVP.md".

Use exactly these top-level sections, in order:
# Project Overview
# Problem
# Target Users
# MVP Goal
# Features
# Technology Stack
# Architecture
# Database
# APIs
# Folder Structure
# Implementation Steps

Rules:
- Be concrete. Derive everything from the supplied context; do not invent unstated requirements.
- Keep it buildable by one focused engineer.
- Output ONLY the Markdown document.`;

export function buildMvpGenerationInput(
  ctx: IdeaContext,
  conversation: string,
): { system: string; prompt: string } {
  return {
    system: IDEA_MVP_SYSTEM_PROMPT,
    prompt: `IDEA CONTEXT:
${renderIdeaContext(ctx)}

RESEARCH:
${ctx.research?.trim() || "(none)"}

CONVERSATION SO FAR:
${conversation || "(none)"}

Write MVP.md now.`,
  };
}

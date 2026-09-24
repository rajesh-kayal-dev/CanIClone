/**
 * Prompt builders for the Ideas workspace. All of these drive the real Mistral
 * model via the Vercel AI SDK — nothing here fabricates a response. They only
 * shape the system/user text from data the caller already has (the persisted idea,
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

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

function field(label: string, value: string | null): string {
  return value && value.trim() ? `- ${label}: ${value.trim()}` : null!;
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
    field("Latest research", ctx.research),
    field("Current build prompt", ctx.prompt),
  ].filter((l): l is string => Boolean(l));
  return lines.length ? lines.join("\n") : "(no details captured yet)";
}

export const IDEA_CHAT_SYSTEM_PROMPT = `You are the CanIClone Idea Assistant. You help a solo builder turn a rough idea into something they could actually ship.

Style:
- Conversational and concise. Ask ONE question at a time.
- If you do not yet know what problem the user wants to solve, your first message is exactly: "What problem would you like to solve?"
- Then ask only for what you genuinely need: the idea/solution, target users, purpose, budget, technology preference. Never interrogate — the user may skip any question.
- Once you understand the idea, produce a short structured analysis with these headings: Problem, Idea, Target Users, Current Understanding, Potential Opportunity, Things to Validate, MVP Direction.
- When research findings are present in the context, use them to CHALLENGE the idea honestly: what looks promising, existing solutions, possible gaps, what is still uncertain, what should be validated.
- Never invent facts about the market or competitors. If you lack evidence, say so and suggest what to validate.
- You are not able to browse the web yourself; a separate Research action does that.`;

export function buildIdeaChatMessages(
  ctx: IdeaContext,
  history: ChatTurn[],
): { system: string; messages: ChatTurn[] } {
  const system = `${IDEA_CHAT_SYSTEM_PROMPT}

CURRENT IDEA CONTEXT (source of truth — do not add anything not present here):
${renderIdeaContext(ctx)}`;
  return { system, messages: history };
}

export const IDEA_RESEARCH_SYSTEM_PROMPT = `You are a product research analyst. You are given a startup idea and a set of web research results (titles, urls, and text snippets). Synthesize them into an honest assessment.

Produce these sections:
- What looks promising
- Existing solutions (name them from the results only)
- Possible gaps
- What is still uncertain
- What should be validated

Rules:
- Use ONLY the supplied research results as evidence. Cite the source url inline when you use a specific claim.
- Do NOT invent competitors, numbers, or features that are not in the results.
- If the results are thin or irrelevant, say so plainly.`;

export const IDEA_RESEARCH_QUERY_SYSTEM_PROMPT = `You turn a product idea into ONE concise web-search query used to find existing solutions, competitors, and market signals. Output ONLY the query text on a single line — no quotes, no explanation.`;

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

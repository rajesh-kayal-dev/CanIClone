import { prisma } from "@caniclone/database";
import { generateResearchQuery, synthesizeResearch } from "@caniclone/ai";

import { isResearchEnabled, ResearchUnavailableError, searchWeb } from "../lib/firecrawl.js";
import { appendMessage, loadOwnedIdea, toIdeaContext } from "./ideas-ai.service.js";

/**
 * Research pipeline: idea context -> Mistral (search query) -> Firecrawl (web
 * search) -> Mistral (honest synthesis) -> persisted on the idea. Gated behind
 * FIRECRAWL_API_KEY; never fabricates results.
 */

export interface ResearchOutcome {
  query: string;
  hits: { url: string; title: string; description: string }[];
  analysis: string;
}

export async function runResearch(
  ideaId: string,
  anonymousUserId: string,
  signal?: AbortSignal,
): Promise<ResearchOutcome> {
  if (!isResearchEnabled()) throw new ResearchUnavailableError();

  const idea = await loadOwnedIdea(ideaId, anonymousUserId);
  const context = toIdeaContext(idea);

  const query = await generateResearchQuery(context, signal);
  if (!query) throw new ResearchUnavailableError("Could not derive a research query");

  const hits = await searchWeb(query, 5);
  const resultsText = hits.length
    ? hits
        .map((h, i) => `[${i + 1}] ${h.title}\n${h.url}\n${h.description}`.trim())
        .join("\n\n")
    : "(no web results returned)";

  const analysis = await synthesizeResearch(context, resultsText, signal);

  await prisma.research.create({
    data: { ideaId, query, results: hits as unknown as object, analysis, status: "complete" },
  });
  await prisma.idea.update({ where: { id: ideaId }, data: { research: analysis } });
  await appendMessage(ideaId, "assistant", "research", analysis);

  return { query, hits, analysis };
}

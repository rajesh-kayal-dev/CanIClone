import { prisma } from "@caniclone/database";
import { generateResearchQuery, synthesizeResearch } from "@caniclone/ai";

import { isResearchEnabled, ResearchUnavailableError, searchWeb } from "../../integrations/firecrawl.js";
import { appendMessage, loadOwnedIdea, toIdeaContext } from "./ideas-ai.service.js";

/**
 * Research pipeline: idea context -> AI search query -> Firecrawl web search ->
 * AI synthesis -> persisted on the idea. Gated behind FIRECRAWL_API_KEY; never
 * fabricates results.
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
  onProgress: (message: string) => void = () => undefined,
): Promise<ResearchOutcome> {
  if (!isResearchEnabled()) throw new ResearchUnavailableError();

  const idea = await loadOwnedIdea(ideaId, anonymousUserId);
  const context = toIdeaContext(idea);

  onProgress("Planning the research question...");
  const query = await generateResearchQuery(context, signal);
  if (!query) throw new ResearchUnavailableError("Could not derive a research query");

  onProgress("Searching live sources with Firecrawl...");
  const hits = await searchWeb(query, 5, signal);
  onProgress("Analyzing the retrieved sources...");
  const resultsText = hits.length
    ? hits
        .map((h, i) => `[${i + 1}] ${h.title}\n${h.url}\n${h.description}`.trim())
        .join("\n\n")
    : "(no web results returned)";

  const analysis = await synthesizeResearch(context, resultsText, signal);

  onProgress("Saving the research findings...");
  await prisma.research.create({
    data: { ideaId, query, results: hits as unknown as object, analysis, status: "complete" },
  });
  await prisma.idea.update({ where: { id: ideaId }, data: { research: analysis } });
  await appendMessage(ideaId, "assistant", "research", analysis);

  return { query, hits, analysis };
}

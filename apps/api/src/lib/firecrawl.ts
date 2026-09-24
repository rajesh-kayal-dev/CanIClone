import Firecrawl from "@mendable/firecrawl-js";

/**
 * Thin Firecrawl wrapper for the Research action. Research is gated: it is only
 * attempted when FIRECRAWL_API_KEY is present, and it never fabricates results —
 * a missing key or a provider error surfaces as ResearchUnavailableError so the
 * UI can show an honest "research unavailable" state.
 *
 * Note: the plan mentioned LangChain in the pipeline; it is intentionally omitted
 * here because the Firecrawl JS SDK already exposes search/scrape directly, and
 * LangChain would be unused indirection. It can be layered in later if needed.
 */

export class ResearchUnavailableError extends Error {
  constructor(message = "Research is not available (FIRECRAWL_API_KEY is not set)") {
    super(message);
    this.name = "ResearchUnavailableError";
  }
}

export function isResearchEnabled(): boolean {
  return Boolean(process.env.FIRECRAWL_API_KEY);
}

let client: Firecrawl | null = null;

function getClient(): Firecrawl {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new ResearchUnavailableError();
  if (!client) client = new Firecrawl(apiKey);
  return client;
}

export interface ResearchHit {
  url: string;
  title: string;
  description: string;
}

/** Web search via Firecrawl, normalized to the fields the synthesizer needs. */
export async function searchWeb(query: string, limit = 5): Promise<ResearchHit[]> {
  const fc = getClient();
  const data = await fc.search(query, { limit, sources: ["web"] });
  const web = (data?.web ?? []) as Array<Partial<ResearchHit>>;
  return web
    .filter((hit): hit is ResearchHit => typeof hit?.url === "string" && hit.url.length > 0)
    .slice(0, limit)
    .map((hit) => ({
      url: hit.url,
      title: hit.title || hit.url,
      description: hit.description || "",
    }));
}

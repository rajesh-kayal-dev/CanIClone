import Firecrawl from "@mendable/firecrawl-js";

/** Clean, client-safe errors for the Ideas and App AI research workflows. */
export class ResearchUnavailableError extends Error {
  constructor(message = "Research is not available (FIRECRAWL_API_KEY is not set)") {
    super(message);
    this.name = "ResearchUnavailableError";
  }
}

let client: Firecrawl | null = null;

function getApiKey(): string {
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();
  if (!apiKey) throw new ResearchUnavailableError();
  return apiKey;
}

function getClient(): Firecrawl {
  if (!client) client = new Firecrawl(getApiKey());
  return client;
}

function abortError(): Error {
  const error = new Error("Research request cancelled");
  error.name = "AbortError";
  return error;
}

function findStatusCode(error: unknown): number | undefined {
  let current = error as
    | { statusCode?: number; response?: { status?: number }; cause?: unknown }
    | null
    | undefined;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (typeof current.statusCode === "number") return current.statusCode;
    if (typeof current.response?.status === "number") return current.response.status;
    current = current.cause as typeof current;
  }
  return undefined;
}

export function isResearchEnabled(): boolean {
  return Boolean(process.env.FIRECRAWL_API_KEY?.trim());
}

export interface ResearchHit {
  url: string;
  title: string;
  description: string;
}

async function searchWithClient(
  query: string,
  limit: number,
  signal?: AbortSignal,
): Promise<{ web?: Array<Partial<ResearchHit>> }> {
  if (signal?.aborted) throw abortError();

  const firecrawl = getClient();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let abortHandler: (() => void) | undefined;

  try {
    const searchPromise = firecrawl.search(query, { limit, sources: ["web"] }) as Promise<{
      web?: Array<Partial<ResearchHit>>;
    }>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error("Firecrawl request timed out")), 30_000);
    });
    const abortPromise = signal
      ? new Promise<never>((_, reject) => {
          abortHandler = () => reject(abortError());
          if (signal.aborted) abortHandler();
          else signal.addEventListener("abort", abortHandler, { once: true });
        })
      : null;

    return await Promise.race(
      abortPromise ? [searchPromise, timeoutPromise, abortPromise] : [searchPromise, timeoutPromise],
    );
  } finally {
    if (timeout) clearTimeout(timeout);
    if (signal && abortHandler) signal.removeEventListener("abort", abortHandler);
  }
}

/** Search the web through one server-side Firecrawl client and normalize results. */
export async function searchWeb(
  query: string,
  limit = 5,
  signal?: AbortSignal,
): Promise<ResearchHit[]> {
  if (!isResearchEnabled()) throw new ResearchUnavailableError();

  try {
    const data = await searchWithClient(query, limit, signal);
    const web = data.web ?? [];
    return web
      .filter((hit): hit is ResearchHit => typeof hit?.url === "string" && hit.url.length > 0)
      .slice(0, limit)
      .map((hit) => ({
        url: hit.url,
        title: hit.title || hit.url,
        description: hit.description || "",
      }));
  } catch (error) {
    if (signal?.aborted || (error instanceof Error && error.name === "AbortError")) throw error;

    const status = findStatusCode(error);
    if (status === 402) {
      throw new ResearchUnavailableError(
        "Live research is unavailable because the configured Firecrawl account has insufficient credits.",
      );
    }
    if (status === 429) {
      throw new ResearchUnavailableError(
        "Live research is temporarily rate-limited. Please try again later.",
      );
    }
    if (status === 401 || status === 403) {
      throw new ResearchUnavailableError("Live research credentials are not available on the server.");
    }

    throw new ResearchUnavailableError(
      "Live research could not be completed because the Firecrawl request failed or timed out.",
    );
  }
}

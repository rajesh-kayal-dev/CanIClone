import { ApiError, getApiUrl, cachedApiFetch } from './client';

export const OPPORTUNITIES_PAGE_LIMIT = 10;

export type OpportunityVerdict = 'YES' | 'KINDA' | 'NO';
export type OpportunityDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
export type MarketDirection = 'RISING' | 'STABLE' | 'FALLING';
export type OpportunityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface OpportunityRecord {
  slug: string;
  name: string;
  domain: string | null;
  category: string;
  verdict: OpportunityVerdict;
  difficulty: OpportunityDifficulty | null;
  buildTime: string | null;
  estimatedCost: { min: number; max: number; currency: 'USD' } | null;
  market: {
    direction: MarketDirection | null;
    growthPercent: number | null;
    currentInterest: number | null;
  };
  openSourceAlternatives: number;
  signals: {
    cloneability: string;
    market: string;
    cost: string;
    buildTime: string;
    openSource: string;
  };
  opportunityLevel: OpportunityLevel;
  ratio: number;
}

export interface OpportunitiesPageParams {
  page?: number;
  limit?: number;
  category?: string;
  verdict?: string;
  difficulty?: string;
  market?: string;
  sort?: string;
  q?: string;
}

export interface OpportunitiesPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface OpportunitiesPageResult {
  items: OpportunityRecord[];
  pagination: OpportunitiesPagination;
}

interface ApiOpportunity {
  app: { slug: string; name: string; domain: string | null; category: string };
  verdict: OpportunityVerdict;
  difficulty: OpportunityDifficulty | null;
  buildTime: string | null;
  estimatedCost: { min: number; max: number; currency: 'USD' } | null;
  market: {
    direction: MarketDirection | null;
    growthPercent: number | null;
    currentInterest: number | null;
  };
  openSourceAlternatives: number;
  signals: OpportunityRecord['signals'];
  opportunityLevel: OpportunityLevel;
  ratio: number;
}

type OpportunityRequestOptions = {
  signal?: AbortSignal;
  cached?: boolean;
};

function toRecord(o: ApiOpportunity): OpportunityRecord {
  return {
    slug: o.app.slug,
    name: o.app.name,
    domain: o.app.domain,
    category: o.app.category,
    verdict: o.verdict,
    difficulty: o.difficulty,
    buildTime: o.buildTime,
    estimatedCost: o.estimatedCost,
    market: o.market,
    openSourceAlternatives: o.openSourceAlternatives,
    signals: o.signals,
    opportunityLevel: o.opportunityLevel,
    ratio: o.ratio,
  };
}

function buildQuery(params: OpportunitiesPageParams): string {
  const qs = new URLSearchParams();
  qs.set('limit', String(params.limit ?? OPPORTUNITIES_PAGE_LIMIT));
  if (params.page && params.page > 1) qs.set('page', String(params.page));
  if (params.category && params.category !== 'all') qs.set('category', params.category);
  if (params.verdict && params.verdict !== 'all') qs.set('verdict', params.verdict.toLowerCase());
  if (params.difficulty && params.difficulty !== 'all') qs.set('difficulty', params.difficulty);
  if (params.market && params.market !== 'all') qs.set('market', params.market);
  if (params.sort) qs.set('sort', params.sort);
  if (params.q?.trim()) qs.set('q', params.q.trim());
  return qs.toString();
}

export async function getOpportunitiesPage(
  params: OpportunitiesPageParams = {},
  options: OpportunityRequestOptions = {},
): Promise<OpportunitiesPageResult> {
  const url = `${getApiUrl()}/api/opportunities?${buildQuery(params)}`;
  const init: RequestInit & {
    next?: { revalidate?: number; tags?: string[] };
  } = options.cached
    ? {
        cache: 'force-cache',
        next: { revalidate: 60, tags: ['opportunities'] },
      }
    : { cache: 'no-store' };
  if (options.signal) init.signal = options.signal;

  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body?.message ?? `API ${res.status}`);
  }
  const json = await res.json();
  const items = ((json.data ?? []) as ApiOpportunity[]).map(toRecord);
  const pagination: OpportunitiesPagination = json.pagination ?? {
    page: 1,
    limit: params.limit ?? OPPORTUNITIES_PAGE_LIMIT,
    total: items.length,
    hasMore: false,
  };
  return { items, pagination };
}

export async function getOpportunityBySlug(
  slug: string,
): Promise<OpportunityRecord | null> {
  try {
    const response = await cachedApiFetch<ApiOpportunity>(
      `/api/opportunities/${encodeURIComponent(slug)}`,
      300,
      [`opportunity:${slug}`],
    );
    return toRecord(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

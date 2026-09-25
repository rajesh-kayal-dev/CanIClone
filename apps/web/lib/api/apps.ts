import { apiFetch, ApiError, cachedApiFetch, getApiUrl } from './client';
import type {
  ApiAppDetail,
  ApiCategoryStat,
  ApiHybridSearchResult,
  ApiListApp,
  AppRecord,
} from './types';
import {
  confidenceToPercent,
  formatPricing,
  toOfficialUrl,
  upperVerdict,
} from './format';

export const APPS_PAGE_LIMIT = 10;

export interface AppsPageParams {
  page?: number;
  limit?: number;
  category?: string;
  verdict?: string;
  sort?: string;
  q?: string;
}

export interface AppsPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface AppsPageResult {
  items: AppRecord[];
  pagination: AppsPagination;
}

type AppRequestOptions = {
  signal?: AbortSignal;
  cached?: boolean;
};

function buildAppsQuery(params: AppsPageParams): string {
  const qs = new URLSearchParams();
  qs.set('limit', String(params.limit ?? APPS_PAGE_LIMIT));
  if (params.page && params.page > 1) qs.set('page', String(params.page));
  if (params.category && params.category !== 'all') qs.set('category', params.category);
  if (params.verdict && params.verdict !== 'all') qs.set('verdict', params.verdict.toLowerCase());
  if (params.sort) qs.set('sort', params.sort);
  if (params.q?.trim()) qs.set('q', params.q.trim());
  return qs.toString();
}

async function fetchAppsEnvelope(
  params: AppsPageParams,
  options: AppRequestOptions = {},
  endpoint = '/api/apps',
): Promise<AppsPageResult> {
  const url = `${getApiUrl()}${endpoint}?${buildAppsQuery(params)}`;
  const init: RequestInit & {
    next?: { revalidate?: number; tags?: string[] };
  } = options.cached
    ? {
        cache: 'force-cache',
        next: { revalidate: 30, tags: ['apps'] },
      }
    : { cache: 'no-store' };
  if (options.signal) init.signal = options.signal;

  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body?.message ?? `API ${res.status}`);
  }
  const json = await res.json();
  const items = ((json.data ?? []) as ApiListApp[]).map(toListRecord);
  const pagination: AppsPagination = json.pagination ?? {
    page: 1,
    limit: params.limit ?? APPS_PAGE_LIMIT,
    total: items.length,
    hasMore: false,
  };
  return { items, pagination };
}

export async function getAppsPage(
  params: AppsPageParams = {},
  options: AppRequestOptions = {},
): Promise<AppsPageResult> {
  return fetchAppsEnvelope(params, options);
}

export async function getCloneListPage(
  params: AppsPageParams = {},
  options: AppRequestOptions = {},
): Promise<AppsPageResult> {
  return fetchAppsEnvelope(params, options, '/api/clone-list');
}

function toListRecord(a: ApiListApp): AppRecord {
  return {
    slug: a.slug,
    name: a.name,
    tagline: a.tagline ?? '',
    category: a.category,
    pricing: formatPricing(a.priceMonthly),
    priceMonthly: a.priceMonthly,
    verdict: upperVerdict(a.verdict),
    confidence: confidenceToPercent(a.verdictConfidence),
    voteCount: a.voteCount ?? 0,
    pagePriority: a.pagePriority ?? 3,
    alternativeCount: a.alternativeCount ?? 0,
    popularityScore: a.popularityScore ?? 0,
    marketDirection: a.marketDirection ?? null,
    marketGrowth: a.marketGrowth ?? null,
    marketInterest: a.marketInterest ?? null,
    marketFetchedAt: a.marketFetchedAt ?? null,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    description: a.verdictSummary ?? '',
    officialUrl: toOfficialUrl(a.domain),
    stack: [],
    requirements: [],
    whatYouLose: [],
    moat: [],
    diyTimeEstimate: a.diyTimeEstimate ?? '',
    prompt: '',
    alternatives: [],
    tags: [],
    whyPeopleStillPay: '',
    moatNotes: '',
    coreLoopDIY: '',
    pricingPlans: [],
    openSource: [],
    priorArt: [],
    verifiedOneShot: false,
  };
}

function toDetailRecord(a: ApiAppDetail): AppRecord {
  return {
    ...toListRecord(a),
    description: a.verdictSummary ?? '',
    officialUrl: toOfficialUrl(a.domain),
    stack: [],
    requirements: Array.isArray(a.requirements) ? (a.requirements as string[]) : [],
    whatYouLose: Array.isArray(a.whatYouLose) ? (a.whatYouLose as string[]) : [],
    moat: Array.isArray(a.moatTags) ? (a.moatTags as string[]) : [],
    diyTimeEstimate: a.diyTimeEstimate ?? '',
    prompt: a.prompt ?? '',
    alternatives: Array.isArray(a.relatedSlugs)
      ? (a.relatedSlugs as string[])
      : [],
    tags: [],
    whyPeopleStillPay: a.whyPeopleStillPay ?? '',
    moatNotes: a.moatNotes ?? '',
    coreLoopDIY: a.coreLoopDIY ?? '',
    pricingPlans: Array.isArray(a.pricingPlans)
      ? a.pricingPlans.map((p) => ({
          name: p.name,
          monthly: p.monthly,
          annualPerMonth: p.annualPerMonth,
          per: p.per,
          limits: p.limits,
          notes: p.notes,
        }))
      : [],
    openSource: Array.isArray(a.alternatives)
      ? a.alternatives.map((alt) => ({
          name: alt.name,
          url: alt.url,
          repo: alt.repo,
          description: alt.description,
          stars: alt.stars,
          lastCommit: alt.lastCommit,
          selfHost: alt.selfHost,
          type: alt.type,
        }))
      : [],
    priorArt: Array.isArray(a.priorArt)
      ? (a.priorArt as Record<string, unknown>[])
          .map((p) => ({
            name: String(p.name ?? ''),
            url: String(p.url ?? ''),
            desc: String(p.desc ?? ''),
            status: p.status ? String(p.status) : null,
          }))
          .filter((p) => p.name || p.url)
      : [],
    verifiedOneShot: Boolean(a.verifiedOneShot),
  };
}

/** The first page is intentionally the only directory data fetched by default. */
export async function getApps(): Promise<AppRecord[]> {
  return (await getAppsPage({ limit: APPS_PAGE_LIMIT }, { cached: true })).items;
}

export async function getAppCount(): Promise<number> {
  const result = await cachedApiFetch<{ count: number }>('/api/apps/stats', 120, [
    'apps',
  ]);
  return result.count;
}

export async function getTrendingApps(limit = 10): Promise<AppRecord[]> {
  return (
    await getAppsPage(
      { limit: Math.min(50, Math.max(1, limit)), sort: 'trending' },
      { cached: true },
    )
  ).items;
}

export async function getPopularApps(limit = 10): Promise<AppRecord[]> {
  return (
    await getAppsPage(
      { limit: Math.min(50, Math.max(1, limit)), sort: 'popular' },
      { cached: true },
    )
  ).items;
}

export async function getAppBySlug(slug: string): Promise<AppRecord | null> {
  try {
    const detail = await cachedApiFetch<ApiAppDetail>(
      `/api/apps/${encodeURIComponent(slug)}`,
      300,
      [`app:${slug}`],
    );
    return toDetailRecord(detail);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function getAppsByCategory(
  categorySlug: string,
  limit = APPS_PAGE_LIMIT,
): Promise<AppRecord[]> {
  return (
    await getAppsPage(
      { category: categorySlug, limit, sort: 'name' },
      { cached: true },
    )
  ).items;
}

export async function countAppsByCategory(categorySlug: string): Promise<number> {
  const category = await cachedApiFetch<ApiCategoryStat>(
    `/api/apps/categories/${encodeURIComponent(categorySlug)}`,
    120,
    ['categories'],
  );
  return category.appCount;
}

/** Related rows are resolved by the API, not by loading all 996 apps here. */
export async function getRelatedApps(
  appOrSlug: AppRecord | string,
  limit = 4,
): Promise<AppRecord[]> {
  const slug = typeof appOrSlug === 'string' ? appOrSlug : appOrSlug.slug;
  const rows = await cachedApiFetch<ApiListApp[]>(
    `/api/apps/${encodeURIComponent(slug)}/related?limit=${limit}`,
    300,
    [`app-related:${slug}`],
  );
  return rows.map(toListRecord);
}

export async function getAlternatives(
  app: AppRecord,
  limit = 4,
): Promise<AppRecord[]> {
  return getRelatedApps(app, limit);
}

export async function searchApps(
  query: string,
  limit = 20,
  signal?: AbortSignal,
): Promise<AppRecord[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const rows = await apiFetch<ApiHybridSearchResult[]>(
    `/api/apps/search?q=${encodeURIComponent(trimmed)}&limit=${Math.min(50, Math.max(1, limit))}`,
    { signal },
  );
  return rows.map(toListRecord);
}

export async function searchSuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<AppRecord[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return searchApps(trimmed, 5, signal);
}

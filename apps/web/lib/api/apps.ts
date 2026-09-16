import { apiFetch, ApiError } from './client';
import type { ApiListApp, ApiAppDetail, AppRecord } from './types';
import { upperVerdict, confidenceToPercent, formatPricing, toOfficialUrl } from './format';

function toListRecord(a: ApiListApp): AppRecord {
  return {
    slug: a.slug,
    name: a.name,
    tagline: a.tagline ?? '',
    category: a.category,
    pricing: formatPricing(a.priceMonthly),
    verdict: upperVerdict(a.verdict),
    confidence: confidenceToPercent(a.verdictConfidence),
    voteCount: a.voteCount,
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
    alternatives: Array.isArray(a.relatedSlugs) ? (a.relatedSlugs as string[]) : [],
    tags: [],
  };
}

let _appsCache: ApiListApp[] | null = null;

async function fetchApps(): Promise<ApiListApp[]> {
  if (!_appsCache) _appsCache = await apiFetch<ApiListApp[]>('/api/apps');
  return _appsCache;
}

export async function getApps(): Promise<AppRecord[]> {
  const apps = await fetchApps();
  return apps.map(toListRecord);
}

export async function getAppCount(): Promise<number> {
  const apps = await fetchApps();
  return apps.length;
}

export async function getPopularApps(limit = 6): Promise<AppRecord[]> {
  const apps = await fetchApps();
  const sorted = [...apps].sort((a, b) => b.voteCount - a.voteCount).slice(0, limit);
  return sorted.map(toListRecord);
}

export async function getAppBySlug(slug: string): Promise<AppRecord | null> {
  try {
    const detail = await apiFetch<ApiAppDetail>(`/api/apps/${encodeURIComponent(slug)}`);
    return toDetailRecord(detail);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function getAppsByCategory(categorySlug: string): Promise<AppRecord[]> {
  const apps = await fetchApps();
  return apps
    .filter((a) => a.category === categorySlug)
    .map(toListRecord);
}

export async function countAppsByCategory(categorySlug: string): Promise<number> {
  const apps = await fetchApps();
  return apps.filter((a) => a.category === categorySlug).length;
}

export async function getAlternatives(app: AppRecord, limit = 4): Promise<AppRecord[]> {
  const all = await fetchApps();
  const allMap = new Map(all.map((a) => [a.slug, a]));

  const curated = (app.alternatives as string[])
    .map((slug) => allMap.get(slug))
    .filter((a): a is ApiListApp => !!a && a.slug !== app.slug)
    .slice(0, limit);

  if (curated.length >= limit) return curated.map(toListRecord);

  const fill = all
    .filter(
      (a) =>
        a.slug !== app.slug &&
        !curated.some((c) => c.slug === a.slug)
    )
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, limit - curated.length);

  return [...curated, ...fill].map(toListRecord);
}

export async function getRelatedApps(app: AppRecord, limit = 4): Promise<AppRecord[]> {
  const all = await fetchApps();
  const sameCategory = all
    .filter((a) => a.slug !== app.slug && a.category === app.category)
    .sort((a, b) => b.voteCount - a.voteCount);

  const fill = all
    .filter(
      (a) =>
        a.slug !== app.slug &&
        !sameCategory.some((s) => s.slug === a.slug)
    )
    .sort((a, b) => b.voteCount - a.voteCount);

  return [...sameCategory, ...fill].slice(0, limit).map(toListRecord);
}

export async function searchApps(query: string): Promise<AppRecord[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const apps = await apiFetch<ApiListApp[]>(`/api/apps/search?q=${encodeURIComponent(trimmed)}`);
  return apps.map(toListRecord);
}

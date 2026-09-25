import { prisma } from '@caniclone/database';

const API_BASE = 'https://api.trendsapi.ai/api';

export interface NormalizedTopTrendApp {
  rank: number;
  name: string;
  identifier: string | null;
  developer: string | null;
  category: string | null;
  icon: string | null;
  url: string | null;
  slug?: string | null;
}

export interface CachedTrendsData<T = unknown> {
  data: T | null;
  fetchedAt: Date | null;
  stale: boolean;
}

export interface TrendsFetchOptions {
  forceRefresh?: boolean;
}

const VERIFIED_IDENTIFIERS: Record<string, string> = {
  'com.openai.chatgpt': 'chatgpt',
  'com.anthropic.claude': 'claude',
  'ai.perplexity.app': 'perplexity',
  'notion.id': 'notion',
};

const KNOWN_DOMAINS: Record<string, string> = {
  chatgpt: 'chatgpt.com',
  claude: 'claude.ai',
  'claude by anthropic': 'claude.ai',
  'google gemini': 'gemini.google.com',
  gemini: 'gemini.google.com',
  'whatsapp messenger': 'whatsapp.com',
  whatsapp: 'whatsapp.com',
  facebook: 'facebook.com',
  instagram: 'instagram.com',
  youtube: 'youtube.com',
  google: 'google.com',
  'google photos': 'photos.google.com',
  tiktok: 'tiktok.com',
  'tiktok pro': 'tiktok.com',
  messenger: 'messenger.com',
  vinted: 'vinted.com',
  depop: 'depop.com',
  polymarket: 'polymarket.com',
  flipkart: 'flipkart.com',
  hotschedules: 'hotschedules.com',
  procreate: 'procreate.com',
  'procreate pocket': 'procreate.com',
  shadowrocket: 'shadowlaunch.com',
  'paprika recipe manager': 'paprikaapp.com',
  'ankimobile flashcards': 'ankisrs.net',
};

function getApiKey(): string | null {
  return process.env.TRENDS_API_KEY || null;
}

export function getChartCacheKey(chartType: string): string {
  const normalized = chartType.toLowerCase().replace(/[^a-z0-9]/g, '_');
  if (normalized.includes('paid')) return 'trendsapi:top_trends:app_store_top_paid';
  if (normalized.includes('google') || normalized.includes('play')) {
    return 'trendsapi:top_trends:google_play';
  }
  return 'trendsapi:top_trends:app_store_top_free';
}

export function getTrendsApiType(chartType: string): string {
  const lower = chartType.toLowerCase();
  if (lower.includes('paid')) return 'App Store Top Paid';
  if (lower.includes('google') || lower.includes('play')) return 'Google Play';
  return 'App Store Top Free';
}

async function fetchFromTrendsApi(body: unknown): Promise<unknown> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('TRENDS_API_KEY is not configured');

  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Trends API error ${res.status}: ${errorText}`);
  }

  const json: unknown = await res.json();
  if (json && typeof json === 'object' && 'body' in json) {
    const bodyValue = (json as { body?: unknown }).body;
    if (typeof bodyValue === 'string') {
      try {
        return JSON.parse(bodyValue);
      } catch {
        return json;
      }
    }
  }
  return json;
}

function isCacheFresh(fetchedAt: Date): boolean {
  const oneDay = 24 * 60 * 60 * 1000;
  return Date.now() - fetchedAt.getTime() < oneDay;
}

type DirectoryApp = {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  category: string;
};

let directoryAppsPromise: Promise<DirectoryApp[]> | null = null;

/** Matching a sync batch loads the directory once, not once per chart. */
async function getDirectoryApps(): Promise<DirectoryApp[]> {
  if (!directoryAppsPromise) {
    directoryAppsPromise = prisma.app
      .findMany({
        select: { id: true, name: true, slug: true, domain: true, category: true },
      })
      .then((apps) => apps);
  }
  return directoryAppsPromise;
}

async function normalizeAndMatchApps(rawItems: unknown): Promise<NormalizedTopTrendApp[]> {
  if (!Array.isArray(rawItems)) return [];
  const existingApps = await getDirectoryApps();
  const nameMap = new Map(existingApps.map((app) => [app.name.toLowerCase().trim(), app]));
  const domainMap = new Map(
    existingApps
      .filter((app) => app.domain)
      .map((app) => [app.domain!.toLowerCase().trim(), app]),
  );

  return rawItems.map((item: unknown, index: number) => {
    let rank = index + 1;
    let name = '';
    let identifier: string | null = null;
    let developer: string | null = null;
    let category: string | null = null;
    let icon: string | null = null;
    let url: string | null = null;

    if (Array.isArray(item)) {
      rank = typeof item[0] === 'number' ? item[0] : index + 1;
      name = typeof item[1] === 'string' ? item[1].trim() : String(item[0] ?? '').trim();
    } else if (item && typeof item === 'object') {
      const object = item as Record<string, unknown>;
      rank = Number(object.rank ?? object.position ?? object.index ?? index + 1);
      name = String(object.name ?? object.title ?? object.app_name ?? '').trim();
      const stringOrNull = (value: unknown): string | null =>
        value === null || value === undefined ? null : String(value);
      identifier = stringOrNull(
        object.identifier ?? object.id ?? object.bundle_id ?? object.package_name,
      );
      developer = stringOrNull(
        object.developer ?? object.publisher ?? object.author ?? object.developer_name,
      );
      category = stringOrNull(object.category ?? object.genre ?? object.category_name);
      icon = stringOrNull(
        object.icon ?? object.icon_url ?? object.logo ?? object.artworkUrl ?? object.artworkUrl512,
      );
      url = stringOrNull(object.url ?? object.link ?? object.store_url);
    }

    let matchedApp: DirectoryApp | undefined;
    if (identifier && VERIFIED_IDENTIFIERS[String(identifier)]) {
      const slug = VERIFIED_IDENTIFIERS[String(identifier)];
      matchedApp = existingApps.find((app) => app.slug === slug);
    }

    if (!matchedApp && name) {
      const lowerName = name.toLowerCase().trim();
      matchedApp = nameMap.get(lowerName);
      if (!matchedApp) {
        const cleanName = lowerName.split(/[:\-–]/)[0]?.trim();
        if (cleanName && cleanName !== lowerName) matchedApp = nameMap.get(cleanName);
      }
    }

    if (!matchedApp && url) {
      try {
        const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
        if (!hostname.includes('apple.com') && !hostname.includes('google.com')) {
          matchedApp = domainMap.get(hostname);
        }
      } catch {
        // Ignore malformed provider URLs.
      }
    }

    let slug: string | null = null;
    if (matchedApp) {
      slug = matchedApp.slug;
      if (!category) category = matchedApp.category;
      if (!icon && matchedApp.domain) {
        icon = `https://www.google.com/s2/favicons?domain=${matchedApp.domain}&sz=64`;
      }
    }

    if (!icon && name) {
      const lower = name.toLowerCase().trim();
      const cleanLower = lower.split(/[:\-–]/)[0]?.trim();
      const knownDomain = KNOWN_DOMAINS[lower] || KNOWN_DOMAINS[cleanLower];
      if (knownDomain) icon = `https://www.google.com/s2/favicons?domain=${knownDomain}&sz=64`;
    }

    if (!icon && url) {
      try {
        const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
        if (!hostname.includes('apple.com') && !hostname.includes('google.com')) {
          icon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
        }
      } catch {
        // Ignore malformed provider URLs.
      }
    }

    return {
      rank,
      name,
      identifier: identifier ? String(identifier) : null,
      developer: developer ? String(developer) : null,
      category: category ? String(category) : null,
      icon,
      url,
      slug,
    };
  });
}

export async function getCachedTopCharts(
  type: string,
): Promise<CachedTrendsData<NormalizedTopTrendApp[]>> {
  const cacheKey = getChartCacheKey(type);
  const cached = await prisma.marketCache.findUnique({ where: { key: cacheKey } });
  const data = Array.isArray(cached?.data)
    ? (cached.data as unknown as NormalizedTopTrendApp[])
    : null;
  return {
    data,
    fetchedAt: cached?.fetchedAt ?? null,
    stale: Boolean(cached && !isCacheFresh(cached.fetchedAt)),
  };
}

export async function getCachedTopChartsFor(
  types: string[],
): Promise<Map<string, CachedTrendsData<NormalizedTopTrendApp[]>>> {
  const keys = types.map(getChartCacheKey);
  const rows = await prisma.marketCache.findMany({ where: { key: { in: keys } } });
  const byKey = new Map(rows.map((row) => [row.key, row]));
  return new Map(
    types.map((type) => {
      const row = byKey.get(getChartCacheKey(type));
      const data = Array.isArray(row?.data)
        ? (row.data as unknown as NormalizedTopTrendApp[])
        : null;
      return [
        type,
        {
          data,
          fetchedAt: row?.fetchedAt ?? null,
          stale: Boolean(row && !isCacheFresh(row.fetchedAt)),
        },
      ];
    }),
  );
}

export async function getTopCharts(
  type: string,
  limit = 10,
  options: TrendsFetchOptions = {},
): Promise<NormalizedTopTrendApp[]> {
  const cacheKey = getChartCacheKey(type);
  const apiType = getTrendsApiType(type);
  const cached = await prisma.marketCache.findUnique({ where: { key: cacheKey } });
  const cachedItems = Array.isArray(cached?.data) ? cached.data : [];

  if (!options.forceRefresh && cached && isCacheFresh(cached.fetchedAt) && cachedItems.length > 0) {
    return cachedItems as unknown as NormalizedTopTrendApp[];
  }

  try {
    const rawResponse = await fetchFromTrendsApi({
      mode: 'get_top_trends',
      type: apiType,
      limit,
    });
    const record = rawResponse && typeof rawResponse === 'object'
      ? (rawResponse as Record<string, unknown>)
      : {};
    const rawList = Array.isArray(rawResponse)
      ? rawResponse
      : record.data ?? record.apps ?? record.items ?? record.results ?? [];
    const normalizedApps = await normalizeAndMatchApps(rawList);
    await prisma.marketCache.upsert({
      where: { key: cacheKey },
      update: { data: JSON.parse(JSON.stringify(normalizedApps)), fetchedAt: new Date() },
      create: {
        key: cacheKey,
        data: JSON.parse(JSON.stringify(normalizedApps)),
        fetchedAt: new Date(),
      },
    });
    return normalizedApps;
  } catch (error) {
    if (cached) {
      console.warn(`[Market Trends] refresh failed for ${type}; returning stale cache`, error);
      return cachedItems as unknown as NormalizedTopTrendApp[];
    }
    throw error;
  }
}

async function getCachedSignal(
  key: string,
): Promise<CachedTrendsData> {
  const cached = await prisma.marketCache.findUnique({ where: { key } });
  return {
    data: cached?.data ?? null,
    fetchedAt: cached?.fetchedAt ?? null,
    stale: Boolean(cached && !isCacheFresh(cached.fetchedAt)),
  };
}

export async function getCachedAppSignals(identifier: string) {
  const [growth, timeSeries] = await Promise.all([
    getCachedSignal(`trendsapi:growth:${identifier}`),
    getCachedSignal(`trendsapi:timeseries:${identifier}`),
  ]);
  return { growth, timeSeries };
}

async function getSignal(
  cacheKey: string,
  body: Record<string, unknown>,
  options: TrendsFetchOptions,
): Promise<unknown> {
  const cached = await getCachedSignal(cacheKey);
  if (!options.forceRefresh && cached.fetchedAt && !cached.stale) return cached.data;

  try {
    const data = await fetchFromTrendsApi(body);
    await prisma.marketCache.upsert({
      where: { key: cacheKey },
      update: { data: JSON.parse(JSON.stringify(data)), fetchedAt: new Date() },
      create: { key: cacheKey, data: JSON.parse(JSON.stringify(data)), fetchedAt: new Date() },
    });
    return data;
  } catch (error) {
    if (cached.data !== null) {
      console.warn(`[Market Trends] refresh failed for ${cacheKey}; returning stale cache`, error);
      return cached.data;
    }
    throw error;
  }
}

export function getAppGrowth(keyword: string, options: TrendsFetchOptions = {}) {
  return getSignal(
    `trendsapi:growth:${keyword}`,
    { mode: 'get_growth', source: 'app downloads', keyword, window: ['3M', '12M'] },
    options,
  );
}

export function getAppTimeSeries(keyword: string, options: TrendsFetchOptions = {}) {
  return getSignal(
    `trendsapi:timeseries:${keyword}`,
    { mode: 'get_time_series', source: 'app downloads', keyword },
    options,
  );
}

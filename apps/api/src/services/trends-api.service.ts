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

const VERIFIED_IDENTIFIERS: Record<string, string> = {
  'com.openai.chatgpt': 'chatgpt',
  'com.anthropic.claude': 'claude',
  'ai.perplexity.app': 'perplexity',
  'notion.id': 'notion',
};

// Known domain mappings for common top apps if unmatched in DB
const KNOWN_DOMAINS: Record<string, string> = {
  'chatgpt': 'chatgpt.com',
  'claude': 'claude.ai',
  'claude by anthropic': 'claude.ai',
  'google gemini': 'gemini.google.com',
  'gemini': 'gemini.google.com',
  'whatsapp messenger': 'whatsapp.com',
  'whatsapp': 'whatsapp.com',
  'facebook': 'facebook.com',
  'instagram': 'instagram.com',
  'youtube': 'youtube.com',
  'google': 'google.com',
  'google photos': 'photos.google.com',
  'tiktok': 'tiktok.com',
  'tiktok pro': 'tiktok.com',
  'messenger': 'messenger.com',
  'vinted': 'vinted.com',
  'depop': 'depop.com',
  'polymarket': 'polymarket.com',
  'flipkart': 'flipkart.com',
  'hotschedules': 'hotschedules.com',
  'procreate': 'procreate.com',
  'procreate pocket': 'procreate.com',
  'shadowrocket': 'shadowlaunch.com',
  'paprika recipe manager': 'paprikaapp.com',
  'ankimobile flashcards': 'ankisrs.net',
};

function getApiKey(): string | null {
  return process.env.TRENDS_API_KEY || null;
}

export function getChartCacheKey(chartType: string): string {
  const normalized = chartType.toLowerCase().replace(/[^a-z0-9]/g, '_');
  if (normalized.includes('paid')) return 'trendsapi:top_trends:app_store_top_paid';
  if (normalized.includes('google') || normalized.includes('play')) return 'trendsapi:top_trends:google_play';
  return 'trendsapi:top_trends:app_store_top_free';
}

export function getTrendsApiType(chartType: string): string {
  const lower = chartType.toLowerCase();
  if (lower.includes('paid')) return 'App Store Top Paid';
  if (lower.includes('google') || lower.includes('play')) return 'Google Play';
  return 'App Store Top Free';
}

async function fetchFromTrendsApi(body: any) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('TRENDS_API_KEY is not configured');
  }

  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Trends API error ${res.status}: ${err}`);
  }

  const json = await res.json();
  if (json && typeof json.body === 'string') {
    try {
      return JSON.parse(json.body);
    } catch {
      return json;
    }
  }

  return json;
}

/**
 * Validates cache freshness (24 hours).
 */
function isCacheFresh(fetchedAt: Date) {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  return Date.now() - fetchedAt.getTime() < ONE_DAY;
}

/**
 * Normalizes raw Trends API items and matches them with existing CanIClone apps.
 */
async function normalizeAndMatchApps(rawItems: any[]): Promise<NormalizedTopTrendApp[]> {
  if (!Array.isArray(rawItems)) return [];

  // Load existing CanIClone apps for matching
  const existingApps = await prisma.app.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
      category: true,
    },
  });

  const nameMap = new Map<string, typeof existingApps[0]>();
  const domainMap = new Map<string, typeof existingApps[0]>();

  existingApps.forEach((app) => {
    nameMap.set(app.name.toLowerCase().trim(), app);
    if (app.domain) {
      domainMap.set(app.domain.toLowerCase().trim(), app);
    }
  });

  return rawItems.map((item: any, index: number) => {
    let rank = index + 1;
    let name = '';
    let identifier: string | null = null;
    let developer: string | null = null;
    let category: string | null = null;
    let icon: string | null = null;
    let url: string | null = null;

    if (Array.isArray(item)) {
      rank = typeof item[0] === 'number' ? item[0] : index + 1;
      name = typeof item[1] === 'string' ? item[1].trim() : String(item[0]).trim();
    } else if (item && typeof item === 'object') {
      rank = Number(item.rank ?? item.position ?? item.index ?? index + 1);
      name = String(item.name ?? item.title ?? item.app_name ?? '').trim();
      identifier = item.identifier ?? item.id ?? item.bundle_id ?? item.package_name ?? null;
      developer = item.developer ?? item.publisher ?? item.author ?? item.developer_name ?? null;
      category = item.category ?? item.genre ?? item.category_name ?? null;
      icon = item.icon ?? item.icon_url ?? item.logo ?? item.artworkUrl ?? item.artworkUrl512 ?? null;
      url = item.url ?? item.link ?? item.store_url ?? null;
    }

    let matchedApp: typeof existingApps[0] | undefined;

    // 1. Match by verified identifier
    if (identifier && VERIFIED_IDENTIFIERS[identifier]) {
      const slug = VERIFIED_IDENTIFIERS[identifier];
      matchedApp = existingApps.find((a) => a.slug === slug);
    }

    // 2. Match by exact normalized name
    if (!matchedApp && name) {
      const lowerName = name.toLowerCase().trim();
      matchedApp = nameMap.get(lowerName);

      // Clean name for sub-titles: "Claude by Anthropic" -> "claude"
      if (!matchedApp) {
        const cleanName = lowerName.split(/[:\-\–]/)[0]?.trim();
        if (cleanName && cleanName !== lowerName) {
          matchedApp = nameMap.get(cleanName);
        }
      }
    }

    // 3. Match by domain if URL exists
    if (!matchedApp && url) {
      try {
        const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
        if (!hostname.includes('apple.com') && !hostname.includes('google.com')) {
          matchedApp = domainMap.get(hostname);
        }
      } catch {
        // Ignore invalid URL
      }
    }

    let slug: string | null = null;

    if (matchedApp) {
      slug = matchedApp.slug;
      if (!category && matchedApp.category) {
        category = matchedApp.category;
      }
      // If Trends API didn't provide an icon, use CanIClone domain favicon
      if (!icon && matchedApp.domain) {
        icon = `https://www.google.com/s2/favicons?domain=${matchedApp.domain}&sz=64`;
      }
    }

    // Fallback: If external app has known domain
    if (!icon && name) {
      const lower = name.toLowerCase().trim();
      const cleanLower = lower.split(/[:\-\–]/)[0]?.trim();
      const knownDomain = KNOWN_DOMAINS[lower] || KNOWN_DOMAINS[cleanLower];
      if (knownDomain) {
        icon = `https://www.google.com/s2/favicons?domain=${knownDomain}&sz=64`;
      }
    }

    // Fallback: If external app has official URL with domain
    if (!icon && url) {
      try {
        const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
        if (!hostname.includes('apple.com') && !hostname.includes('google.com')) {
          icon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
        }
      } catch {
        // Ignore invalid URL
      }
    }

    return {
      rank,
      name,
      identifier: identifier ? String(identifier) : null,
      developer: developer ? String(developer) : null,
      category: category ? String(category) : null,
      icon: icon ? String(icon) : null,
      url: url ? String(url) : null,
      slug,
    };
  });
}

/**
 * Gets cached top charts or fetches from Trends API.
 */
export async function getTopCharts(type: string, limit = 10) {
  const cacheKey = getChartCacheKey(type);
  const apiType = getTrendsApiType(type);

  const cached = await prisma.marketCache.findUnique({
    where: { key: cacheKey },
  });

  const cacheFound = Boolean(cached && cached.data);
  const itemCount = Array.isArray(cached?.data) ? cached.data.length : 0;

  console.log(`[Market Trends] feed: ${type}, cache key: ${cacheKey}, cache found: ${cacheFound}, items: ${itemCount}`);

  if (cached && isCacheFresh(cached.fetchedAt) && itemCount > 0) {
    return cached.data;
  }

  try {
    const rawResponse = await fetchFromTrendsApi({
      mode: 'get_top_trends',
      type: apiType,
      limit,
    });

    const rawList = Array.isArray(rawResponse)
      ? rawResponse
      : rawResponse?.data ?? rawResponse?.apps ?? rawResponse?.items ?? rawResponse?.results ?? [];

    const normalizedApps = await normalizeAndMatchApps(rawList);

    await prisma.marketCache.upsert({
      where: { key: cacheKey },
      update: { data: normalizedApps as any, fetchedAt: new Date() },
      create: { key: cacheKey, data: normalizedApps as any, fetchedAt: new Date() },
    });

    return normalizedApps;
  } catch (error) {
    if (cached) {
      console.warn(`[Market Trends] API fetch failed for ${type}, returning stale cache`, error);
      return cached.data;
    }
    throw error;
  }
}

/**
 * Gets app growth data.
 */
export async function getAppGrowth(keyword: string) {
  const cacheKey = `trendsapi:growth:${keyword}`;

  const cached = await prisma.marketCache.findUnique({
    where: { key: cacheKey },
  });

  if (cached && isCacheFresh(cached.fetchedAt)) {
    return cached.data;
  }

  try {
    const data = await fetchFromTrendsApi({
      mode: 'get_growth',
      source: 'app downloads',
      keyword,
      window: ['3M', '12M'],
    });

    await prisma.marketCache.upsert({
      where: { key: cacheKey },
      update: { data, fetchedAt: new Date() },
      create: { key: cacheKey, data, fetchedAt: new Date() },
    });

    return data;
  } catch (error) {
    if (cached) {
      return cached.data;
    }
    throw error;
  }
}

/**
 * Gets app time series data.
 */
export async function getAppTimeSeries(keyword: string) {
  const cacheKey = `trendsapi:timeseries:${keyword}`;

  const cached = await prisma.marketCache.findUnique({
    where: { key: cacheKey },
  });

  if (cached && isCacheFresh(cached.fetchedAt)) {
    return cached.data;
  }

  try {
    const data = await fetchFromTrendsApi({
      mode: 'get_time_series',
      source: 'app downloads',
      keyword,
    });

    await prisma.marketCache.upsert({
      where: { key: cacheKey },
      update: { data, fetchedAt: new Date() },
      create: { key: cacheKey, data, fetchedAt: new Date() },
    });

    return data;
  } catch (error) {
    if (cached) {
      return cached.data;
    }
    throw error;
  }
}

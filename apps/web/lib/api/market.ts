import { apiFetch, cachedApiFetch } from './client';
import { ApiMarketTrend, ApiTrendsTopChart, ApiTrendsAppData } from './types';

export interface MarketSummary {
  trending: ApiMarketTrend[];
  overview: ApiMarketTrend[];
  topCharts: ApiTrendsTopChart[];
}

export async function getMarketSummary(): Promise<MarketSummary> {
  return cachedApiFetch<MarketSummary>('/api/market/summary', 60, ['market']);
}

export async function getMarketTrending(): Promise<ApiMarketTrend[]> {
  return cachedApiFetch<ApiMarketTrend[]>('/api/market/trending', 60, ['market']);
}

export async function getMarketOverview(): Promise<ApiMarketTrend[]> {
  return cachedApiFetch<ApiMarketTrend[]>('/api/market/overview', 60, ['market']);
}

export async function getAppMarketData(slug: string): Promise<ApiMarketTrend | null> {
  try {
    return await cachedApiFetch<ApiMarketTrend>(
      `/api/market/apps/${encodeURIComponent(slug)}`,
      60,
      ['market', `market:${slug}`],
    );
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      (error as { status: number }).status === 404
    ) {
      return null;
    }
    throw error;
  }
}

/** The page reads MarketCache; only apps/api/scripts/sync-trends-api.ts refreshes it. */
export async function getTopCharts(): Promise<ApiTrendsTopChart[]> {
  return cachedApiFetch<ApiTrendsTopChart[]>('/api/market/top-charts', 60, ['market']);
}

export async function getTrendsApiData(slug: string): Promise<ApiTrendsAppData | null> {
  try {
    return await apiFetch<ApiTrendsAppData>(
      `/api/market/trends/${encodeURIComponent(slug)}`,
    );
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      (error as { status: number }).status === 404
    ) {
      return null;
    }
    throw error;
  }
}

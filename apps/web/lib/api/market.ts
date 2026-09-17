import { apiFetch } from './client';
import { ApiMarketTrend, ApiTrendsTopChart, ApiTrendsAppData } from './types';

export async function getMarketTrending(): Promise<ApiMarketTrend[]> {
  return apiFetch<ApiMarketTrend[]>('/api/market/trending');
}

export async function getMarketOverview(): Promise<ApiMarketTrend[]> {
  return apiFetch<ApiMarketTrend[]>('/api/market/overview');
}

export async function getAppMarketData(slug: string): Promise<ApiMarketTrend | null> {
  try {
    return await apiFetch<ApiMarketTrend>(`/api/market/apps/${encodeURIComponent(slug)}`);
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getTopCharts(): Promise<ApiTrendsTopChart[]> {
  return apiFetch<ApiTrendsTopChart[]>('/api/market/top-charts');
}

export async function getTrendsApiData(slug: string): Promise<ApiTrendsAppData | null> {
  try {
    return await apiFetch<ApiTrendsAppData>(`/api/market/trends/${encodeURIComponent(slug)}`);
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

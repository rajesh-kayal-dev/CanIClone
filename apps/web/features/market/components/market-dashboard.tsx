'use client';

import { useMemo, useState } from 'react';

import { ApiMarketTrend, ApiTrendsTopChart } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { TopChartList } from './top-chart-list';
import { RisingSearchesCard } from './rising-searches-card';
import { MarketChart } from './market-chart';
import { MarketInsights } from './market-insights';
import {
  MarketFilterBar,
  type MarketFilters,
  type MarketRange,
} from './market-filter-bar';
import { Icons } from '@/components/icons';

interface MarketDashboardProps {
  trending: ApiMarketTrend[];
  overview: ApiMarketTrend[];
  topCharts?: ApiTrendsTopChart[];
}

function regionKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const keys = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const object = item as Record<string, unknown>;
    for (const key of ['region', 'country', 'location', 'name']) {
      const candidate = object[key];
      if (typeof candidate === 'string' && candidate.trim()) {
        keys.add(candidate.trim());
        break;
      }
    }
  }
  return [...keys].slice(0, 30);
}

function filterAndSort(items: ApiMarketTrend[], filters: MarketFilters): ApiMarketTrend[] {
  const filtered = items.filter((item) => {
    if (filters.category !== 'all' && item.app?.category !== filters.category) return false;
    if (filters.region !== 'worldwide') {
      const regions = regionKeys(item.regionalData).map((region) => region.toLowerCase());
      if (!regions.some((region) => region === filters.region.toLowerCase())) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (filters.sort === 'interest') {
      return (b.currentInterest ?? -1) - (a.currentInterest ?? -1);
    }
    if (filters.sort === 'growth') {
      return (b.growthPercent ?? -Infinity) - (a.growthPercent ?? -Infinity);
    }
    const direction = (item: ApiMarketTrend) =>
      item.trendDirection === 'RISING' ? 3 : item.trendDirection === 'STABLE' ? 2 : item.trendDirection === 'FALLING' ? 1 : 0;
    return direction(b) - direction(a) || (b.growthPercent ?? -1) - (a.growthPercent ?? -1);
  });
}

function latestTimestamp(
  trends: ApiMarketTrend[],
  charts: ApiTrendsTopChart[],
): string | undefined {
  const values = [
    ...trends.map((item) => item.fetchedAt),
    ...charts.map((item) => item.fetchedAt ?? null),
  ].filter((value): value is string => Boolean(value));
  if (values.length === 0) return undefined;
  return values.reduce((latest, value) => {
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) && timestamp > new Date(latest).getTime() ? value : latest;
  }, values[0]);
}

export function MarketDashboard({
  trending,
  overview,
  topCharts = [],
}: MarketDashboardProps) {
  const [filters, setFilters] = useState<MarketFilters>({
    range: '30D',
    category: 'all',
    region: 'worldwide',
    sort: 'trending',
  });

  const allTrends = useMemo(() => {
    const byId = new Map<string, ApiMarketTrend>();
    for (const item of [...overview, ...trending]) byId.set(item.id, item);
    return [...byId.values()];
  }, [overview, trending]);

  const categories = useMemo(
    () =>
      [...new Set(allTrends.map((item) => item.app?.category).filter((value): value is string => Boolean(value)))].sort(),
    [allTrends],
  );
  const regions = useMemo(() => {
    const values = new Set<string>();
    for (const item of allTrends) {
      for (const region of regionKeys(item.regionalData)) values.add(region);
    }
    return [...values];
  }, [allTrends]);

  const filteredTrending = useMemo(
    () => filterAndSort(trending, filters),
    [filters, trending],
  );
  const filteredOverview = useMemo(
    () => filterAndSort(overview, filters),
    [filters, overview],
  );

  const topFree = topCharts.find((chart) => chart.chart.toLowerCase().includes('app store') && chart.chart.toLowerCase().includes('top free')) ?? {
    chart: 'App Store Top Free',
    data: [],
    error: 'No cached data available',
  };
  const topPaid = topCharts.find((chart) => chart.chart.toLowerCase().includes('top paid')) ?? {
    chart: 'App Store Top Paid',
    data: [],
    error: 'No cached data available',
  };
  const googlePlay = topCharts.find((chart) => chart.chart.toLowerCase().includes('google play')) ?? {
    chart: 'Google Play Top Free',
    data: [],
    error: 'No cached data available',
  };

  const lastUpdated = latestTimestamp(allTrends, topCharts);
  const hasMarketTrends = allTrends.length > 0;
  const chartTimeframe = filters.range as MarketRange;

  return (
    <div className='flex w-full flex-col gap-6'>
      <MarketFilterBar
        lastUpdated={lastUpdated}
        filters={filters}
        categories={categories}
        regions={regions}
        onFilterChange={setFilters}
      />

      {!hasMarketTrends && (
        <div className='flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-4 text-sm text-muted-foreground'>
          <Icons.info className='size-4 shrink-0' />
          <span>Market trend data is unavailable. Run the manual Trends API sync to populate the cache.</span>
        </div>
      )}

      <section className='grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <TopChartList chartData={topFree} />
        <TopChartList chartData={topPaid} />
        <TopChartList chartData={googlePlay} />
        <RisingSearchesCard trending={filteredTrending} overview={filteredOverview} />
      </section>

      <section className='grid grid-cols-1 items-start gap-5 lg:grid-cols-12'>
        <div className='flex flex-col rounded-xl border border-border/60 bg-card/40 p-4 shadow-xs backdrop-blur-sm lg:col-span-8'>
          <div className='mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3'>
            <div className='flex flex-col'>
              <div className='flex items-center gap-1.5'>
                <h3 className='text-sm font-semibold tracking-tight text-foreground'>
                  Search Interest Over Time
                </h3>
                <span title='Relative search interest index from Google Trends (0-100)'>
                  <Icons.info className='h-3.5 w-3.5 cursor-help text-muted-foreground' />
                </span>
              </div>
              <p className='text-[11px] text-muted-foreground'>
                Cached Google Trends timeline data; timeframe is applied to the stored dates.
              </p>
            </div>
            <span className={cn('font-mono text-[11px] text-muted-foreground')}>
              {filters.range}
            </span>
          </div>

          <MarketChart overview={filteredOverview} timeframe={chartTimeframe} />
        </div>

        <div className='flex flex-col gap-4 lg:col-span-4'>
          <MarketInsights trending={filteredTrending} overview={filteredOverview} />
        </div>
      </section>
    </div>
  );
}

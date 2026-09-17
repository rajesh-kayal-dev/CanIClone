'use client';

import { useState } from 'react';
import { ApiMarketTrend, ApiTrendsTopChart } from '@/lib/api/types';
import { TopChartList } from './top-chart-list';
import { RisingSearchesCard } from './rising-searches-card';
import { MarketChart } from './market-chart';
import { MarketInsights } from './market-insights';
import { MarketFilterBar } from './market-filter-bar';
import { Icons } from '@/components/icons';

interface MarketDashboardProps {
  trending: ApiMarketTrend[];
  overview: ApiMarketTrend[];
  topCharts?: ApiTrendsTopChart[];
}

export function MarketDashboard({
  trending,
  overview,
  topCharts = [],
}: MarketDashboardProps) {
  const [chartTimeframe, setChartTimeframe] = useState<'30D' | '90D' | '12M'>('30D');

  const topFree =
    topCharts.find((c) => c.chart.toLowerCase().includes('top free') && c.chart.toLowerCase().includes('app store')) || {
      chart: 'App Store Top Free',
      data: [],
      error: 'Unavailable',
    };

  const topPaid =
    topCharts.find((c) => c.chart.toLowerCase().includes('top paid')) || {
      chart: 'App Store Top Paid',
      data: [],
      error: 'Unavailable',
    };

  const googlePlay =
    topCharts.find((c) => c.chart.toLowerCase().includes('google play')) || {
      chart: 'Google Play Top Free',
      data: [],
      error: 'Unavailable',
    };

  // Find latest fetched timestamp
  const latestDate =
    trending[0]?.fetchedAt || overview[0]?.fetchedAt || new Date().toISOString();

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Filter Bar */}
      <MarketFilterBar lastUpdated={latestDate} />

      {/* 2. Top Charts Row (4-column grid) */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        <TopChartList chartData={topFree} />
        <TopChartList chartData={topPaid} />
        <TopChartList chartData={googlePlay} />
        <RisingSearchesCard trending={trending} overview={overview} />
      </section>

      {/* 3. Bottom Row: Chart (Left) + Market Insights & CTA (Right) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Search Interest Over Time (~68% width -> col-span-8) */}
        <div className="lg:col-span-8 flex flex-col rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-border/50">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm text-foreground tracking-tight">
                  Search Interest Over Time
                </h3>
                <span title="Relative search interest index from Google Trends (0-100)">
                  <Icons.info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Compare search interest for multiple apps (Google Trends)
              </p>
            </div>

            <div className="relative inline-flex items-center">
              <select
                value={chartTimeframe}
                onChange={(e) => setChartTimeframe(e.target.value as '30D' | '90D' | '12M')}
                className="appearance-none bg-muted/40 hover:bg-muted/60 border border-border/50 rounded-lg px-2.5 py-1 pr-7 text-xs font-medium text-foreground cursor-pointer transition-colors"
              >
                <option value="30D">Last 30 days</option>
                <option value="90D">Last 90 days</option>
                <option value="12M">Last 12 months</option>
              </select>
              <Icons.chevronDown className="w-3 h-3 text-muted-foreground absolute right-2 pointer-events-none" />
            </div>
          </div>

          <MarketChart overview={overview} timeframe={chartTimeframe} />
        </div>

        {/* Right: Market Insights & CTA Banner (~32% width -> col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <MarketInsights trending={trending} overview={overview} />
        </div>
      </section>
    </div>
  );
}

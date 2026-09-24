import type { Metadata } from 'next';

import { getMarketSummary } from '@/lib/api/market';
import { MarketDashboard } from '@/features/market/components/market-dashboard';
import { MarketSourceBadges } from '@/features/market/components/market-source-badges';

export const metadata: Metadata = {
  title: 'Market Analysis',
  description: 'Real-world market signals from app stores and search interest.',
};

export default async function MarketPage() {
  let summary;
  try {
    summary = await getMarketSummary();
  } catch {
    summary = { trending: [], overview: [], topCharts: [] };
  }

  return (
    <div className="layout-container flex flex-col gap-6 py-6">
      <div className="flex flex-col justify-between gap-4 pb-2 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Market Analysis
          </h1>
          <p className="text-xs text-muted-foreground">
            Cached market signals from Google Trends and the Trends API.
          </p>
        </div>
        <MarketSourceBadges />
      </div>

      <MarketDashboard
        trending={summary.trending}
        overview={summary.overview}
        topCharts={summary.topCharts}
      />
    </div>
  );
}

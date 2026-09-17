import type { Metadata } from 'next';
import { getMarketTrending, getMarketOverview, getTopCharts } from '@/lib/api/market';
import { MarketDashboard } from '@/features/market/components/market-dashboard';
import { MarketSourceBadges } from '@/features/market/components/market-source-badges';

export const metadata: Metadata = {
  title: 'Market Analysis | CanIClone',
  description: 'Real-world market signals from app stores and search interest.',
};

export default async function MarketPage() {
  const [trendingResult, overviewResult, topChartsResult] = await Promise.allSettled([
    getMarketTrending(),
    getMarketOverview(),
    getTopCharts(),
  ]);

  const trending = trendingResult.status === 'fulfilled' ? trendingResult.value : [];
  const overview = overviewResult.status === 'fulfilled' ? overviewResult.value : [];
  const topCharts = topChartsResult.status === 'fulfilled' ? topChartsResult.value : [];

  return (
    <div className="layout-container flex flex-col py-6 gap-6">
      {/* Header with Title & Source Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Market Analysis
          </h1>
          <p className="text-xs text-muted-foreground">
            Discover what&apos;s trending. Real-world market signals from multiple sources.
          </p>
        </div>

        <MarketSourceBadges />
      </div>

      <MarketDashboard trending={trending} overview={overview} topCharts={topCharts} />
    </div>
  );
}

'use client';

import { ApiMarketTrend, ApiTrendsAppData } from '@/lib/api/types';
import { MarketSourceLabel } from './market-source-label';

interface MarketSignalProps {
  marketData?: ApiMarketTrend | null;
  trendsApiData?: ApiTrendsAppData | null;
}

export function MarketSignal({ marketData, trendsApiData }: MarketSignalProps) {
  // Generate sparkline path for Google Trends
  let sparklinePath = '';
  let points: number[] = [];

  if (marketData && marketData.timelineData) {
    const timeline =
      (marketData.timelineData as { values?: { query: string; extracted_value: string }[] }[]) || [];
    points = timeline.slice(-12).map((t) => {
      const val = t.values?.find((v) => v.query.toLowerCase() === marketData.query.toLowerCase());
      return val ? parseInt(val.extracted_value, 10) : 0;
    });

    const max = Math.max(...points, 100);
    const min = 0;
    const width = 100;
    const height = 24;

    sparklinePath =
      points.length > 1
        ? points
            .map((p: number, i: number) => {
              const x = (i / (points.length - 1)) * width;
              const y = height - ((p - min) / (max - min)) * height;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ')
        : '';
  }

  // Parse Trends API Data
  const growth = trendsApiData?.growth as Record<string, number> | undefined;
  const timeSeries = trendsApiData?.timeSeries as Array<{ value: number }> | undefined;
  const growth3M = growth?.['3M'];
  const growth12M = growth?.['12M'];
  const isRising = typeof growth3M === 'number' && growth3M > 0;
  const isFalling = typeof growth3M === 'number' && growth3M < 0;

  return (
    <div className="flex flex-col gap-4 mt-8">
      <h3 className="text-sm font-bold font-mono tracking-tight uppercase text-muted-foreground">
        App Market Signals
      </h3>

      {trendsApiData && (
        <div className="border border-border p-4 bg-card/30 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <MarketSourceLabel source="trends-api" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Estimated Android Downloads
              </div>
              <div className="text-xl font-bold font-mono">
                {timeSeries?.[0]?.value
                  ? (timeSeries[0].value / 1000).toFixed(1) + 'K'
                  : 'N/A'}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                3M Download Growth
              </div>
              <div
                className={`text-xl font-bold font-mono ${
                  isRising ? 'text-emerald-500' : isFalling ? 'text-red-500' : ''
                }`}
              >
                {typeof growth3M === 'number'
                  ? `${growth3M > 0 ? '+' : ''}${growth3M}%`
                  : 'N/A'}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                12M Download Growth
              </div>
              <div className="text-xl font-bold font-mono">
                {typeof growth12M === 'number'
                  ? `${growth12M > 0 ? '+' : ''}${growth12M}%`
                  : 'N/A'}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Identifier
              </div>
              <div className="text-sm font-mono truncate" title={trendsApiData.identifier}>
                {trendsApiData.identifier}
              </div>
            </div>
          </div>
        </div>
      )}

      {marketData && (
        <div className="border border-border p-4 bg-card rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <MarketSourceLabel source="google-trends" />
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Search Interest (0-100)
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold font-mono">{marketData.currentInterest}</span>
                {points.length > 1 && (
                  <svg width={100} height={24} className="overflow-visible opacity-70">
                    <path
                      d={sparklinePath}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={
                        marketData.trendDirection === 'RISING'
                          ? 'text-emerald-500'
                          : marketData.trendDirection === 'FALLING'
                          ? 'text-red-500'
                          : 'text-muted-foreground'
                      }
                    />
                  </svg>
                )}
              </div>
            </div>

            <div className="flex gap-8">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                  Trend
                </div>
                <div
                  className={`font-mono text-sm ${
                    marketData.trendDirection === 'RISING'
                      ? 'text-emerald-500'
                      : marketData.trendDirection === 'FALLING'
                      ? 'text-red-500'
                      : ''
                  }`}
                >
                  {marketData.trendDirection === 'RISING' && '↑ '}
                  {marketData.trendDirection === 'FALLING' && '↓ '}
                  {marketData.trendDirection === 'STABLE' && '→ '}
                  {marketData.trendDirection}
                  {marketData.growthPercent !== null &&
                    ` (${marketData.growthPercent > 0 ? '+' : ''}${marketData.growthPercent}%)`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                  Last Updated
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {new Date(marketData.fetchedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

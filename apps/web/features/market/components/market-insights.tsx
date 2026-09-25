'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { ApiMarketTrend } from '@/lib/api/types';
import { Icons } from '@/components/icons';

interface MarketInsightsProps {
  trending: ApiMarketTrend[];
  overview: ApiMarketTrend[];
}

export function MarketInsights({ trending, overview }: MarketInsightsProps) {
  const insights = useMemo(() => {
    const all = [...trending, ...overview].filter((item) => item.app?.name || item.query);
    if (all.length === 0) return [];

    const topGainer = [...all]
      .filter((item) => typeof item.growthPercent === 'number')
      .sort((a, b) => (b.growthPercent ?? -Infinity) - (a.growthPercent ?? -Infinity))[0];
    const topInterest = [...all].sort(
      (a, b) => (b.currentInterest ?? -Infinity) - (a.currentInterest ?? -Infinity),
    )[0];
    const rising = all
      .filter((item) => item.trendDirection === 'RISING')
      .sort((a, b) => (b.growthPercent ?? -Infinity) - (a.growthPercent ?? -Infinity))[0];

    const result: Array<{ icon: string; text: string }> = [];
    if (topGainer) {
      const name = topGainer.app?.name || topGainer.query;
      const value = topGainer.growthPercent;
      result.push({
        icon: '📈',
        text: `${name} has the largest cached growth reading (${value! >= 0 ? '+' : ''}${value}%).`,
      });
    }
    if (topInterest) {
      const name = topInterest.app?.name || topInterest.query;
      result.push({
        icon: '📊',
        text: `${name} has the highest current search-interest index (${topInterest.currentInterest ?? 'n/a'}).`,
      });
    }
    if (rising) {
      const name = rising.app?.name || rising.query;
      result.push({
        icon: '✨',
        text: `${name} is currently marked as rising in the cached market data.`,
      });
    }
    return result;
  }, [trending, overview]);

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-3.5 rounded-xl border border-border/60 bg-card/40 p-4 shadow-xs backdrop-blur-sm'>
        <div className='flex items-center gap-2'>
          <span className='text-base'>💡</span>
          <h3 className='text-sm font-semibold tracking-tight text-foreground'>Market Insights</h3>
        </div>
        {insights.length === 0 ? (
          <p className='text-xs leading-relaxed text-muted-foreground'>
            No market insights are available until trend data has been synced.
          </p>
        ) : (
          <div className='flex flex-col gap-3'>
            {insights.map((item, index) => (
              <div key={`${item.text}-${index}`} className='flex items-start gap-2.5'>
                <span className='mt-0.5 shrink-0 text-sm'>{item.icon}</span>
                <p className='text-xs leading-relaxed text-muted-foreground'>{item.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='group relative flex items-center justify-between gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-4 text-white shadow-lg'>
        <div className='z-10 flex flex-col gap-1'>
          <h4 className='text-sm font-bold tracking-tight'>Build what&apos;s next.</h4>
          <p className='text-[11px] leading-snug text-blue-100/90'>
            Explore the directory and compare the evidence behind each app.
          </p>
        </div>
        <Link
          href='/apps'
          className='z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 transition-all hover:bg-white/30 group-hover:scale-105'
          aria-label='Explore Apps'
        >
          <Icons.arrowRight className='size-4' />
        </Link>
      </div>
    </div>
  );
}

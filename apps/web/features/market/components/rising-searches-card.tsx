'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { ApiMarketTrend } from '@/lib/api/types';
import { Icons } from '@/components/icons';

interface RisingSearchesCardProps {
  trending: ApiMarketTrend[];
  overview: ApiMarketTrend[];
}

interface RisingItem {
  query: string;
  trendText: string;
  isPositive: boolean;
  link: string;
}

function numericValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[+%]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function RisingSearchesCard({ trending, overview }: RisingSearchesCardProps) {
  const risingList = useMemo<RisingItem[]>(() => {
    const items: RisingItem[] = [];
    const seenQueries = new Set<string>();

    for (const trend of [...overview, ...trending]) {
      const related = Array.isArray(trend.relatedQueries)
        ? (trend.relatedQueries as Array<Record<string, unknown>>)
        : [];
      for (const relatedQuery of related) {
        const query = typeof relatedQuery.query === 'string' ? relatedQuery.query.trim() : '';
        const key = query.toLowerCase();
        if (!query || seenQueries.has(key)) continue;
        seenQueries.add(key);
        const value = numericValue(relatedQuery.extracted_value ?? relatedQuery.value);
        items.push({
          query,
          trendText: value === null ? 'related query' : `${value >= 0 ? '+' : ''}${value}%`,
          isPositive: value === null || value >= 0,
          link: `/apps?q=${encodeURIComponent(query)}`,
        });
      }
    }

    for (const trend of trending) {
      const name = trend.app?.name || trend.query;
      const key = name.toLowerCase();
      if (!name || seenQueries.has(key)) continue;
      seenQueries.add(key);
      const value = trend.growthPercent;
      items.push({
        query: name,
        trendText: value === null ? trend.trendDirection?.toLowerCase() ?? 'signal' : `${value >= 0 ? '+' : ''}${value}%`,
        isPositive:
          value === null
            ? trend.trendDirection === 'RISING' || trend.trendDirection === 'STABLE'
            : value >= 0,
        link: trend.app?.slug
          ? `/apps/${encodeURIComponent(trend.app.slug)}`
          : `/apps?q=${encodeURIComponent(name)}`,
      });
    }

    return items.slice(0, 10);
  }, [trending, overview]);

  return (
    <div className='flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-xs backdrop-blur-sm transition-all hover:border-border/80'>
      <div className='flex items-center justify-between border-b border-border/50 bg-muted/20 px-4 py-3'>
        <div className='flex min-w-0 items-center gap-2.5'>
          <div className='flex size-6 shrink-0 items-center justify-center rounded-md border border-blue-500/30 bg-blue-500/20 text-blue-500'>
            <Icons.trendingUp className='size-3.5' />
          </div>
          <h3 className='truncate text-sm font-semibold tracking-tight text-foreground'>
            Rising Searches
          </h3>
        </div>
        <Link
          href='/apps'
          className='inline-flex shrink-0 items-center gap-1 text-xs font-medium text-blue-500 transition-colors hover:text-blue-400'
        >
          <span>View all</span>
          <Icons.arrowRight className='size-3' />
        </Link>
      </div>

      <div className='grid grid-cols-12 border-b border-border/40 bg-muted/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80'>
        <div className='col-span-2 text-center font-mono'>#</div>
        <div className='col-span-6'>Query</div>
        <div className='col-span-4 text-right'>Signal</div>
      </div>

      <div className='flex flex-col divide-y divide-border/40'>
        {risingList.length === 0 ? (
          <div className='p-6 text-center text-xs text-muted-foreground'>
            No rising search queries are recorded in the cache.
          </div>
        ) : (
          risingList.map((item, index) => (
            <Link
              key={`${item.query}-${index}`}
              href={item.link}
              prefetch={false}
              className='group grid grid-cols-12 items-center px-3 py-2.5 transition-colors hover:bg-muted/40'
            >
              <div className='col-span-2 text-center font-mono text-xs font-bold text-muted-foreground/70 group-hover:text-foreground'>
                {index + 1}
              </div>
              <div className='col-span-6 truncate pr-2'>
                <span className='text-xs font-medium text-foreground transition-colors group-hover:text-primary'>
                  {item.query}
                </span>
              </div>
              <div className='col-span-4 flex items-center justify-end gap-1 text-right'>
                <span
                  className={`font-mono text-[11px] font-semibold ${item.isPositive ? 'text-emerald-500' : 'text-red-500'}`}
                >
                  {item.isPositive ? '↑' : '↓'} {item.trendText}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

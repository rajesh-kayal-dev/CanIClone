'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

export type MarketRange = '7D' | '30D' | '90D' | '12M';
export type MarketSort = 'trending' | 'interest' | 'growth';

export interface MarketFilters {
  range: MarketRange;
  category: string;
  region: string;
  sort: MarketSort;
}

interface MarketFilterBarProps {
  lastUpdated?: string | null;
  filters?: MarketFilters;
  categories?: string[];
  regions?: string[];
  onFilterChange?: (filters: MarketFilters) => void;
}

const DEFAULT_FILTERS: MarketFilters = {
  range: '30D',
  category: 'all',
  region: 'worldwide',
  sort: 'trending',
};

export function MarketFilterBar({
  lastUpdated,
  filters,
  categories = [],
  regions = [],
  onFilterChange,
}: MarketFilterBarProps) {
  const router = useRouter();
  const [internalFilters, setInternalFilters] = useState<MarketFilters>(DEFAULT_FILTERS);
  const [isPending, startTransition] = useTransition();
  const current = filters ?? internalFilters;

  function update(patch: Partial<MarketFilters>) {
    const next = { ...current, ...patch };
    if (!filters) setInternalFilters(next);
    onFilterChange?.(next);
  }

  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const hasRegions = regions.length > 0;

  return (
    <div className='flex flex-wrap items-center justify-between gap-4 py-1'>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='flex items-center gap-1 rounded-lg border border-border/50 bg-muted/40 p-1 text-xs'>
          {(['7D', '30D', '90D', '12M'] as const).map((range) => (
            <button
              key={range}
              type='button'
              onClick={() => update({ range })}
              className={cn(
                'rounded-md px-3 py-1 font-medium transition-colors',
                current.range === range
                  ? 'bg-blue-600 font-semibold text-white shadow-xs'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              {range}
            </button>
          ))}
        </div>

        <div className='relative inline-flex items-center'>
          <select
            value={current.category}
            onChange={(event) => update({ category: event.target.value })}
            aria-label='Filter by category'
            className='appearance-none rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 pr-8 text-xs font-medium text-foreground transition-colors hover:bg-muted/40 focus:outline-hidden focus:ring-1 focus:ring-primary'
          >
            <option value='all'>All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.replace(/-/g, ' ')}
              </option>
            ))}
          </select>
          <Icons.chevronDown className='pointer-events-none absolute right-2.5 w-3.5 h-3.5 text-muted-foreground' />
        </div>

        <div className='relative inline-flex items-center'>
          <select
            value={hasRegions ? current.region : 'unavailable'}
            onChange={(event) => update({ region: event.target.value })}
            disabled={!hasRegions}
            aria-label='Filter by region'
            className='appearance-none rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 pr-8 text-xs font-medium text-foreground transition-colors hover:bg-muted/40 focus:outline-hidden focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50'
          >
            {hasRegions ? (
              <>
                <option value='worldwide'>Worldwide</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </>
            ) : (
              <option value='unavailable'>Region data unavailable</option>
            )}
          </select>
          <Icons.chevronDown className='pointer-events-none absolute right-2.5 w-3.5 h-3.5 text-muted-foreground' />
        </div>

        <div className='relative inline-flex items-center'>
          <select
            value={current.sort}
            onChange={(event) => update({ sort: event.target.value as MarketSort })}
            aria-label='Sort market data'
            className='appearance-none rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 pr-8 text-xs font-medium text-foreground transition-colors hover:bg-muted/40 focus:outline-hidden focus:ring-1 focus:ring-primary'
          >
            <option value='trending'>Sort: Trending</option>
            <option value='interest'>Sort: Search Interest</option>
            <option value='growth'>Sort: Growth %</option>
          </select>
          <Icons.chevronDown className='pointer-events-none absolute right-2.5 w-3.5 h-3.5 text-muted-foreground' />
        </div>
      </div>

      <div className='flex items-center gap-3 text-xs text-muted-foreground'>
        <div className='flex flex-col text-right'>
          <span className='text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70'>
            Last updated
          </span>
          <span className='font-mono text-[11px] font-medium text-foreground/80'>
            {formattedDate ?? 'Unavailable'}
          </span>
        </div>
        <button
          type='button'
          onClick={() => startTransition(() => router.refresh())}
          disabled={isPending}
          className='inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 font-medium text-xs text-foreground transition-all hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50'
        >
          <Icons.spinner className={cn('w-3.5 h-3.5', isPending && 'animate-spin')} />
          <span>{isPending ? 'Refreshing' : 'Refresh'}</span>
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';

interface MarketFilterBarProps {
  lastUpdated?: string | Date;
  onFilterChange?: (filters: { range: string; category: string; region: string; sort: string }) => void;
}

export function MarketFilterBar({ lastUpdated, onFilterChange }: MarketFilterBarProps) {
  const router = useRouter();
  const [range, setRange] = useState<'7D' | '30D' | '90D' | '12M'>('30D');
  const [category, setCategory] = useState('all');
  const [region, setRegion] = useState('worldwide');
  const [sort, setSort] = useState('trending');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRangeChange = (newRange: '7D' | '30D' | '90D' | '12M') => {
    setRange(newRange);
    onFilterChange?.({ range: newRange, category, region, sort });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-1">
      {/* Left Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Time Period Tabs */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/50 text-xs">
          {(['7D', '30D', '90D', '12M'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRangeChange(r)}
              className={cn(
                'px-3 py-1 rounded-md font-medium transition-all cursor-pointer',
                range === r
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Category Dropdown */}
        <div className="relative inline-flex items-center">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              onFilterChange?.({ range, category: e.target.value, region, sort });
            }}
            className="appearance-none bg-card/60 hover:bg-muted/40 border border-border/60 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-foreground cursor-pointer transition-colors focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            <option value="all">📁 All categories</option>
            <option value="productivity">⚡ Productivity</option>
            <option value="developer-tools">💻 Developer Tools</option>
            <option value="ai-machine-learning">🤖 AI & Machine Learning</option>
            <option value="design">🎨 Design</option>
          </select>
          <Icons.chevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 pointer-events-none" />
        </div>

        {/* Region Dropdown */}
        <div className="relative inline-flex items-center">
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              onFilterChange?.({ range, category, region: e.target.value, sort });
            }}
            className="appearance-none bg-card/60 hover:bg-muted/40 border border-border/60 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-foreground cursor-pointer transition-colors focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            <option value="worldwide">🌐 Worldwide</option>
            <option value="us">🇺🇸 United States</option>
            <option value="eu">🇪🇺 Europe</option>
            <option value="asia">🌏 Asia</option>
          </select>
          <Icons.chevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 pointer-events-none" />
        </div>

        {/* Sort Dropdown */}
        <div className="relative inline-flex items-center">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              onFilterChange?.({ range, category, region, sort: e.target.value });
            }}
            className="appearance-none bg-card/60 hover:bg-muted/40 border border-border/60 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-foreground cursor-pointer transition-colors focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            <option value="trending">Sort by: Trending</option>
            <option value="interest">Sort by: Search Interest</option>
            <option value="growth">Sort by: Growth %</option>
          </select>
          <Icons.chevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Right Controls: Timestamp + Refresh */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex flex-col text-right">
          <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground/70">
            Last updated
          </span>
          <span className="font-mono text-[11px] font-medium text-foreground/80">
            {formattedDate}
          </span>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-card/60 hover:bg-muted/40 font-medium text-xs text-foreground transition-all cursor-pointer disabled:opacity-50"
        >
          <Icons.spinner className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}

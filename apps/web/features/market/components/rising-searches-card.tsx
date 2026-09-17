'use client';

import { useMemo } from 'react';
import { ApiMarketTrend } from '@/lib/api/types';
import { Icons } from '@/components/icons';
import Link from 'next/link';

interface RisingSearchesCardProps {
  trending: ApiMarketTrend[];
  overview: ApiMarketTrend[];
}

interface RisingItem {
  query: string;
  trendText: string;
  isPositive: boolean;
  link?: string;
}

export function RisingSearchesCard({ trending, overview }: RisingSearchesCardProps) {
  // Aggregate real rising queries from Google Trends relatedQueries & trending apps
  const risingList = useMemo<RisingItem[]>(() => {
    const items: RisingItem[] = [];

    // 1. Check all relatedQueries across overview & trending
    const allTrends = [...overview, ...trending];
    const seenQueries = new Set<string>();

    allTrends.forEach((t) => {
      const related = (t.relatedQueries as Array<{ query: string; value?: string; extracted_value?: number }>) || [];
      related.forEach((rq) => {
        const q = rq.query?.trim();
        if (q && !seenQueries.has(q.toLowerCase())) {
          seenQueries.add(q.toLowerCase());
          const val = rq.value || (rq.extracted_value ? `+${rq.extracted_value}%` : 'RISING');
          items.push({
            query: q,
            trendText: val.startsWith('+') ? val : `+${val}`,
            isPositive: true,
            link: `/apps?search=${encodeURIComponent(q)}`,
          });
        }
      });
    });

    // 2. If fewer than 10, fill with top rising apps from Google Trends
    if (items.length < 10) {
      trending.forEach((t) => {
        const name = t.app?.name || t.query;
        if (name && !seenQueries.has(name.toLowerCase())) {
          seenQueries.add(name.toLowerCase());
          const growth = t.growthPercent !== null ? `+${t.growthPercent}%` : 'RISING';
          items.push({
            query: name,
            trendText: growth,
            isPositive: t.trendDirection === 'RISING',
            link: t.app?.slug ? `/apps/${t.app.slug}` : `/apps?search=${encodeURIComponent(name)}`,
          });
        }
      });
    }

    return items.slice(0, 10);
  }, [trending, overview]);

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden shadow-xs transition-all hover:border-border/80">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/30">
            <Icons.trendingUp className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-semibold text-sm text-foreground truncate tracking-tight">
            Rising Searches
          </h3>
        </div>

        <Link
          href="/apps"
          className="text-xs font-medium text-blue-500 hover:text-blue-400 inline-flex items-center gap-1 transition-colors shrink-0"
        >
          <span>View all</span>
          <Icons.arrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 border-b border-border/40 bg-muted/10">
        <div className="col-span-2 text-center font-mono">#</div>
        <div className="col-span-6">Query</div>
        <div className="col-span-4 text-right">Trend</div>
      </div>

      {/* List */}
      <div className="flex flex-col divide-y divide-border/40">
        {risingList.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No rising search queries recorded yet.
          </div>
        ) : (
          risingList.map((item, index) => (
            <Link
              key={item.query || index}
              href={item.link || '/apps'}
              className="grid grid-cols-12 items-center px-3 py-2.5 transition-colors hover:bg-muted/40 group"
            >
              <div className="col-span-2 text-center font-mono text-xs font-bold text-muted-foreground/70 group-hover:text-foreground">
                {index + 1}
              </div>

              <div className="col-span-6 truncate pr-2">
                <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                  {item.query}
                </span>
              </div>

              <div className="col-span-4 text-right flex items-center justify-end gap-1">
                <span className="text-[11px] font-mono font-semibold text-emerald-500 flex items-center gap-0.5">
                  <span className="text-emerald-500 text-xs">↑</span>
                  {item.trendText}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

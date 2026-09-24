'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ApiTrendsTopChart } from '@/lib/api/types';
import Link from 'next/link';
import { Icons } from '@/components/icons';

interface TopChartListProps {
  chartData: ApiTrendsTopChart;
  className?: string;
}

export interface AppRankData {
  rank?: number;
  icon?: string | null;
  name: string;
  developer?: string | null;
  category?: string | null;
  identifier?: string | null;
  url?: string | null;
  slug?: string | null;
}

export function TopChartList({ chartData, className }: TopChartListProps) {
  const { chart, data, error } = chartData;

  const isAppStore = chart.toLowerCase().includes('app store');
  const isGooglePlay = chart.toLowerCase().includes('google play');

  // Coerce array from response
  const rawList = Array.isArray(data)
    ? data
    : (data as { apps?: AppRankData[]; data?: AppRankData[]; items?: AppRankData[] })?.apps ||
      (data as { data?: AppRankData[] })?.data ||
      (data as { items?: AppRankData[] })?.items ||
      [];

  const apps: AppRankData[] = rawList.slice(0, 5);

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden shadow-xs transition-all hover:border-border/80',
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-white shadow-xs',
              isAppStore
                ? 'bg-blue-600'
                : isGooglePlay
                ? 'bg-emerald-600'
                : 'bg-primary'
            )}
          >
            {isAppStore ? (
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.64-.78 1.08-1.86.96-2.95-1 .04-2.16.67-2.83 1.45-.58.68-1.1 1.77-.96 2.83 1.12.09 2.19-.55 2.83-1.33z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a2.22 2.22 0 0 1-.61-1.594V3.408c0-.62.23-1.192.61-1.594zm11.303 11.306l2.368 2.368-11.758 6.784 9.39-9.152zm0-2.24L5.522 1.726l11.758 6.784-2.368 2.37zm1.742 1.12l3.812 2.201a1.272 1.272 0 0 1 0 2.202l-3.812 2.201-2.488-2.488 2.488-2.488z" />
              </svg>
            )}
          </div>
          <h3 className="font-semibold text-sm text-foreground truncate tracking-tight">
            {chart}
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
        <div className="col-span-1 text-center font-mono">#</div>
        <div className="col-span-7">App</div>
        <div className="col-span-4 text-right">Category</div>
      </div>

      {/* Table Content */}
      <div className="flex flex-col divide-y divide-border/40">
        {error ? (
          <div className="p-6 text-center flex flex-col items-center justify-center text-muted-foreground">
            <span className="text-xs font-medium">App-store data unavailable</span>
            <span className="text-[10px] text-muted-foreground/70 mt-0.5">
              Sync required via Trends API
            </span>
          </div>
        ) : apps.length === 0 ? (
          <div className="p-6 text-center flex flex-col items-center justify-center text-muted-foreground">
            <span className="text-xs font-medium">No ranking data cached</span>
            <span className="text-[10px] text-muted-foreground/70 mt-0.5">
              Run manual sync to populate charts
            </span>
          </div>
        ) : (
          apps.map((app, index) => (
            <AppRowItem key={app.identifier || app.name || index} app={app} index={index} />
          ))
        )}
      </div>
    </div>
  );
}

function AppRowItem({ app, index }: { app: AppRankData; index: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const rank = app.rank || index + 1;
  const appUrl = app.slug ? `/apps/${app.slug}` : `/apps?q=${encodeURIComponent(app.name)}`;
  const initials = app.name ? app.name.substring(0, 2).toUpperCase() : '??';

  return (
    <Link
      href={appUrl}
      prefetch={false}
      className="grid grid-cols-12 items-center px-3 py-2.5 transition-colors hover:bg-muted/40 group"
    >
      <div className="col-span-1 text-center font-mono text-xs font-bold text-muted-foreground/70 group-hover:text-foreground">
        {rank}
      </div>

      <div className="col-span-7 flex items-center gap-2.5 min-w-0 pr-2">
        {app.icon && !imgFailed ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={app.icon}
            alt={app.name}
            onError={() => setImgFailed(true)}
            className="w-8 h-8 rounded-lg object-cover shrink-0 border border-border/50 shadow-2xs"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/40 text-[11px] font-bold text-muted-foreground uppercase">
            {initials}
          </div>
        )}

        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {app.name}
          </span>
          {app.developer && (
            <span className="text-[10px] text-muted-foreground truncate">
              {app.developer}
            </span>
          )}
        </div>
      </div>

      <div className="col-span-4 text-right">
        <span className="text-[11px] text-muted-foreground font-medium truncate block">
          {app.category ? app.category.replace(/-/g, ' ') : '—'}
        </span>
      </div>
    </Link>
  );
}

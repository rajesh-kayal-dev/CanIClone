'use client';

import React from 'react';
import Link from 'next/link';

import { AppListRow } from '@/components/ui/app-list-row';
import { AppListRowSkeleton } from '@/components/ui/app-list-skeleton';
import type { AppRecord } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface AppListTableProps {
  apps: AppRecord[];
  loading?: boolean;
  skeletonCount?: number;
  className?: string;
  emptyMessage?: string;
}

export function AppListTable({
  apps,
  loading = false,
  skeletonCount = 10,
  className,
  emptyMessage = 'No apps found matching these filters.',
}: AppListTableProps) {
  return (
    <div className={cn('flex w-full flex-col', className)} aria-busy={loading}>
      <div className='mt-2 flex items-center justify-between border-b border-border px-2 pb-2 font-mono text-[10px] uppercase text-muted-foreground'>
        <div className='flex min-w-0 flex-1 items-center gap-4'>
          <span className='w-6 text-right'>#</span>
          <span className='ml-1 flex-1'>APP</span>
        </div>
        <div className='hidden flex-1 items-center gap-4 sm:flex sm:justify-between'>
          <span className='min-w-[140px]'>CATEGORY</span>
          <span className='w-20'>PRICE</span>
          <span className='w-24'>VERDICT</span>
          <span className='w-12 text-right'>REPLACED</span>
        </div>
      </div>

      <div className='hide-scrollbar -mx-4 flex flex-col overflow-x-auto px-4 sm:mx-0 sm:px-0'>
        <div className='flex min-w-[600px] flex-col sm:min-w-0'>
          {loading ? (
            Array.from({ length: skeletonCount }).map((_, index) => (
              <AppListRowSkeleton key={index} />
            ))
          ) : (
            <>
              {apps.map((app, index) => (
                <Link
                  key={app.slug}
                  href={`/apps/${encodeURIComponent(app.slug)}`}
                  prefetch={false}
                  className='block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'
                >
                  <AppListRow app={app} rank={index + 1} />
                </Link>
              ))}
              {apps.length === 0 && (
                <div className='border-b border-border py-12 text-center font-mono text-sm text-muted-foreground'>
                  {emptyMessage}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

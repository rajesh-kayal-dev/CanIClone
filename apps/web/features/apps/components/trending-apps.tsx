'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Icons } from '@/components/icons';
import { SearchBar } from '@/features/search/components/search-bar';
import {
  APPS_PAGE_LIMIT,
  getAppsPage,
  type AppsPagination,
} from '@/lib/api/apps';
import type { AppRecord } from '@/lib/api/types';
import { AppListTable } from './app-list-table';

interface TrendingAppsProps {
  initialApps: AppRecord[];
  initialPagination: AppsPagination;
}

export function TrendingApps({ initialApps, initialPagination }: TrendingAppsProps) {
  const [apps, setApps] = useState(initialApps);
  const [pagination, setPagination] = useState(initialPagination);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(initialPagination.page);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !pagination.hasMore) return;
    setLoadingMore(true);
    setError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await getAppsPage(
        {
          page: pageRef.current + 1,
          limit: APPS_PAGE_LIMIT,
          sort: 'trending',
        },
        { signal: controller.signal },
      );
      pageRef.current = result.pagination.page;
      setPagination(result.pagination);
      setApps((current) => {
        const seen = new Set(current.map((app) => app.slug));
        return [
          ...current,
          ...result.items.filter((app) => !seen.has(app.slug)),
        ];
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      setError(cause instanceof Error ? cause.message : 'Could not load more apps');
    } finally {
      if (!controller.signal.aborted) setLoadingMore(false);
    }
  }, [loadingMore, pagination.hasMore]);

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <SearchBar
          size='md'
          placeholder='search trending apps...'
          className='w-full sm:max-w-xs'
        />
        <span className='font-mono text-[11px] text-muted-foreground'>
          {pagination.total} apps
        </span>
      </div>

      <AppListTable apps={apps} />

      {error && (
        <p className='text-center font-mono text-[11px] text-red-600'>{error}</p>
      )}

      {pagination.hasMore && (
        <div className='flex justify-center'>
          <button
            type='button'
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className='inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60'
          >
            {loadingMore ? (
              <>
                <Icons.spinner className='size-3 animate-spin' />
                loading…
              </>
            ) : (
              <>
                see more
                <Icons.chevronDown className='size-3 opacity-60' />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

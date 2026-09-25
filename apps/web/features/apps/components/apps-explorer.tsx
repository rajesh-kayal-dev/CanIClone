'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Icons } from '@/components/icons';
import type { AppRecord } from '@/lib/api/types';
import type { CategoryWithCount } from '@/lib/api/categories';
import {
  APPS_PAGE_LIMIT,
  getAppsPage,
  getCloneListPage,
  type AppsPagination,
} from '@/lib/api/apps';
import { cn } from '@/lib/utils';
import {
  APP_SORT_OPTIONS,
  AppListControls,
  CLONE_LIST_SORT_OPTIONS,
  type SortOption,
  type SortOptionDefinition,
  type VerdictFilter,
} from './app-list-controls';
import { AppListTable } from './app-list-table';

interface AppsExplorerProps {
  initialApps: AppRecord[];
  initialPagination: AppsPagination;
  categories: CategoryWithCount[];
  routeMode: 'apps' | 'category' | 'clone-list';
  fixedCategory?: string;
  defaultSort?: SortOption;
  sortOptions?: SortOptionDefinition[];
}

function isVerdict(value: string | null): value is VerdictFilter {
  return value === 'all' || value === 'YES' || value === 'KINDA' || value === 'NO';
}

function isSort(value: string | null, options: SortOptionDefinition[]): value is SortOption {
  return Boolean(value && options.some((option) => option.id === value));
}

export function AppsExplorer({
  initialApps,
  initialPagination,
  categories,
  routeMode,
  fixedCategory,
  defaultSort = 'trending',
  sortOptions = routeMode === 'clone-list' ? CLONE_LIST_SORT_OPTIONS : APP_SORT_OPTIONS,
}: AppsExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedCategory =
    routeMode === 'category' ? fixedCategory ?? 'all' : searchParams.get('category') || 'all';
  const rawVerdict = searchParams.get('verdict')?.toUpperCase() ?? 'all';
  const verdictFilter: VerdictFilter = isVerdict(rawVerdict) ? rawVerdict : 'all';
  const rawSort = searchParams.get('sort');
  const sortBy: SortOption = isSort(rawSort, sortOptions) ? rawSort : defaultSort;
  const searchQuery = searchParams.get('q') ?? '';

  const [apps, setApps] = useState(initialApps);
  const [pagination, setPagination] = useState(initialPagination);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(initialPagination.page);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    return params;
  }, [searchParams]);

  const pushQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(queryString.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '' || value === 'all') params.delete(key);
        else params.set(key, value);
      }
      const nextQuery = params.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (nextUrl !== currentUrl) router.push(nextUrl, { scroll: false });
    },
    [pathname, queryString, router],
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      if (routeMode === 'category') {
        const params = new URLSearchParams(queryString.toString());
        params.delete('category');
        const suffix = params.toString();
        const nextUrl =
          value === 'all'
            ? '/apps'
            : `/categories/${encodeURIComponent(value)}`;
        router.push(suffix ? `${nextUrl}?${suffix}` : nextUrl, { scroll: false });
      } else {
        pushQuery({ category: value });
      }
    },
    [queryString, router, routeMode, pushQuery],
  );

  const handleVerdictChange = useCallback(
    (value: VerdictFilter) => pushQuery({ verdict: value }),
    [pushQuery],
  );
  const handleSortChange = useCallback(
    (value: SortOption) => pushQuery({ sort: value }),
    [pushQuery],
  );
  const handleSearchSubmit = useCallback(
    (value: string) => pushQuery({ q: value }),
    [pushQuery],
  );

  const handleSeeMore = useCallback(async () => {
    if (loadingMore || !pagination.hasMore) return;
    setLoadingMore(true);
    setError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const params = {
        page: pageRef.current + 1,
        limit: APPS_PAGE_LIMIT,
        category: routeMode === 'category' ? (fixedCategory ?? 'all') : selectedCategory,
        verdict: verdictFilter,
        sort: sortBy,
        q: searchQuery,
      };
      const result =
        routeMode === 'clone-list'
          ? await getCloneListPage(params, { signal: controller.signal })
          : await getAppsPage(params, { signal: controller.signal });
      pageRef.current = result.pagination.page;
      setPagination(result.pagination);
      setApps((previous) => {
        const seen = new Set(previous.map((app) => app.slug));
        return [
          ...previous,
          ...result.items.filter((app) => !seen.has(app.slug)),
        ];
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      setError(cause instanceof Error ? cause.message : 'Could not load more apps');
    } finally {
      if (!controller.signal.aborted) setLoadingMore(false);
    }
  }, [
    fixedCategory,
    loadingMore,
    pagination.hasMore,
    routeMode,
    searchQuery,
    selectedCategory,
    sortBy,
    verdictFilter,
  ]);

  const showAllLoaded = !pagination.hasMore && apps.length > 0;

  return (
    <div className='flex w-full flex-col'>
      <AppListControls
        categories={categories}
        selectedCategory={selectedCategory}
        verdictFilter={verdictFilter}
        sortBy={sortBy}
        onCategoryChange={handleCategoryChange}
        onVerdictChange={handleVerdictChange}
        onSortChange={handleSortChange}
        searchQuery={searchQuery}
        onSearchSubmit={handleSearchSubmit}
        sortOptions={sortOptions}
      />

      <AppListTable apps={apps} />

      {error && (
        <div className='mt-3 text-center font-mono text-[11px] text-red-600'>{error}</div>
      )}

      <div className='mt-5 flex flex-col items-center gap-2'>
        {pagination.hasMore ? (
          <button
            type='button'
            onClick={() => void handleSeeMore()}
            disabled={loadingMore}
            className={cn(
              'flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors hover:bg-muted',
              'focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
            )}
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
        ) : showAllLoaded ? (
          <span className='font-mono text-[11px] uppercase tracking-wider text-muted-foreground'>
            all {pagination.total} apps loaded
          </span>
        ) : null}
      </div>
    </div>
  );
}

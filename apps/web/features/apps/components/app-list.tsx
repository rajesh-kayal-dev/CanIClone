'use client';

import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { AppListRow } from '@/components/ui/app-list-row';
import type { AppRecord } from '@/lib/api/types';
import { Icons } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { CategoryWithCount } from '@/lib/api/categories';
import { sortAppsByMode, type DiscoverySortMode } from '@/lib/ranking';

interface AppListProps {
  apps: AppRecord[];
  categories?: CategoryWithCount[];
  className?: string;
}

export type SortOption = DiscoverySortMode;
type VerdictFilter = 'all' | 'YES' | 'KINDA' | 'NO';

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'trending', label: 'TRENDING' },
  { id: 'popular', label: 'POPULAR' },
  { id: 'new', label: 'NEW RELEASED' },
  { id: 'votes', label: 'VOTES' },
  { id: 'name', label: 'NAME' },
  { id: 'price', label: 'PRICE' },
];

export function AppList({ apps, categories = [], className }: AppListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Determine selected category from URL param or pathname if on a category page
  let selectedCategory = searchParams.get('category') || 'all';
  if (pathname.startsWith('/categories/') && pathname !== '/categories') {
    selectedCategory = pathname.split('/').pop() || 'all';
  }

  const verdictFilter = (searchParams.get('verdict') as VerdictFilter) || 'all';
  const sortBy = (searchParams.get('sort') as SortOption) || 'trending';

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const setSelectedCategory = (val: string) => {
    if (pathname.startsWith('/categories/') && pathname !== '/categories') {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('category');
      
      const search = params.toString();
      const query = search ? `?${search}` : '';

      if (val === 'all') {
        router.push(`/apps${query}`, { scroll: false });
      } else {
        router.push(`/categories/${val}${query}`, { scroll: false });
      }
    } else {
      updateParam('category', val);
    }
  };

  const setVerdictFilter = (val: string) => updateParam('verdict', val);
  const setSortBy = (val: SortOption) => updateParam('sort', val);

  const filteredAndSortedApps = useMemo(() => {
    let result = [...apps];

    // Filter by Category
    if (selectedCategory !== 'all') {
      result = result.filter(a => a.category === selectedCategory);
    }

    // Filter by Verdict
    if (verdictFilter !== 'all') {
      result = result.filter(a => a.verdict === verdictFilter);
    }

    // Apply deterministic discovery ranking mode
    const isSearch = pathname.startsWith('/search');
    return sortAppsByMode(result, sortBy, isSearch);
  }, [apps, selectedCategory, verdictFilter, sortBy, pathname]);

  const activeCategory = categories.find(c => c.slug === selectedCategory);
  const currentSortObj = SORT_OPTIONS.find(s => s.id === sortBy) || SORT_OPTIONS[0];

  return (
    <div className={cn('w-full flex flex-col', className)}>
      
      {/* List Controls */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border/60 mb-2'>
        <div className='flex items-center gap-4 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar'>
          {categories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className='flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md bg-background hover:bg-muted text-[11px] font-mono transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-ring'>
                {activeCategory ? activeCategory.name.toLowerCase() : 'all categories'}
                <Icons.chevronDown className='size-3 opacity-50' />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start' className='max-h-80 overflow-y-auto font-mono text-[11px]'>
                <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                  all categories
                </DropdownMenuItem>
                {categories.map(c => (
                  <DropdownMenuItem key={c.slug} onClick={() => setSelectedCategory(c.slug)}>
                    {c.name.toLowerCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className='flex items-center gap-2'>
            <span className='font-mono text-[10px] text-muted-foreground mr-1 uppercase'>VERDICT</span>
            <div className='flex items-center gap-1 bg-muted/30 p-0.5 rounded-md border border-border'>
              {(['all', 'YES', 'KINDA', 'NO'] as VerdictFilter[]).map(v => (
                <button
                  key={v}
                  onClick={() => setVerdictFilter(v)}
                  className={cn(
                    'px-2 py-1 rounded-sm font-mono text-[10px] uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:z-10',
                    verdictFilter === v 
                      ? 'bg-background shadow-sm text-foreground font-bold border border-border/50' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {v === 'NO' ? 'NOT REALLY' : v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className='flex items-center shrink-0'>
          <DropdownMenu>
            <DropdownMenuTrigger className='flex items-center gap-1.5 text-[10px] font-mono uppercase text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-sm px-1'>
              sort: {currentSortObj.label}
              <Icons.chevronDown className='size-3' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='font-mono text-[11px] uppercase'>
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={cn(sortBy === opt.id && 'font-bold text-primary')}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table Header */}
      <div className='flex items-center justify-between border-b border-border pb-2 px-2 text-[10px] font-mono text-muted-foreground uppercase mt-2'>
        <div className='flex items-center gap-4 flex-1 min-w-0'>
          <span className='w-6 text-right'>#</span>
          <span className='flex-1 ml-1'>APP</span>
        </div>
        <div className='hidden sm:flex items-center gap-4 flex-1 justify-between'>
          <span className='min-w-[140px]'>CATEGORY</span>
          <span className='w-20'>PRICE</span>
          <span className='w-24'>VERDICT</span>
          <span className='w-12 text-right'>REPLACED</span>
        </div>
      </div>
      
      {/* Table Body with horizontal scroll on mobile */}
      <div className='flex flex-col overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0'>
        <div className='min-w-[600px] sm:min-w-0 flex flex-col'>
          {filteredAndSortedApps.map((app, i) => (
            <Link key={app.slug} href={`/apps/${app.slug}`} className='block'>
              <AppListRow app={app} rank={i + 1} />
            </Link>
          ))}
          
          {filteredAndSortedApps.length === 0 && (
            <div className='py-12 text-center font-mono text-sm text-muted-foreground border-b border-border'>
              No apps found matching these filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
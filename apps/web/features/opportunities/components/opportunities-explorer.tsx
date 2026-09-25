'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { SearchBar } from '@/features/search/components/search-bar';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getOpportunitiesPage,
  OPPORTUNITIES_PAGE_LIMIT,
  type OpportunitiesPagination,
  type OpportunityRecord,
} from '@/lib/api/opportunities';
import { cn } from '@/lib/utils';

import { OpportunityRow } from './opportunity-row';

const VERDICT_FILTERS = [
  { value: 'all', label: 'all verdicts' },
  { value: 'YES', label: 'clonable' },
  { value: 'KINDA', label: 'partially' },
  { value: 'NO', label: 'not really' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'any difficulty' },
  { value: 'EASY', label: 'easy' },
  { value: 'MEDIUM', label: 'medium' },
  { value: 'HARD', label: 'hard' },
  { value: 'VERY_HARD', label: 'very hard' },
];

const MARKET_OPTIONS = [
  { value: 'all', label: 'any market' },
  { value: 'RISING', label: 'rising' },
  { value: 'STABLE', label: 'stable' },
  { value: 'FALLING', label: 'falling' },
];

const SORT_OPTIONS = [
  { value: 'recommended', label: 'recommended' },
  { value: 'newest', label: 'newest signal' },
  { value: 'rising', label: 'rising market' },
  { value: 'shortest-build', label: 'shortest build' },
  { value: 'open-source', label: 'most open source' },
];

interface Filters {
  q: string;
  category: string;
  verdict: string;
  difficulty: string;
  market: string;
  sort: string;
}

export const DEFAULT_FILTERS: Filters = {
  q: '',
  category: 'all',
  verdict: 'all',
  difficulty: 'all',
  market: 'all',
  sort: 'recommended',
};

function FilterSelect({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
}) {
  const current = options.find((option) => option.value === value) ?? options[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='outline'
            size='sm'
            className='h-8 gap-1.5 font-mono text-[11px] text-muted-foreground'
          >
            <span className='text-muted-foreground/70'>{label}:</span>
            {current?.label ?? value}
            <Icons.chevronDown className='size-3' />
          </Button>
        }
      />
      <DropdownMenuContent align='start' className='font-mono text-[11px]'>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={cn(option.value === value && 'bg-muted font-bold')}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OpportunitiesExplorer({
  initialItems,
  initialPagination,
  categories,
  initialFilters,
}: {
  initialItems: OpportunityRecord[];
  initialPagination: OpportunitiesPagination;
  categories: { slug: string; name: string }[];
  initialFilters?: Partial<Filters>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo<Filters>(
    () => ({ ...DEFAULT_FILTERS, ...initialFilters }),
    [initialFilters],
  );
  const [items, setItems] = useState(initialItems);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(initialPagination.page);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'all categories' },
      ...categories.map((category) => ({ value: category.slug, label: category.name })),
    ],
    [categories],
  );

  const updateUrl = useCallback(
    (patch: Partial<Filters>) => {
      const next = { ...filters, ...patch };
      const params = new URLSearchParams(searchParams.toString());
      const setOrDelete = (key: keyof Filters, value: string, defaultValue: string) => {
        if (!value || value === defaultValue) params.delete(key);
        else params.set(key, value);
      };
      setOrDelete('q', next.q, '');
      setOrDelete('category', next.category, 'all');
      setOrDelete('verdict', next.verdict, 'all');
      setOrDelete('difficulty', next.difficulty, 'all');
      setOrDelete('market', next.market, 'all');
      setOrDelete('sort', next.sort, 'recommended');
      const query = params.toString();
      const url = query ? `${pathname}?${query}` : pathname;
      const current = `${window.location.pathname}${window.location.search}`;
      if (url !== current) router.push(url, { scroll: false });
    },
    [filters, pathname, router, searchParams],
  );

  const fetchMore = useCallback(async () => {
    if (loading || !pagination.hasMore) return;
    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await getOpportunitiesPage(
        {
          ...filters,
          page: pageRef.current + 1,
          limit: OPPORTUNITIES_PAGE_LIMIT,
        },
        { signal: controller.signal },
      );
      pageRef.current = result.pagination.page;
      setPagination(result.pagination);
      setItems((previous) => {
        const seen = new Set(previous.map((item) => item.slug));
        return [...previous, ...result.items.filter((item) => !seen.has(item.slug))];
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      setError(cause instanceof Error ? cause.message : 'Could not load more opportunities');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [filters, loading, pagination.hasMore]);

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-3 border-b border-border/60 pb-3'>
        <SearchBar
          key={filters.q}
          defaultValue={filters.q}
          placeholder='search opportunities...'
          onSubmit={(value) => updateUrl({ q: value })}
          className='w-full max-w-sm'
        />
        <div className='flex flex-wrap items-center gap-2'>
          <div className='flex items-center gap-1 rounded-md border border-border/60 p-0.5'>
            {VERDICT_FILTERS.map((value) => (
              <button
                key={value.value}
                type='button'
                onClick={() => updateUrl({ verdict: value.value })}
                className={cn(
                  'rounded px-2 py-1 font-mono text-[11px] transition-colors',
                  filters.verdict === value.value
                    ? 'bg-primary font-bold text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {value.label}
              </button>
            ))}
          </div>
          <FilterSelect
            label='cat'
            value={filters.category}
            options={categoryOptions}
            onSelect={(value) => updateUrl({ category: value })}
          />
          <FilterSelect
            label='build'
            value={filters.difficulty}
            options={DIFFICULTY_OPTIONS}
            onSelect={(value) => updateUrl({ difficulty: value })}
          />
          <FilterSelect
            label='market'
            value={filters.market}
            options={MARKET_OPTIONS}
            onSelect={(value) => updateUrl({ market: value })}
          />
          <FilterSelect
            label='sort'
            value={filters.sort}
            options={SORT_OPTIONS}
            onSelect={(value) => updateUrl({ sort: value })}
          />
          <span className='ml-auto font-mono text-[11px] text-muted-foreground'>
            {pagination.total} opportunities
          </span>
        </div>
      </div>

      {error && (
        <div className='border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-[12px] text-red-600 dark:text-red-400'>
          {error}
        </div>
      )}

      <div>
        {items.length === 0 ? (
          <div className='flex flex-col items-center gap-3 border border-border/60 px-4 py-10 text-center'>
            <span className='font-mono text-[12px] text-muted-foreground'>
              No matching build opportunities.
            </span>
            <Button
              variant='outline'
              size='sm'
              type='button'
              onClick={() =>
                router.push('/opportunities', { scroll: false })
              }
              className='font-mono text-[11px]'
            >
              Clear filters
            </Button>
          </div>
        ) : (
          items.map((opportunity, index) => (
            <OpportunityRow key={opportunity.slug} opportunity={opportunity} rank={index + 1} />
          ))
        )}
      </div>

      {pagination.hasMore && (
        <div className='flex justify-center pt-2'>
          <Button
            variant='outline'
            size='sm'
            type='button'
            disabled={loading}
            onClick={() => void fetchMore()}
            className='gap-2 font-mono text-[11px]'
          >
            {loading ? (
              <Icons.spinner className='size-3 animate-spin' />
            ) : (
              <Icons.chevronDown className='size-3' />
            )}
            see more
          </Button>
        </div>
      )}

      {!pagination.hasMore && items.length > 0 && (
        <div className='flex justify-center pt-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground'>
          all opportunities loaded
        </div>
      )}
    </div>
  );
}

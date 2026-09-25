import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ErrorState } from '@/components/shared/error-state';
import { AppListSkeleton } from '@/components/ui/app-list-skeleton';
import {
  OpportunitiesExplorer,
  DEFAULT_FILTERS,
} from '@/features/opportunities/components/opportunities-explorer';
import { fetchCategoryStats } from '@/lib/api/categories';
import {
  getOpportunitiesPage,
  OPPORTUNITIES_PAGE_LIMIT,
} from '@/lib/api/opportunities';

export const metadata: Metadata = {
  title: 'Build Opportunities',
  description:
    'Find existing products that may be interesting to build, with the evidence behind every signal.',
};

function stringParam(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = stringParam(params.q) ?? DEFAULT_FILTERS.q;
  const category = stringParam(params.category) ?? DEFAULT_FILTERS.category;
  const verdict = stringParam(params.verdict)?.toUpperCase() ?? DEFAULT_FILTERS.verdict;
  const difficulty = stringParam(params.difficulty)?.toUpperCase() ?? DEFAULT_FILTERS.difficulty;
  const market = stringParam(params.market)?.toUpperCase() ?? DEFAULT_FILTERS.market;
  const sort = stringParam(params.sort) ?? DEFAULT_FILTERS.sort;
  const signature = [q, category, verdict, difficulty, market, sort].join('|');

  let initial;
  let categories;
  try {
    [initial, categories] = await Promise.all([
      getOpportunitiesPage(
        {
          page: 1,
          limit: OPPORTUNITIES_PAGE_LIMIT,
          q,
          category,
          verdict,
          difficulty,
          market,
          sort,
        },
        { cached: true },
      ),
      fetchCategoryStats(),
    ]);
  } catch {
    return <ErrorState title='Could not load opportunities' />;
  }

  return (
    <div className='layout-container flex flex-col py-8'>
      <div className='mb-6 flex flex-col gap-1 border-b border-border pb-3'>
        <h1 className='text-3xl font-bold tracking-tight'>Build Opportunities</h1>
        <span className='font-mono text-[11px] uppercase tracking-wider text-muted-foreground'>
          evidence-backed discovery from existing app data
        </span>
      </div>

      <Suspense fallback={<AppListSkeleton count={OPPORTUNITIES_PAGE_LIMIT} />}>
        <OpportunitiesExplorer
          key={signature}
          initialItems={initial.items}
          initialPagination={initial.pagination}
          categories={categories}
          initialFilters={{ q, category, verdict, difficulty, market, sort }}
        />
      </Suspense>
    </div>
  );
}

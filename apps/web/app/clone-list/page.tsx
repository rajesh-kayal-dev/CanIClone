import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ErrorState } from '@/components/shared/error-state';
import { AppListSkeleton } from '@/components/ui/app-list-skeleton';
import { AppsExplorer } from '@/features/apps/components/apps-explorer';
import { APPS_PAGE_LIMIT, getCloneListPage } from '@/lib/api/apps';
import { fetchCategoryStats } from '@/lib/api/categories';

export const metadata: Metadata = {
  title: 'Clone List',
  description: 'Discover apps ranked by the real number of tracked replacement alternatives.',
};

function stringParam(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

export default async function CloneListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category = stringParam(params.category);
  const verdict = stringParam(params.verdict);
  const sort = stringParam(params.sort) ?? 'replaced';
  const q = stringParam(params.q);
  const signature = [category ?? 'all', verdict ?? 'all', sort, q ?? ''].join('|');

  let initial;
  let categories;
  try {
    [initial, categories] = await Promise.all([
      getCloneListPage(
        {
          page: 1,
          limit: APPS_PAGE_LIMIT,
          category,
          verdict,
          sort,
          q,
        },
        { cached: true },
      ),
      fetchCategoryStats(),
    ]);
  } catch {
    return <ErrorState title='Could not load the clone list' />;
  }

  return (
    <div className='layout-container flex flex-col py-8'>
      <div className='mb-6 flex flex-col gap-1 border-b border-border pb-3'>
        <h1 className='text-2xl font-bold tracking-tight'>Clone List</h1>
        <p className='font-mono text-[11px] uppercase tracking-wider text-muted-foreground'>
          ranked by tracked replacement alternatives
        </p>
      </div>

      <Suspense fallback={<AppListSkeleton count={APPS_PAGE_LIMIT} />}>
        <AppsExplorer
          key={signature}
          initialApps={initial.items}
          initialPagination={initial.pagination}
          categories={categories}
          routeMode='clone-list'
          defaultSort='replaced'
        />
      </Suspense>
    </div>
  );
}

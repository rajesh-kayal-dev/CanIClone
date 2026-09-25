import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ErrorState } from '@/components/shared/error-state';
import { AppListSkeleton } from '@/components/ui/app-list-skeleton';
import { AppsExplorer } from '@/features/apps/components/apps-explorer';
import { APPS_PAGE_LIMIT, getAppsPage } from '@/lib/api/apps';
import { fetchCategoryStats } from '@/lib/api/categories';

export const metadata: Metadata = {
  title: 'Apps',
  description: 'Browse the CanIClone app directory.',
};

function stringParam(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

export default async function AppsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category = stringParam(params.category);
  const verdict = stringParam(params.verdict);
  const sort = stringParam(params.sort);
  const q = stringParam(params.q);
  const signature = [category ?? 'all', verdict ?? 'all', sort ?? 'trending', q ?? ''].join('|');

  let initial;
  let categories;
  try {
    [initial, categories] = await Promise.all([
      getAppsPage(
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
    return <ErrorState title='Could not load apps' />;
  }

  const count = categories.reduce((sum, categoryItem) => sum + categoryItem.appCount, 0);

  return (
    <div className='layout-container flex flex-col py-8'>
      <div className='mb-6 flex items-end justify-between border-b border-border pb-3'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl font-bold tracking-tight'>Apps</h1>
          <span className='font-mono text-[11px] uppercase tracking-wider text-muted-foreground'>
            directory · {count} apps
          </span>
        </div>
      </div>

      <Suspense fallback={<AppListSkeleton count={APPS_PAGE_LIMIT} />}>
        <AppsExplorer
          key={signature}
          initialApps={initial.items}
          initialPagination={initial.pagination}
          categories={categories}
          routeMode='apps'
        />
      </Suspense>
    </div>
  );
}

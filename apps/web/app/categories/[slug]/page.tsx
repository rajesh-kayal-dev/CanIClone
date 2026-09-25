import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AppListSkeleton } from '@/components/ui/app-list-skeleton';
import { BackButton } from '@/components/ui/back-button';
import { MicroGlyph } from '@/components/ui/micro-glyph';
import { Empty } from '@/components/ui/empty';
import { ErrorState } from '@/components/shared/error-state';
import { AppsExplorer } from '@/features/apps/components/apps-explorer';
import { APPS_PAGE_LIMIT, getAppsPage } from '@/lib/api/apps';
import { fetchCategoryBySlug, fetchCategoryStats } from '@/lib/api/categories';

function stringParam(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);
  if (!category) return { title: 'Category not found' };
  return { title: category.name, description: category.description };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const queryParams = await searchParams;
  const verdict = stringParam(queryParams.verdict);
  const sort = stringParam(queryParams.sort);
  const q = stringParam(queryParams.q);
  const signature = [slug, verdict ?? 'all', sort ?? 'trending', q ?? ''].join('|');

  let category;
  let categories;
  let initial;
  try {
    [category, categories, initial] = await Promise.all([
      fetchCategoryBySlug(slug),
      fetchCategoryStats(),
      getAppsPage(
        {
          page: 1,
          limit: APPS_PAGE_LIMIT,
          category: slug,
          verdict,
          sort,
          q,
        },
        { cached: true },
      ),
    ]);
  } catch {
    return <ErrorState title='Could not load this category' />;
  }

  if (!category) notFound();

  return (
    <div className='layout-container flex flex-col py-8'>
      <div className='mb-6 flex items-center gap-4 font-mono text-[11px] text-muted-foreground'>
        <BackButton fallbackPath='/categories' />
        <div className='flex items-center gap-2'>
          <Link href='/categories' className='hover:underline'>all categories</Link>
          <span>/</span>
          <span className='text-foreground'>{category.name.toLowerCase()}</span>
        </div>
      </div>

      <div className='mb-4 flex items-end justify-between border-b border-border pb-2'>
        <div className='flex items-center gap-3'>
          <div className='flex size-7 items-center justify-center rounded border border-border/60 bg-muted/40 text-foreground'>
            <MicroGlyph name={category.slug} className='size-4' />
          </div>
          <h1 className='text-2xl font-bold tracking-tight'>{category.name}</h1>
        </div>
        <div className='flex items-center gap-3'>
          <span className='font-mono text-[11px] text-muted-foreground'>{category.appCount} apps</span>
          <Link
            href={`/apps?category=${encodeURIComponent(category.slug)}`}
            className='font-mono text-[11px] underline underline-offset-4 hover:text-foreground'
          >
            open in apps
          </Link>
        </div>
      </div>

      {category.appCount > 0 ? (
        <Suspense fallback={<AppListSkeleton count={APPS_PAGE_LIMIT} />}>
          <AppsExplorer
            key={signature}
            initialApps={initial.items}
            initialPagination={initial.pagination}
            categories={categories}
            routeMode='category'
            fixedCategory={slug}
          />
        </Suspense>
      ) : (
        <Empty className='border-none py-16 text-center'>
          <p className='font-mono text-sm text-muted-foreground'>No apps in this category yet.</p>
        </Empty>
      )}
    </div>
  );
}

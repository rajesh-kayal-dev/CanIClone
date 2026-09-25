import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { Icons } from '@/components/icons';
import { CategoryPill } from '@/components/ui/category-pill';
import { ErrorState } from '@/components/shared/error-state';
import { SearchBar } from '@/features/search/components/search-bar';
import { TrendingApps } from '@/features/apps/components/trending-apps';
import { getAppsPage } from '@/lib/api/apps';
import { fetchCategoryStats } from '@/lib/api/categories';
import { MicroGlyph } from '@/components/ui/micro-glyph';

export const metadata: Metadata = {
  title: 'Can I clone this?',
};

export default async function HomePage() {
  let trending;
  let categories;

  try {
    [trending, categories] = await Promise.all([
      getAppsPage(
        { page: 1, limit: 10, sort: 'trending' },
        { cached: true },
      ),
      fetchCategoryStats(),
    ]);
  } catch {
    return <ErrorState title='Could not load the directory' className='mx-auto max-w-6xl py-16' />;
  }

  const topCategories = categories.slice(0, 20);
  const appCount = categories.reduce((sum, category) => sum + category.appCount, 0);

  return (
    <div className='flex min-h-[calc(100vh-4rem)] flex-col items-center gap-12 py-16 sm:py-20'>
      <section className='layout-container flex flex-col items-center gap-4 text-center'>
        <h1 className='text-balance text-6xl font-extrabold tracking-tighter sm:text-7xl md:text-8xl'>
          Can I clone this?
        </h1>
        <p className='mt-2 font-mono text-xs text-muted-foreground sm:text-sm'>
          {appCount} apps. One question: can you build a replacement yourself?
        </p>
        <div className='mt-6 w-full max-w-xl'>
          <SearchBar size='lg' className='w-full' placeholder={`> search an app... (${appCount})`} />
        </div>
      </section>

      <section className='layout-container flex flex-col items-center gap-4'>
        <div className='flex flex-wrap justify-center gap-2'>
          {topCategories.map((category) => (
            <CategoryPill key={category.slug} category={category} />
          ))}
          <Link
            href='/categories'
            className='inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted'
          >
            all categories <Icons.arrowRight className='size-3' />
          </Link>
        </div>
      </section>

      <section className='layout-container'>
        <div className='w-full rounded border border-green-500/20 bg-green-500/5 py-2 text-center'>
          <p className='flex flex-wrap items-center justify-center gap-2 font-mono text-[11px] text-green-700 dark:text-green-400'>
            <span className='flex items-center gap-1 rounded bg-green-500/20 px-1.5 py-0.5 font-bold uppercase tracking-wider'>
              <MicroGlyph name='spark' className='size-2.5' />
              NEW
            </span>
            <span>submit your vibe-coded app • get featured on the homepage</span>
            <Link href='/apps' className='underline'>see how →</Link>
          </p>
        </div>
      </section>

      <section id='how-it-works' className='layout-container mb-20 flex flex-col gap-4'>
        <div className='mb-2 flex items-end justify-between gap-4'>
          <div className='flex flex-col gap-1'>
            <h2 className='text-2xl font-bold tracking-tight'>Trending right now</h2>
            <p className='font-mono text-[11px] text-muted-foreground'>Apps getting attention lately.</p>
          </div>
          <Link
            href='/apps'
            className='flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:underline'
          >
            view all apps <Icons.arrowRight className='size-3' />
          </Link>
        </div>

        <Suspense fallback={<div className='py-8 font-mono text-sm text-muted-foreground'>Loading list...</div>}>
          <TrendingApps
            initialApps={trending.items}
            initialPagination={trending.pagination}
          />
        </Suspense>
      </section>
    </div>
  );
}

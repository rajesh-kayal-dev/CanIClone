import Link from 'next/link';
import { Suspense } from 'react';

import { Icons } from '@/components/icons';
import { AppList } from '@/features/apps/components/app-list';
import { CategoryPill } from '@/components/ui/category-pill';
import { ErrorState } from '@/components/shared/error-state';
import { getTrendingApps, getAppCount } from '@/lib/api/apps';
import { getTopCategories } from '@/lib/api/categories';
import { SearchBar } from '@/features/search/components/search-bar';
import { MicroGlyph } from '@/components/ui/micro-glyph';

export default async function HomePage() {
  let trendingApps;
  let topCategories;
  let appCount;

  try {
    [trendingApps, topCategories, appCount] = await Promise.all([
      getTrendingApps(15),
      getTopCategories(20),
      getAppCount()
    ]);
  } catch {
    return <ErrorState title='Could not load the directory' className='mx-auto max-w-6xl py-16' />;
  }

  return (
    <div className='flex flex-col items-center gap-12 py-16 sm:py-20 min-h-[calc(100vh-4rem)]'>
      {/* Hero */}
      <section className='layout-container flex flex-col items-center gap-4 text-center'>
        <h1 className='text-balance text-6xl font-extrabold tracking-tighter sm:text-7xl md:text-8xl'>
          Can I clone this?
        </h1>
        <p className='font-mono text-xs sm:text-sm text-muted-foreground mt-2'>
          {appCount} apps. One question: can you build a replacement yourself?
        </p>
        <div className='w-full max-w-xl mt-6'>
          <SearchBar size='lg' className='w-full' placeholder={`> search an app... (${appCount})`} />
        </div>
      </section>

      {/* Categories Cloud */}
      <section className='layout-container flex flex-col items-center gap-4'>
        <div className='flex flex-wrap justify-center gap-2'>
          {topCategories.map((category) => (
            <CategoryPill key={category.slug} category={category} />
          ))}
          <Link href='/categories' className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-background hover:bg-muted text-[11px] font-mono transition-colors text-muted-foreground'>
            all categories <Icons.arrowRight className='size-3' />
          </Link>
        </div>
      </section>

      {/* Promo Strip */}
      <section className='layout-container'>
         <div className='w-full rounded border border-green-500/20 bg-green-500/5 py-2 px-4 text-center'>
            <p className='font-mono text-[11px] text-green-700 dark:text-green-400 flex items-center justify-center gap-2'>
              <span className='font-bold bg-green-500/20 px-1.5 py-0.5 rounded uppercase flex items-center gap-1.5'>
                <MicroGlyph name='spark' className='w-2.5 h-2.5' />
                NEW
              </span>
              <span>submit your vibe-coded app • get featured on the homepage</span>
              <Link href='/apps' className='underline'>see how →</Link>
            </p>
         </div>
      </section>

      {/* Trending apps table */}
      <section className='layout-container flex flex-col gap-4 mb-20'>
        <div className='flex items-end justify-between gap-4 mb-2'>
          <div className='flex flex-col gap-1'>
            <h2 className='text-2xl font-bold tracking-tight'>Trending right now</h2>
            <p className='font-mono text-[11px] text-muted-foreground'>Apps getting attention lately.</p>
          </div>
          <Link href='/apps' className='font-mono text-[11px] hover:underline text-muted-foreground flex items-center gap-1'>
            view all apps <Icons.arrowRight className='size-3' />
          </Link>
        </div>
        
        <Suspense fallback={<div className='font-mono text-sm text-muted-foreground py-8'>Loading list...</div>}>
          <AppList apps={trendingApps} />
        </Suspense>
      </section>
    </div>
  );
}
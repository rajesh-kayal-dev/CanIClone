import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Icons } from '@/components/icons';
import { AppHeader } from '@/features/apps/components/app-header';
import { AppList } from '@/features/apps/components/app-list';
import { VerdictOverview } from '@/features/ai-analysis/components/verdict-overview';
import { AnalysisGrid } from '@/features/ai-analysis/components/analysis-grid';
import { PromptPanel } from '@/features/ai-analysis/components/prompt-panel';
import { ErrorState } from '@/components/shared/error-state';
import { getAppBySlug, getAlternatives, getRelatedApps } from '@/lib/api/apps';
import type { AppRecord } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { MarketSignal } from '@/features/market/components/market-signal';
import { getAppMarketData, getTrendsApiData } from '@/lib/api/market';
import type { ApiMarketTrend, ApiTrendsAppData } from '@/lib/api/types';


export function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return params.then(async ({ slug }) => {
    try {
      const app = await getAppBySlug(slug);
      if (!app) return { title: 'App not found' };
      return { title: app.name, description: app.tagline };
    } catch {
      return { title: 'App', description: 'Could not load this review right now.' };
    }
  });
}

export default async function AppDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let app;
  let marketData: ApiMarketTrend | null = null;
  let trendsApiData = null;
  
  try {
    [app, marketData, trendsApiData] = await Promise.all([
      getAppBySlug(slug),
      getAppMarketData(slug).catch(() => null),
      getTrendsApiData(slug).catch(() => null)
    ]);
  } catch {
    return <ErrorState title='Could not load this app' />;
  }
  if (!app) notFound();

  let related: AppRecord[] = [];
  let alternativeCount = 0;
  try {
    [related, alternativeCount] = await Promise.all([
      getRelatedApps(app, 4),
      getAlternatives(app).then((list) => list.length)
    ]);
  } catch {
    // Non-fatal: related apps and alternative counts degrade gracefully.
  }

  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14'>
      <AppHeader app={app} />

      <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]'>
        <div className='flex min-w-0 flex-col gap-8'>
          <section className='flex flex-col gap-2'>
            <h2 className='text-sm font-medium tracking-wide text-muted-foreground uppercase'>
              Why it matters
            </h2>
            <p className='max-w-3xl text-base leading-relaxed text-foreground/90'>
              {app.description}
            </p>
          </section>

          <AnalysisGrid app={app} />

          <PromptPanel app={app} />
        </div>

        <aside className='flex flex-col gap-4'>
          <VerdictOverview app={app} />

          {(marketData || trendsApiData) && (
            <MarketSignal marketData={marketData} trendsApiData={trendsApiData} />
          )}

          <div className='flex flex-col gap-4 border border-border rounded-xl p-4 bg-muted/20'>
            <div className='flex items-center gap-2 text-base font-semibold'>
              <Icons.arrowRight className='size-4 text-primary' />
              Compare alternatives
            </div>
            <p className='text-sm text-muted-foreground'>
              See how this app stacks up against the closest cloneable contenders.
            </p>
            <div className='flex justify-end'>
              <Button size='sm' variant='outline' nativeButton={false} render={<Link href={`/apps/${app.slug}/alternatives`} />}>
                {alternativeCount} alternatives
                <Icons.chevronRight className='size-4' />
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <Separator />

      <section className='flex flex-col gap-6'>
        <div className='flex items-end justify-between gap-4'>
          <div className='flex flex-col gap-1'>
            <h2 className='text-2xl font-bold tracking-tight'>Related apps</h2>
            <p className='text-sm text-muted-foreground'>In the same neighborhood — all with build prompts ready.</p>
          </div>
          <Button variant='ghost' size='sm' nativeButton={false} render={<Link href='/apps' />}>
            View all
            <Icons.chevronRight className='size-4' />
          </Button>
        </div>
        <Suspense fallback={<div className='font-mono text-sm text-muted-foreground py-8'>Loading list...</div>}>
          <AppList apps={related} />
        </Suspense>
      </section>
    </div>
  );
}
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { Icons } from '@/components/icons';
import { AppHeader } from '@/features/apps/components/app-header';
import { AppList } from '@/features/apps/components/app-list';
import { VerdictOverview } from '@/features/ai-analysis/components/verdict-overview';
import { AnalysisGrid } from '@/features/ai-analysis/components/analysis-grid';
import { PromptPanel } from '@/features/ai-analysis/components/prompt-panel';
import { getAppBySlug, getAlternatives, getRelatedApps } from '@/features/apps/data/apps';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return params.then(({ slug }) => {
    const app = getAppBySlug(slug);
    if (!app) return { title: 'App not found' };
    return { title: app.name, description: app.tagline };
  });
}

export default async function AppDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = getAppBySlug(slug);
  if (!app) notFound();

  const related = getRelatedApps(app, 4);

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

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Icons.arrowRight className='size-4 text-primary' />
                Compare alternatives
              </CardTitle>
              <CardDescription>
                See how this app stacks up against the closest cloneable contenders.
              </CardDescription>
            </CardHeader>
            <CardFooter className='flex justify-end'>
              <Button size='sm' nativeButton={false} render={<Link href={`/apps/${app.slug}/alternatives`} />}>
                {getAlternatives(app).length} alternatives
                <Icons.chevronRight className='size-4' />
              </Button>
            </CardFooter>
          </Card>
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
        <AppList apps={related} className='lg:grid-cols-4' />
      </section>
    </div>
  );
}
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { VerdictLabel } from '@/components/shared/verdict-badge';
import { ErrorState } from '@/components/shared/error-state';
import { AlternativeRow } from '@/features/apps/components/alternative-row';
import { AppList } from '@/features/apps/components/app-list';
import { getAppBySlug, getAlternatives, getRelatedApps } from '@/lib/api/apps';
import type { AppRecord } from '@/lib/api/types';
import { BackButton } from '@/components/ui/back-button';

export function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return params.then(async ({ slug }) => {
    try {
      const app = await getAppBySlug(slug);
      if (!app) return { title: 'App not found' };
      return { title: `${app.name} alternatives`, description: `Alternatives to ${app.name} — with verdicts and build prompts.` };
    } catch {
      return { title: 'Alternatives', description: 'Could not load alternatives right now.' };
    }
  });
}

export default async function AppAlternativesPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let app;
  try {
    app = await getAppBySlug(slug);
  } catch {
    return <ErrorState title='Could not load this app' />;
  }
  if (!app) notFound();

  let alternatives: AppRecord[] = [];
  let related: AppRecord[] = [];
  try {
    [alternatives, related] = await Promise.all([
      getAlternatives(app, 5),
      getRelatedApps(app, 3)
    ]);
  } catch {
    // Non-fatal: alternative and related lists degrade gracefully.
  }

  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14'>
      <div className='flex flex-col gap-4'>
        <BackButton fallbackPath={`/apps/${app.slug}`} />
        <div className='flex flex-col gap-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Alternatives to {app.name}</h1>
          <p className='max-w-2xl text-muted-foreground'>
            The closest cloneable contenders, compared side by side. Every row links to its full
            review and build prompt.
          </p>
        </div>
      </div>

      <div className='flex flex-col gap-4'>
        {alternatives.map((alternative) => (
          <AlternativeRow key={alternative.slug} app={alternative} />
        ))}
      </div>

      <div className='flex flex-col gap-2'>
        <h2 className='text-lg font-semibold tracking-tight'>Still not sure?</h2>
        <p className='text-sm text-muted-foreground'>
          Read the full analysis for{' '}
          <Link href={`/apps/${app.slug}`} className='text-foreground underline-offset-4 hover:underline'>
            {app.name}
          </Link>{' '}
          <VerdictLabel verdict={app.verdict} /> — or look at these related picks.
        </p>
      </div>

      <Suspense fallback={<div className='font-mono text-sm text-muted-foreground py-8'>Loading list...</div>}>
        <AppList apps={related} />
      </Suspense>

      <div className='flex justify-center'>
        <Button variant='outline' nativeButton={false} render={<Link href='/apps' />}>
          Browse the full directory
          <Icons.arrowRight className='size-4' />
        </Button>
      </div>
    </div>
  );
}
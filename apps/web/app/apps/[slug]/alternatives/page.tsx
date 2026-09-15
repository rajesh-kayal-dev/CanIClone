import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { VerdictLabel } from '@/components/shared/verdict-badge';
import { AlternativeRow } from '@/features/apps/components/alternative-row';
import { AppList } from '@/features/apps/components/app-list';
import { getAppBySlug, getAlternatives, getRelatedApps } from '@/features/apps/data/apps';

export function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return params.then(({ slug }) => {
    const app = getAppBySlug(slug);
    if (!app) return { title: 'App not found' };
    return { title: `${app.name} alternatives`, description: `Alternatives to ${app.name} — with verdicts and build prompts.` };
  });
}

export default async function AppAlternativesPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = getAppBySlug(slug);
  if (!app) notFound();

  const alternatives = getAlternatives(app, 5);
  const related = getRelatedApps(app, 3);

  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14'>
      <div className='flex flex-col gap-4'>
        <Link
          href={`/apps/${app.slug}`}
          className='inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground'
        >
          <Icons.chevronLeft className='size-4' />
          {app.name}
        </Link>
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

      <AppList apps={related} className='lg:grid-cols-3' />

      <div className='flex justify-center'>
        <Button variant='outline' nativeButton={false} render={<Link href='/apps' />}>
          Browse the full directory
          <Icons.arrowRight className='size-4' />
        </Button>
      </div>
    </div>
  );
}
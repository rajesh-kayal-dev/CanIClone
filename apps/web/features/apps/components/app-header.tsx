import Link from 'next/link';

import { Icons } from '@/components/icons';
import { VerdictBadge } from '@/components/shared/verdict-badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { AppRecord } from '@/features/apps/data/apps';

export function AppHeader({ app }: { app: AppRecord }) {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4'>
        <Link
          href='/apps'
          className='inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground'
        >
          <Icons.chevronLeft className='size-4' />
          All apps
        </Link>
        <div className='flex flex-col gap-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <h1 className='text-3xl font-bold tracking-tight'>{app.name}</h1>
            <VerdictBadge verdict={app.verdict} />
          </div>
          <p className='max-w-2xl text-lg text-muted-foreground'>{app.tagline}</p>
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground'>
        <span className='inline-flex items-center gap-1.5'>
          <span className='text-foreground/40'>Category</span>
          <Link
            href={`/categories/${app.category}`}
            className='text-foreground underline-offset-4 hover:underline'
          >
            {app.category}
          </Link>
        </span>
        <Separator orientation='vertical' className='h-4 data-vertical:self-center' />
        <span className='inline-flex items-center gap-1.5'>
          <Icons.creditCard className='size-4' />
          <span className='text-foreground'>{app.pricing}</span>
        </span>
        {(app.officialUrl || app.repoUrl) && (
          <>
            <Separator orientation='vertical' className='h-4 data-vertical:self-center' />
            {app.officialUrl && (
              <Button
                variant='outline'
                size='xs'
                nativeButton={false}
                render={
                  <a href={app.officialUrl} target='_blank' rel='noopener noreferrer' />
                }
              >
                Official site
                <Icons.externalLink className='size-3' />
              </Button>
            )}
            {app.repoUrl && (
              <Button
                variant='outline'
                size='xs'
                nativeButton={false}
                render={<a href={app.repoUrl} target='_blank' rel='noopener noreferrer' />}
              >
                <Icons.github className='size-3' />
                Source
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
import Link from 'next/link';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import type { AppRecord } from '@/lib/api/types';

export function ReportActions({ app }: { app: AppRecord }) {
  return (
    <section className='flex flex-col gap-4 rounded-lg border border-border bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex flex-wrap items-center gap-2'>
        {app.openSource.length > 0 ? (
          <Button variant='outline' nativeButton={false} render={<Link href={`/apps/${app.slug}/alternatives`} />} className='border-emerald-500/50 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300'>
            view {app.openSource.length} free alternatives
            <Icons.arrowRight className='size-4' />
          </Button>
        ) : (
          <Button variant='outline' nativeButton={false} render={<Link href='/apps' />}>
            browse the directory
            <Icons.arrowRight className='size-4' />
          </Button>
        )}
        <Button variant='outline' nativeButton={false} render={<Link href='/market' />}>
          market signals
          <Icons.arrowRight className='size-4' />
        </Button>
        {app.officialUrl && (
          <Button
            variant='outline'
            nativeButton={false}
            render={<a href={app.officialUrl} target='_blank' rel='noopener noreferrer' />}
          >
            official site
            <Icons.externalLink className='size-4' />
          </Button>
        )}
      </div>
      <div className='font-mono text-[11px] text-muted-foreground'>
        {app.voteCount} community votes · {app.openSource.length} free alternatives tracked
      </div>
    </section>
  );
}

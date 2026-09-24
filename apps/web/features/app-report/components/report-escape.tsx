import Link from 'next/link';

import { Icons } from '@/components/icons';
import { formatVotes } from '@/lib/api/format';
import type { AppRecord } from '@/lib/api/types';

import { AppIcon } from './app-icon';
import { ReportLabel } from './report-label';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function formatCommitDate(value: string | null): string {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})/);
  if (match) {
    const month = MONTHS[Number(match[2]) - 1];
    return month ? `${month} ${match[1]}` : value;
  }
  return value;
}

export function ReportEscape({ app }: { app: AppRecord }) {
  if (app.openSource.length === 0) return null;

  return (
    <section className='flex flex-col gap-4'>
      <div className='flex flex-col gap-2'>
        <ReportLabel>the escape hatch</ReportLabel>
        <h2 className='text-xl font-bold tracking-tight sm:text-2xl'>
          Don&apos;t feel like building it? These folks already made it free.
        </h2>
      </div>

      <ul className='flex flex-col gap-3'>
        {app.openSource.map((alt) => {
          const commitDate = formatCommitDate(alt.lastCommit);
          return (
            <li key={alt.name}>
              <a
                href={alt.url}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-4 rounded-lg border border-border bg-muted/20 px-4 py-3 transition-colors hover:border-foreground/30 hover:bg-muted/40'
              >
                <AppIcon name={alt.name} officialUrl={alt.url} className='size-9 text-[11px]' />
                <div className='min-w-0 flex-1'>
                  <div className='font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400'>
                    {alt.name}
                  </div>
                  {alt.description && (
                    <div className='truncate font-mono text-[12px] text-muted-foreground'>
                      {alt.description}
                    </div>
                  )}
                </div>
                <div className='hidden shrink-0 items-center gap-3 sm:flex'>
                  {alt.stars !== null && (
                    <span className='inline-flex items-center gap-1 font-mono text-[11px] text-foreground'>
                      <Icons.star className='size-3 text-amber-400' />
                      {formatVotes(alt.stars)}
                    </span>
                  )}
                  {commitDate && (
                    <span className='font-mono text-[11px] text-muted-foreground'>
                      · {commitDate}
                    </span>
                  )}
                  <span className='rounded-full border border-emerald-500/40 px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-emerald-600 uppercase dark:text-emerald-400'>
                    open source
                  </span>
                </div>
                <Icons.arrowRight className='size-4 shrink-0 text-muted-foreground' />
              </a>
            </li>
          );
        })}
      </ul>

      <Link
        href={`/apps/${app.slug}/alternatives`}
        className='font-mono text-[12px] font-semibold text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400'
      >
        all {app.openSource.length} free alternatives to {app.name} →
      </Link>
    </section>
  );
}

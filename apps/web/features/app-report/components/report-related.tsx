import Link from 'next/link';

import type { AppRecord } from '@/lib/api/types';

import { AppIcon } from './app-icon';
import { ReportLabel } from './report-label';
import { VerdictChip } from './verdict-display';

export function ReportRelated({ apps }: { apps: AppRecord[] }) {
  if (apps.length === 0) return null;

  return (
    <section className='flex flex-col gap-4'>
      <ReportLabel>also one-shottable</ReportLabel>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {apps.map((app) => (
          <Link
            key={app.slug}
            href={`/apps/${app.slug}`}
            className='flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 transition-colors hover:border-foreground/30 hover:bg-muted/40'
          >
            <AppIcon name={app.name} officialUrl={app.officialUrl} className='size-8 text-[10px]' />
            <div className='min-w-0 flex-1'>
              <div className='truncate font-mono text-sm font-semibold text-foreground'>
                {app.name}
              </div>
              <div className='truncate font-mono text-[11px] text-muted-foreground'>
                {app.pricing} · {app.category}
              </div>
            </div>
            <VerdictChip verdict={app.verdict} />
          </Link>
        ))}
      </div>
    </section>
  );
}

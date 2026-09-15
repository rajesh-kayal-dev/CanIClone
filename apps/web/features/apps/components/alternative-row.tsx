import Link from 'next/link';

import { Icons } from '@/components/icons';
import { VerdictBadge } from '@/components/shared/verdict-badge';
import { ConfidenceBar } from '@/components/shared/confidence-bar';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { AppRecord } from '@/features/apps/data/apps';
import { getCategoryLabel } from '@/features/categories/data/categories';

export function AlternativeRow({ app }: { app: AppRecord }) {
  return (
    <Link
      href={`/apps/${app.slug}`}
      className='group/alt block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
    >
      <Card className='w-full transition-colors group-hover/alt:bg-muted/30 group-hover/alt:ring-ring/50'>
        <div className='flex flex-col gap-4 p-4 md:flex-row md:items-center md:gap-6'>
          <div className='flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-center md:gap-3'>
            <div className='flex min-w-0 flex-col gap-1 md:w-56 md:shrink-0'>
              <span className='flex items-center gap-2 font-medium'>
                {app.name}
                <span className='font-normal text-muted-foreground'>
                  {getCategoryLabel(app.category)}
                </span>
              </span>
              <span className='truncate text-sm text-muted-foreground'>{app.tagline}</span>
            </div>
            <div className='flex w-full items-center gap-2 md:w-56 md:shrink-0'>
              <ConfidenceBar value={app.confidence} className='flex-1' />
              <span className='w-9 text-right text-xs text-muted-foreground tabular-nums'>
                {app.confidence}%
              </span>
            </div>
          </div>

          <div className='flex items-center justify-between gap-4 md:gap-6'>
            <span className='text-sm text-muted-foreground'>{app.pricing}</span>
            <VerdictBadge verdict={app.verdict} />
            <Separator orientation='vertical' className='hidden h-4 data-vertical:self-center md:block' />
            <Icons.chevronRight className='size-4 text-muted-foreground transition-transform group-hover/alt:translate-x-0.5 group-hover/alt:text-foreground' />
          </div>
        </div>
      </Card>
    </Link>
  );
}
import Link from 'next/link';

import { Icons } from '@/components/icons';
import { ConfidenceBar } from '@/components/shared/confidence-bar';
import { VerdictBadge } from '@/components/shared/verdict-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { formatVotes } from '@/lib/api/format';
import type { AppRecord } from '@/lib/api/types';
import { cn } from '@/lib/utils';

export function AppCard({ app, className }: { app: AppRecord; className?: string }) {
  return (
    <Link
      href={`/apps/${app.slug}`}
      className='group/app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
    >
      <Card className='flex h-full flex-col transition-colors group-hover/app:ring-ring/50 group-hover/app:bg-muted/30'>
        <CardHeader>
          <CardTitle className='flex items-start justify-between gap-2'>
            <span className='truncate'>{app.name}</span>
            <span className='shrink-0 text-xs font-normal text-muted-foreground tabular-nums'>
              {app.pricing}
            </span>
          </CardTitle>
          <CardDescription className='line-clamp-2'>{app.tagline}</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-1 flex-col justify-end gap-2.5'>
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <span>{formatVotes(app.voteCount)} votes</span>
            <span className='text-foreground/20'>·</span>
            <span className='truncate capitalize'>{app.category}</span>
          </div>
          <div className='flex items-center gap-2'>
            <ConfidenceBar value={app.confidence} className='flex-1' />
            <span className='w-8 text-right text-xs text-muted-foreground tabular-nums'>
              {app.confidence}%
            </span>
          </div>
        </CardContent>
        <CardFooter className={cn('justify-between')}>
          <VerdictBadge verdict={app.verdict} />
          <span className='inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover/app:text-foreground'>
            Details
            <Icons.arrowRight className='size-3.5 transition-transform group-hover/app:translate-x-0.5' />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
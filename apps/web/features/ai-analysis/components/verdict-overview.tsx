import { Icons } from '@/components/icons';
import { ConfidenceBar } from '@/components/shared/confidence-bar';
import { VerdictBadge } from '@/components/shared/verdict-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { AppRecord } from '@/lib/api/types';
import { formatVotes } from '@/lib/api/format';

export function VerdictOverview({ app }: { app: AppRecord }) {
  return (
    <Card className='h-fit lg:sticky lg:top-20'>
      <CardHeader>
        <CardTitle className='text-sm font-medium tracking-wide text-muted-foreground uppercase'>
          Clone verdict
        </CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <div className='flex items-center justify-between gap-3'>
          <VerdictBadge verdict={app.verdict} className='h-7 px-3 text-sm [&>svg]:size-4' />
          <span className='text-sm text-muted-foreground'>
            {formatVotes(app.voteCount)} votes
          </span>
        </div>

        <div className='flex flex-col gap-2'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Confidence</span>
            <span className='font-medium tabular-nums'>{app.confidence}%</span>
          </div>
          <ConfidenceBar value={app.confidence} />
          <p className='text-xs text-muted-foreground'>
            How confident we are in this verdict, based on the product&apos;s moat, model
            dependency, and distribution.
          </p>
        </div>

        <Separator />

        <div className='flex flex-col gap-1'>
          <span className='inline-flex items-center gap-1.5 text-sm font-medium'>
            <span className='flex size-5 items-center justify-center rounded-md bg-muted text-muted-foreground'>
              <Icons.clock className='size-3' />
            </span>
            Time to build
          </span>
          <p className='text-sm text-muted-foreground'>{app.diyTimeEstimate}</p>
        </div>
      </CardContent>
      <CardDescription className='px-6 pb-6 text-xs'>Estimates assume one focused engineer.</CardDescription>
    </Card>
  );
}
import Link from 'next/link';

import { Icons } from '@/components/icons';
import type { OpportunityRecord } from '@/lib/api/opportunities';
import { cn } from '@/lib/utils';

import { ReportLabel } from './report-label';

const LEVEL_STYLES: Record<string, string> = {
  HIGH: 'text-emerald-600 dark:text-emerald-400',
  MEDIUM: 'text-amber-600 dark:text-amber-400',
  LOW: 'text-muted-foreground'
};

function Signal({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <span className='inline-flex items-baseline gap-2'>
      <span className={cn('font-mono text-sm font-bold text-foreground', className)}>{value}</span>
      <span className='font-mono text-[11px] uppercase tracking-widest text-muted-foreground'>
        {label}
      </span>
    </span>
  );
}

/**
 * BUILD OPPORTUNITY section on the app-detail report. Every value comes from the
 * same evidence-based opportunity profile as /opportunities — nothing is invented
 * here, and missing signals render as "n/a".
 */
export function ReportOpportunity({ opportunity }: { opportunity: OpportunityRecord }) {
  const market = opportunity.market.direction
    ? `${opportunity.market.direction.charAt(0)}${opportunity.market.direction.slice(1).toLowerCase()}`
    : 'n/a';

  return (
    <section className='flex flex-col gap-3'>
      <div className='flex items-center gap-3'>
        <ReportLabel>build opportunity</ReportLabel>
        <span
          className={cn(
            'font-mono text-[11px] font-bold uppercase tracking-widest',
            LEVEL_STYLES[opportunity.opportunityLevel]
          )}
        >
          {opportunity.opportunityLevel}
        </span>
      </div>

      <div className='flex flex-wrap items-center gap-x-6 gap-y-2'>
        <Signal label='clone verdict' value={opportunity.signals.cloneability} />
        <Signal label='build time' value={opportunity.signals.buildTime} />
        <Signal
          label='market'
          value={market}
          className={cn(
            opportunity.market.direction === 'RISING' && 'text-emerald-600 dark:text-emerald-400',
            opportunity.market.direction === 'FALLING' && 'text-red-500'
          )}
        />
        <Signal
          label='est. cost'
          value={
            opportunity.estimatedCost
              ? `$${opportunity.estimatedCost.min}–${opportunity.estimatedCost.max}/mo`
              : 'n/a'
          }
        />
        <Signal label='open source' value={opportunity.signals.openSource} />
      </div>

      <Link
        href='/opportunities'
        className='mt-1 inline-flex w-fit items-center gap-1 font-mono text-[12px] font-semibold text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400'
      >
        Explore opportunities
        <Icons.arrowRight className='size-3' />
      </Link>
    </section>
  );
}

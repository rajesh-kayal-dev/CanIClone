import Link from 'next/link';

import { Icons } from '@/components/icons';
import { MicroGlyph } from '@/components/ui/micro-glyph';
import { humanizeSlug } from '@/lib/api/format';
import type { OpportunityRecord } from '@/lib/api/opportunities';
import { cn } from '@/lib/utils';

import { AppIcon } from '@/features/app-report/components/app-icon';
import { VerdictChip } from '@/features/app-report/components/verdict-display';

const LEVEL_STYLES: Record<string, string> = {
  HIGH: 'text-emerald-600 dark:text-emerald-400',
  MEDIUM: 'text-amber-600 dark:text-amber-400',
  LOW: 'text-muted-foreground',
};

function SignalCell({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
        {label}
      </span>
      <span className={cn('font-mono text-[12px] text-foreground', className)}>{value}</span>
    </div>
  );
}

function officialUrl(domain: string | null): string | undefined {
  if (!domain) return undefined;
  return domain.startsWith('http') ? domain : `https://${domain}`;
}

export function OpportunityRow({
  opportunity,
  rank,
}: {
  opportunity: OpportunityRecord;
  rank: number;
}) {
  const marketLabel = opportunity.market.direction
    ? `${opportunity.market.direction.charAt(0)}${opportunity.market.direction.slice(1).toLowerCase()}`
    : 'no signal';

  return (
    <article className='border-b border-border/60 py-4 last:border-b-0'>
      <Link
        href={`/apps/${encodeURIComponent(opportunity.slug)}`}
        prefetch={false}
        className='flex flex-col gap-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex-row md:items-start'
      >
        <div className='flex min-w-0 flex-1 items-start gap-3'>
          <span className='mt-0.5 w-6 shrink-0 text-right font-mono text-[13px] text-muted-foreground'>
            {String(rank).padStart(2, '0')}
          </span>
          <AppIcon
            name={opportunity.name}
            officialUrl={officialUrl(opportunity.domain)}
            className='size-8 text-[10px]'
          />
          <div className='min-w-0'>
            <div className='font-mono text-sm font-semibold text-foreground underline-offset-4 group-hover:underline'>
              {opportunity.name}
            </div>
            <div className='flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground'>
              <MicroGlyph name={opportunity.category} className='size-3' />
              {humanizeSlug(opportunity.category)}
            </div>
          </div>
        </div>

        <div className='grid flex-none grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 md:grid-cols-5 md:gap-x-5'>
          <SignalCell label='verdict' value={<VerdictChip verdict={opportunity.verdict} />} />
          <SignalCell
            label='build'
            value={
              <>
                {opportunity.difficulty ?? 'n/a'}
                {opportunity.buildTime && (
                  <span className='block text-[11px] text-muted-foreground'>
                    {opportunity.buildTime}
                  </span>
                )}
              </>
            }
          />
          <SignalCell
            label='market'
            value={
              <span
                className={cn(
                  opportunity.market.direction === 'RISING' && 'text-emerald-600 dark:text-emerald-400',
                  opportunity.market.direction === 'FALLING' && 'text-red-500',
                )}
              >
                {marketLabel}
              </span>
            }
          />
          <SignalCell
            label='est. cost'
            value={
              opportunity.estimatedCost
                ? `$${opportunity.estimatedCost.min}–${opportunity.estimatedCost.max}/mo`
                : 'n/a'
            }
          />
          <SignalCell label='open source' value={`${opportunity.openSourceAlternatives} alt`} />
        </div>
      </Link>

      <details className='group mt-3 md:pl-9'>
        <summary className='inline-flex cursor-pointer list-none items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground'>
          <Icons.chevronRight className='size-3 transition-transform group-open:rotate-90' />
          why this opportunity?
          <span className={cn('ml-2 font-bold uppercase', LEVEL_STYLES[opportunity.opportunityLevel])}>
            {opportunity.opportunityLevel}
          </span>
        </summary>
        <ul className='mt-2 flex flex-col gap-1 font-mono text-[12px] text-muted-foreground'>
          <li>· clone verdict: {opportunity.signals.cloneability}</li>
          <li>· estimated build time: {opportunity.signals.buildTime}</li>
          <li>· market signal: {opportunity.signals.market}</li>
          <li>· estimated operating cost: {opportunity.signals.cost}</li>
          <li>· open-source building blocks: {opportunity.openSourceAlternatives}</li>
        </ul>
        <Link
          href={`/apps/${encodeURIComponent(opportunity.slug)}`}
          prefetch={false}
          className='mt-2 inline-flex items-center gap-1 font-mono text-[12px] font-semibold text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400'
        >
          view full analysis
          <Icons.arrowRight className='size-3' />
        </Link>
      </details>
    </article>
  );
}

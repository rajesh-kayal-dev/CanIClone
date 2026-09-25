import { cn } from '@/lib/utils';
import type { Verdict } from '@/lib/api/types';

export const VERDICT_META: Record<Verdict, { suffix: string; pill: string; chip: string }> = {
  YES: {
    suffix: 'clone it',
    pill: 'bg-emerald-500 text-emerald-950',
    chip: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
  },
  KINDA: {
    suffix: 'hard way',
    pill: 'bg-amber-400 text-amber-950',
    chip: 'bg-amber-400/15 text-amber-600 dark:text-amber-400'
  },
  NO: {
    suffix: "don't bother",
    pill: 'bg-red-500 text-red-50',
    chip: 'bg-red-500/15 text-red-600 dark:text-red-400'
  }
};

export function VerdictPill({ verdict, className }: { verdict: Verdict; className?: string }) {
  const meta = VERDICT_META[verdict];
  return (
    <span
      data-verdict={verdict}
      className={cn(
        'inline-flex items-center rounded-md px-4 py-2 font-mono text-sm font-bold tracking-tight whitespace-nowrap',
        meta.pill,
        className
      )}
    >
      {verdict === 'NO' ? 'NOT REALLY' : verdict}
      <span className='mx-1.5 opacity-60'>·</span>
      {meta.suffix}
    </span>
  );
}

export function VerdictChip({ verdict, className }: { verdict: Verdict; className?: string }) {
  const meta = VERDICT_META[verdict];
  return (
    <span
      data-verdict={verdict}
      className={cn(
        'inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-tight whitespace-nowrap',
        meta.chip,
        className
      )}
    >
      {verdict === 'NO' ? 'NOT REALLY' : verdict}
    </span>
  );
}

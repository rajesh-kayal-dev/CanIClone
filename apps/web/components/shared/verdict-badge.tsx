import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Verdict } from '@/features/apps/data/apps';

const VERDICT_STYLES: Record<Verdict, string> = {
  YES: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:bg-emerald-400/10',
  KINDA: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:bg-amber-400/10',
  NO: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:bg-red-400/10'
};

const VERDICT_ICONS: Record<Verdict, React.ComponentType<{ className?: string }>> = {
  YES: Icons.circleCheck,
  KINDA: Icons.trendingUp,
  NO: Icons.xCircle
};

const VERDICT_LABEL: Record<Verdict, string> = {
  YES: 'YES — Cloneable',
  KINDA: 'KINDA — Hard way',
  NO: 'NO — Don\'t try it'
};

export function VerdictBadge({
  verdict,
  className
}: {
  verdict: Verdict;
  className?: string;
}) {
  const Icon = VERDICT_ICONS[verdict];
  return (
    <Badge
      variant='secondary'
      data-verdict={verdict}
      className={cn(
        'h-6 gap-1 rounded-full px-2 font-semibold tracking-tight [&>svg]:size-3.5',
        VERDICT_STYLES[verdict],
        className
      )}
    >
      <Icon />
      {verdict}
    </Badge>
  );
}

export function VerdictLabel({ verdict }: { verdict: Verdict }) {
  return <span className='text-sm text-muted-foreground'>{VERDICT_LABEL[verdict]}</span>;
}
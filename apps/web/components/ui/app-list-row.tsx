import type { AppRecord } from '@/lib/api/types';
import { AppIcon } from '@/features/app-report/components/app-icon';
import { cn } from '@/lib/utils';

interface AppListRowProps {
  app: AppRecord;
  rank: number;
}

export function AppListRow({ app, rank }: AppListRowProps) {
  const replacedCount = app.alternativeCount ?? app.alternatives.length;

  return (
    <div className='flex items-center justify-between border-b border-border px-2 py-[6px] text-sm transition-colors hover:bg-muted/30'>
      <div className='flex min-w-0 flex-1 items-center gap-3'>
        <span className='w-6 text-right font-mono text-[13px] text-muted-foreground'>
          {String(rank).padStart(2, '0')}
        </span>
        <div className='flex min-w-0 flex-1 items-center gap-3'>
          <AppIcon
            name={app.name}
            officialUrl={app.officialUrl}
            className='size-6 rounded-md'
          />
          <span className='truncate text-[15px] font-medium'>{app.name}</span>
        </div>
      </div>

      <div className='hidden flex-1 items-center gap-4 sm:flex sm:justify-between'>
        <div className='flex min-w-[140px] items-center'>
          <span className='truncate font-mono text-[10px] uppercase text-muted-foreground'>
            {app.category.replace(/-/g, ' ')}
          </span>
        </div>
        <span className='w-20 truncate font-mono text-[11px] text-foreground'>
          {app.pricing}
        </span>
        <div className='w-24'>
          <span
            className={cn(
              'whitespace-nowrap rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase',
              app.verdict === 'YES' && 'bg-green-500/10 text-green-600',
              app.verdict === 'KINDA' && 'bg-yellow-500/10 text-yellow-600',
              app.verdict === 'NO' && 'bg-red-500/10 text-red-600',
            )}
          >
            {app.verdict}
          </span>
        </div>
        <span className='w-12 text-right font-mono text-[12px] text-foreground'>
          {replacedCount}
        </span>
      </div>
    </div>
  );
}

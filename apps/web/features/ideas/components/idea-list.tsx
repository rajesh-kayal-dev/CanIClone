import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { IdeaSummary } from '@/lib/api/ideas';

export type IdeaSaveState = 'saved' | 'saving' | 'error';

function formatIdeaDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function IdeaSaveIndicator({
  state,
  error,
  onRetry,
}: {
  state: IdeaSaveState;
  error: string | null;
  onRetry: () => void;
}) {
  if (state === 'saving') {
    return (
      <span className='inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground'>
        <Icons.spinner className='size-3 animate-spin' />
        Saving...
      </span>
    );
  }

  if (state === 'error') {
    return (
      <span className='inline-flex items-center gap-1.5 font-mono text-[10px] text-red-600 dark:text-red-400'>
        <Icons.warning className='size-3' />
        Save failed
        <button type='button' onClick={onRetry} className='underline underline-offset-2'>
          Retry
        </button>
        {error && <span className='sr-only'>{error}</span>}
      </span>
    );
  }

  return (
    <span className='inline-flex items-center gap-1.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400'>
      <Icons.check className='size-3' />
      Saved
    </span>
  );
}

export function IdeaListItem({
  idea,
  selected,
  onSelect,
}: {
  idea: IdeaSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  const title = idea.title?.trim() || 'Untitled idea';
  const description = idea.description?.trim() || 'No description yet';

  return (
    <button
      type='button'
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'w-full cursor-pointer rounded-lg border px-3 py-3 text-left transition-colors',
        selected
          ? 'border-primary/40 bg-primary/10'
          : 'border-transparent hover:border-border hover:bg-muted/50',
      )}
    >
      <div className='flex items-start justify-between gap-2'>
        <span className='truncate text-sm font-medium'>{title}</span>
        <span className='shrink-0 font-mono text-[9px] text-muted-foreground'>
          {formatIdeaDate(idea.updatedAt)}
        </span>
      </div>
      <p className='mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground'>{description}</p>
      <span className='mt-2 inline-flex font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80'>
        {idea.status === 'DRAFT' ? 'Draft' : 'Saved idea'}
      </span>
    </button>
  );
}

import type { ComponentType } from 'react';

import { Icons } from '@/components/icons';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AppAIMessage } from '@/lib/api/app-assistant';

export function AppAssistantMessageBubble({ message }: { message: AppAIMessage }) {
  const user = message.role === 'user';
  return (
    <div className={cn('flex max-w-[92%] flex-col gap-1', user ? 'ml-auto items-end' : 'items-start')}>
      <span className='font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>
        {user ? 'You' : 'AI assistant'}
      </span>
      <div
        className={cn(
          'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          user
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm border border-border/70 bg-muted/30 text-foreground',
        )}
      >
        {user ? (
          <div className='whitespace-pre-wrap break-words'>{message.content}</div>
        ) : (
          <MarkdownContent content={message.content} />
        )}
      </div>
    </div>
  );
}

export function AssistantProgressCard({
  message,
  onStop,
}: {
  message: string;
  onStop?: () => void;
}) {
  return (
    <div
      role='status'
      aria-live='polite'
      className='flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 font-mono text-[11px] text-muted-foreground'
    >
      <Icons.spinner className='size-3.5 animate-spin text-primary' />
      <span className='min-w-0 flex-1'>{message}</span>
      {onStop && (
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='h-7 px-2 text-[10px]'
          onClick={onStop}
        >
          Stop
        </Button>
      )}
    </div>
  );
}

export function AssistantSuggestionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className='flex min-h-16 cursor-pointer items-start gap-2 rounded-lg border border-border bg-background/60 p-2.5 text-left text-xs transition-colors hover:border-primary/30 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50'
    >
      <Icon className='mt-0.5 size-3.5 shrink-0 text-primary' />
      <span>{label}</span>
    </button>
  );
}

export function AssistantSkeletonLine() {
  return <div className='h-16 animate-pulse rounded-xl bg-muted/60' />;
}

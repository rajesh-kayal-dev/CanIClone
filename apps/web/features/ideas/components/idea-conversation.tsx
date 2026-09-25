import { MarkdownContent } from '@/components/shared/markdown-content';
import { cn } from '@/lib/utils';
import type { IdeaMessage } from '@/lib/api/ideas';

export function IdeaMessageBubble({ message }: { message: IdeaMessage }) {
  if (!message.content.trim()) return null;
  const user = message.role === 'user';
  const assistantLabel = message.kind === 'analysis' ? 'Initial analysis' : 'Idea assistant';

  return (
    <div className={cn('flex max-w-[88%] flex-col gap-1', user ? 'ml-auto items-end' : 'items-start')}>
      <span className='font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>
        {user ? 'You' : assistantLabel}
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

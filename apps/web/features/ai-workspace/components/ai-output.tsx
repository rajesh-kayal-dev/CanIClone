'use client';

import { Icons } from '@/components/icons';
import { CopyButton } from '@/components/shared/copy-button';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { Button } from '@/components/ui/button';
import type { IdeaResearchHit } from '@/lib/api/ideas';

function OutputFrame({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className='rounded-xl border border-border/70 bg-muted/20 p-4'>
      <div className='mb-3 flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h3 className='text-sm font-semibold'>{title}</h3>
          <p className='mt-1 text-xs text-muted-foreground'>{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function TextDocument({ content }: { content: string }) {
  return (
    <div className='max-h-[30rem] overflow-y-auto rounded-lg border border-border/60 bg-background/60 p-3'>
      <pre className='whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-foreground/90'>
        {content}
      </pre>
    </div>
  );
}

function sourceDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '') || 'Source';
  } catch {
    return 'Source';
  }
}

function compactSourceExcerpt(description: string): string {
  const cleaned = description
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>`~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= 140) return cleaned;
  return `${cleaned.slice(0, 137).replace(/\s+\S*$/, '')}…`;
}

export function ResearchOutput({
  analysis,
  hits,
}: {
  analysis: string;
  hits: IdeaResearchHit[];
}) {
  return (
    <OutputFrame
      title='Research summary'
      description='Conclusions and useful findings first. Sources are kept separate below.'
    >
      <div className='flex flex-col gap-4'>
        <MarkdownContent content={analysis || 'No research summary was returned.'} />

        {hits.length > 0 && (
          <div className='flex flex-col gap-2 border-t border-border/60 pt-4'>
            <div className='flex items-center justify-between gap-3'>
              <h4 className='text-sm font-semibold text-foreground'>Sources</h4>
              <span className='font-mono text-[10px] uppercase tracking-wider text-muted-foreground'>
                {hits.length} {hits.length === 1 ? 'source' : 'sources'}
              </span>
            </div>
            <div className='grid gap-2'>
              {hits.map((hit) => {
                const domain = sourceDomain(hit.url);
                const excerpt = compactSourceExcerpt(hit.description);
                return (
                  <div
                    key={`${hit.url}-${hit.title}`}
                    className='overflow-hidden rounded-lg border border-border/60 bg-background/40'
                  >
                    <a
                      href={hit.url}
                      target='_blank'
                      rel='noreferrer'
                      className='block px-3 py-2.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
                    >
                      <span className='block truncate text-xs font-semibold text-foreground'>
                        {hit.title || domain}
                      </span>
                      <span className='mt-1 block truncate font-mono text-[10px] text-primary/80'>
                        {domain}
                      </span>
                    </a>
                    {excerpt && (
                      <p className='line-clamp-2 border-t border-border/50 px-3 py-2 text-[11px] leading-4 text-muted-foreground'>
                        {excerpt}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </OutputFrame>
  );
}

export function PromptOutput({ content }: { content: string }) {
  return (
    <OutputFrame
      title='Build prompt'
      description='A development prompt generated from the idea, conversation, and research.'
      action={<CopyButton text={content} label='Copy' />}
    >
      <TextDocument content={content} />
    </OutputFrame>
  );
}

function downloadMvp(content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'MVP.md';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function MvpOutput({ content }: { content: string }) {
  return (
    <OutputFrame
      title='MVP.md'
      description='A buildable MVP specification generated by the AI workspace.'
      action={
        <div className='flex flex-wrap items-center gap-2'>
          <CopyButton text={content} label='Copy' />
          <Button type='button' variant='outline' size='sm' onClick={() => downloadMvp(content)}>
            <Icons.page className='size-3.5' />
            Download MVP.md
          </Button>
        </div>
      }
    >
      <TextDocument content={content} />
    </OutputFrame>
  );
}

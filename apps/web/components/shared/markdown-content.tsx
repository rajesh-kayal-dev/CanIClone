import { Fragment, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

const INLINE_PATTERN = /(`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|\[[^\]\n]+\]\([^)\s]+\)|https?:\/\/[^\s<>()]+)/g;

function isSafeHref(href: string): boolean {
  if (href.startsWith('/') || href.startsWith('#')) return true;
  try {
    const url = new URL(href);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function compactLinkLabel(href: string): string {
  try {
    const url = new URL(href);
    return url.hostname.replace(/^www\./i, '') || href;
  } catch {
    return href.replace(/^https?:\/\//i, '').split('/')[0] || 'Source';
  }
}

function MarkdownLink({ href, children }: { href: string; children: ReactNode }) {
  if (!isSafeHref(href)) return <>{children}</>;
  const external = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className='font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary'
    >
      {children}
    </a>
  );
}

function renderInline(text: string): ReactNode[] {
  return text.split(INLINE_PATTERN).filter(Boolean).map((part, index) => {
    const key = `${index}-${part}`;

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={key}
          className='rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground'
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return (
        <strong key={key} className='font-semibold text-foreground'>
          {part.slice(2, -2)}
        </strong>
      );
    }

    const markdownLink = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (markdownLink) {
      return (
        <MarkdownLink key={key} href={markdownLink[2]}>
          {markdownLink[1]}
        </MarkdownLink>
      );
    }

    if (/^https?:\/\//i.test(part)) {
      const href = part.replace(/[),.;]+$/, '');
      return (
        <MarkdownLink key={key} href={href}>
          {compactLinkLabel(href)}
        </MarkdownLink>
      );
    }

    return <Fragment key={key}>{part}</Fragment>;
  });
}

function heading(level: number, text: string): ReactNode {
  const content = renderInline(text);
  const className = 'mt-1 scroll-mt-20 font-semibold text-foreground first:mt-0';

  if (level === 1) return <h3 className={cn(className, 'text-base')}>{content}</h3>;
  if (level === 2) return <h4 className={cn(className, 'text-[0.95rem]')}>{content}</h4>;
  if (level === 3) return <h5 className={cn(className, 'text-sm')}>{content}</h5>;
  return <h6 className={cn(className, 'text-xs uppercase tracking-wide text-muted-foreground')}>{content}</h6>;
}

function startsBlock(line: string): boolean {
  return /^\s*(?:#{1,6}\s|```|[-*+]\s+|\d+[.)]\s+|>\s?|(?:-{3,}|\*{3,}|_{3,})\s*$)/.test(
    line,
  );
}

function parseMarkdown(content: string): ReactNode[] {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^\s*```([\w+-]*)\s*$/);
    if (fence) {
      const language = fence[1] || '';
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <pre
          key={`code-${index}`}
          className='max-w-full overflow-x-auto rounded-lg border border-border/70 bg-muted/40 p-3 text-xs leading-5'
        >
          <code className={language ? `language-${language}` : undefined}>{code.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    const headingMatch = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (headingMatch) {
      blocks.push(
        <Fragment key={`heading-${index}`}>{heading(headingMatch[1].length, headingMatch[2])}</Fragment>,
      );
      index += 1;
      continue;
    }

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push(<hr key={`rule-${index}`} className='border-border/70' />);
      index += 1;
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*+]\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ul key={`list-${index}`} className='list-disc space-y-1.5 pl-5 marker:text-muted-foreground'>
          {items.map((item, itemIndex) => (
            <li key={`${itemIndex}-${item}`} className='pl-0.5'>
              {renderInline(item)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    const orderedMatch = line.match(/^\s*(\d+)[.)]\s+(.+)/);
    if (orderedMatch) {
      const start = Number(orderedMatch[1]);
      const items: string[] = [orderedMatch[2]];
      index += 1;
      while (index < lines.length) {
        const item = lines[index].match(/^\s*\d+[.)]\s+(.+)/);
        if (!item) break;
        items.push(item[1]);
        index += 1;
      }
      blocks.push(
        <ol
          key={`ordered-${index}`}
          start={start}
          className='list-decimal space-y-1.5 pl-5 marker:font-medium marker:text-muted-foreground'
        >
          {items.map((item, itemIndex) => (
            <li key={`${itemIndex}-${item}`} className='pl-0.5'>
              {renderInline(item)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      blocks.push(
        <blockquote
          key={`quote-${index}`}
          className='border-l-2 border-primary/40 pl-3 text-muted-foreground'
        >
          {renderInline(quote.join(' '))}
        </blockquote>,
      );
      continue;
    }

    const paragraph: string[] = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !startsBlock(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p key={`paragraph-${index}`} className='whitespace-pre-wrap leading-6 text-foreground/90'>
        {renderInline(paragraph.join(' '))}
      </p>,
    );
  }

  return blocks;
}

export function MarkdownContent({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn('min-w-0 space-y-3 break-words text-sm leading-6', className)}>
      {parseMarkdown(content)}
    </div>
  );
}

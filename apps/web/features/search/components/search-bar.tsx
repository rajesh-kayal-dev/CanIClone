'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import { Icons } from '@/components/icons';
import { AppIcon } from '@/features/app-report/components/app-icon';
import { MicroGlyph } from '@/components/ui/micro-glyph';
import { searchSuggestions } from '@/lib/api/apps';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  size?: 'lg' | 'md';
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  onSubmit?: (value: string) => void;
}

export function SearchBar({
  size = 'md',
  defaultValue = '',
  placeholder = 'search an app...',
  className,
  onSubmit,
}: SearchBarProps) {
  const router = useRouter();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const abortRef = useRef<AbortController | null>(null);
  const requestRef = useRef(0);
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Awaited<ReturnType<typeof searchSuggestions>>>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const large = size === 'lg';

  useEffect(() => {
    const value = query.trim();
    abortRef.current?.abort();

    if (!value) {
      const clear = window.setTimeout(() => {
        setSuggestions([]);
        setLoading(false);
        setOpen(false);
        setActiveIndex(-1);
      }, 0);
      return () => window.clearTimeout(clear);
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestRef.current;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setOpen(true);
      searchSuggestions(value, controller.signal)
        .then((results) => {
          if (controller.signal.aborted || requestId !== requestRef.current) return;
          setSuggestions(results.slice(0, 5));
          setActiveIndex(-1);
          setOpen(true);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted || requestId !== requestRef.current) return;
          if (!(error instanceof DOMException && error.name === 'AbortError')) {
            setSuggestions([]);
            setOpen(true);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted && requestId === requestRef.current) {
            setLoading(false);
          }
        });
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (activeIndex < 0) return;
    itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function openSuggestion(slug: string) {
    setOpen(false);
    setActiveIndex(-1);
    router.push(`/apps/${encodeURIComponent(slug)}`);
  }

  function submitSearch(event?: { preventDefault: () => void }) {
    event?.preventDefault();
    const value = query.trim();
    if (!value) return;
    setOpen(false);
    if (onSubmit) onSubmit(value);
    else router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp' && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    } else if (event.key === 'Enter') {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        event.preventDefault();
        openSuggestion(suggestions[activeIndex].slug);
      } else {
        submitSearch(event);
      }
    }
  }

  const cleanPlaceholder = placeholder.replace(/^>\s*/, '');
  const showSuggestions = open && query.trim().length > 0;

  return (
    <form
      action='/search'
      method='get'
      role='search'
      onSubmit={submitSearch}
      className={cn('relative w-full flex', className)}
    >
      <div
        className={cn(
          'relative flex w-full items-center rounded-md border border-border bg-card overflow-visible shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20',
          large ? 'h-14 px-4 gap-3' : 'h-10 px-3 gap-2',
        )}
      >
        <MicroGlyph
          name='search'
          className={cn('text-muted-foreground/50', large ? 'w-3.5 h-3.5' : 'w-3 h-3')}
        />
        <input
          ref={inputRef}
          type='text'
          name='q'
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder={cleanPlaceholder}
          aria-label='Search apps'
          role='combobox'
          aria-haspopup='listbox'
          aria-autocomplete='list'
          aria-controls={listboxId}
          aria-expanded={showSuggestions}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-item-${activeIndex}` : undefined
          }
          autoComplete='off'
          className={cn(
            'w-full bg-transparent font-mono outline-none placeholder:text-muted-foreground/60',
            large ? 'text-sm' : 'text-[11px]',
          )}
        />
        {loading && (
          <Icons.spinner
            aria-label='Searching'
            className='size-3.5 shrink-0 animate-spin text-muted-foreground'
          />
        )}
        <button
          type='submit'
          aria-label='Submit search'
          className='flex h-full items-center justify-center px-2 text-muted-foreground transition-colors hover:text-primary'
        >
          <div className={cn('bg-primary', large ? 'h-5 w-2' : 'h-4 w-1.5')} />
        </button>

        {showSuggestions && (
          <div
            id={listboxId}
            role='listbox'
            aria-label='Search suggestions'
            className='absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 max-h-72 overflow-y-auto rounded-md border border-border bg-popover p-1 text-left shadow-xl'
          >
            {loading && suggestions.length === 0 ? (
              <div className='px-3 py-3 font-mono text-[11px] text-muted-foreground'>
                Searching the directory…
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((app, index) => (
                <Link
                  key={app.slug}
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  id={`${listboxId}-item-${index}`}
                  href={`/apps/${encodeURIComponent(app.slug)}`}
                  prefetch={false}
                  role='option'
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={(event) => {
                    event.preventDefault();
                    openSuggestion(app.slug);
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded px-3 py-2 transition-colors',
                    index === activeIndex ? 'bg-muted text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <AppIcon
                    name={app.name}
                    officialUrl={app.officialUrl}
                    className='size-7 rounded-md'
                  />
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate font-mono text-xs font-medium'>{app.name}</span>
                    <span className='block truncate text-[10px] text-muted-foreground'>
                      {app.category.replace(/-/g, ' ')}
                    </span>
                  </span>
                  <Icons.arrowRight className='size-3 shrink-0 opacity-50' />
                </Link>
              ))
            ) : (
              <div className='px-3 py-3 font-mono text-[11px] text-muted-foreground'>
                No matching apps yet.
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}

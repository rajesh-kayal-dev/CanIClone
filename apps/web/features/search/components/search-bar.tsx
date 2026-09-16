
import { cn } from '@/lib/utils';
import { MicroGlyph } from '@/components/ui/micro-glyph';

export function SearchBar({
  size = 'md',
  defaultValue,
  placeholder = 'search an app...',
  className
}: {
  size?: 'lg' | 'md';
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  const large = size === 'lg';
  // Remove starting > from placeholder if passed
  const cleanPlaceholder = placeholder.replace(/^>\s*/, '');
  
  return (
    <form action='/search' method='get' role='search' className={cn('w-full flex', className)}>
      <div className={cn(
        'relative flex w-full items-center rounded-md border border-border bg-card overflow-hidden shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20',
        large ? 'h-14 px-4 gap-3' : 'h-10 px-3 gap-2'
      )}>
        <MicroGlyph name='search' className={cn('text-muted-foreground/50', large ? 'w-3.5 h-3.5' : 'w-3 h-3')} />
        <input
          type='text'
          name='q'
          defaultValue={defaultValue}
          placeholder={cleanPlaceholder}
          aria-label='Search apps'
          autoComplete='off'
          className={cn(
            'w-full bg-transparent font-mono outline-none placeholder:text-muted-foreground/60',
            large ? 'text-sm' : 'text-[11px]'
          )}
        />
        <button
          type='submit'
          className='flex h-full items-center justify-center px-2 text-muted-foreground hover:text-primary transition-colors'
        >
          <div className={cn('bg-primary', large ? 'h-5 w-2' : 'h-4 w-1.5')} />
        </button>
      </div>
    </form>
  );
}
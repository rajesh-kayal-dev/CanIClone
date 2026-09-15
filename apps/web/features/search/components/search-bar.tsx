import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function SearchBar({
  size = 'md',
  defaultValue,
  placeholder = 'Search apps, agents, and tools…',
  className
}: {
  size?: 'lg' | 'md';
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  const large = size === 'lg';
  return (
    <form action='/search' method='get' role='search' className={cn('w-full', className)}>
      <div className='relative'>
        <Icons.search
          className={cn(
            'pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground',
            large ? 'size-5' : 'size-4'
          )}
        />
        <Input
          name='q'
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-label='Search apps'
          autoComplete='off'
          className={cn(
            'bg-card pr-20',
            large ? 'h-12 rounded-full pl-10 text-base shadow-sm' : 'h-9 rounded-full pl-9 md:text-sm'
          )}
        />
        <Button
          type='submit'
          size='sm'
          className={cn(
            'absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full px-3.5 font-medium',
            large && 'h-8 px-4'
          )}
        >
          Search
        </Button>
      </div>
    </form>
  );
}
import Link from 'next/link';

import { Icons } from '@/components/icons';
import { ThemeModeToggle } from '@/components/themes/theme-mode-toggle';
import { ThemeSelector } from '@/components/themes/theme-selector';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const NAV_LINKS = [
  { href: '/apps', label: 'Apps' },
  { href: '/categories', label: 'Categories' }
];

export function SiteHeader() {
  return (
    <header className='bg-background/70 sticky top-0 z-40 border-b border-border/60 backdrop-blur-md'>
      <div className='mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6'>
        <div className='flex min-w-0 items-center gap-6'>
          <Link
            href='/'
            className='flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          >
            <span className='flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground [&>svg]:size-4'>
              <Icons.logo className='size-4' />
            </span>
            <span className='text-[0.95rem] font-semibold tracking-tight'>CanIClone</span>
          </Link>
          <nav className='hidden items-center gap-1 sm:flex' aria-label='Primary'>
            {NAV_LINKS.map((link) => (
              <Button key={link.href} variant='ghost' size='sm' nativeButton={false} render={<Link href={link.href} />}>
                {link.label}
              </Button>
            ))}
          </nav>
        </div>

        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            size='icon'
            className='lg:hidden'
            aria-label='Search'
            nativeButton={false}
            render={<Link href='/search' />}
          >
            <Icons.search />
          </Button>
          <ThemeModeToggle />
          <div className='hidden sm:block'>
            <ThemeSelector />
          </div>
          <Separator orientation='vertical' className='mx-1 h-4 data-vertical:self-center' />
          <Button variant='outline' size='sm' className='hidden sm:inline-flex' nativeButton={false} render={<Link href='/search' />}>
            <Icons.search />
            Search
          </Button>
        </div>
      </div>
    </header>
  );
}
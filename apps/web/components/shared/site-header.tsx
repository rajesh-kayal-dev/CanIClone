'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Icons } from '@/components/icons';
import { ThemeModeToggle } from '@/components/themes/theme-mode-toggle';
import { ThemeSelector } from '@/components/themes/theme-selector';
import { SearchBar } from '@/features/search/components/search-bar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

const NAV_LINKS = [
  { href: '/apps', label: 'apps', pathPrefix: '/apps' },
  { href: '/categories', label: 'categories', pathPrefix: '/categories' },
  { href: '/opportunities', label: 'opportunities', pathPrefix: '/opportunities' },
  { href: '/market', label: 'market', pathPrefix: '/market' },
  { href: '/clone-list', label: 'clone list', pathPrefix: '/clone-list' },
];

function DecorDots() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" className="text-muted-foreground/30 fill-current">
      <circle cx="2" cy="2" r="1" />
      <circle cx="2" cy="7" r="1" />
      <circle cx="2" cy="12" r="1" />
      
      <circle cx="8" cy="2" r="1" />
      <circle cx="8" cy="7" r="1" />
      <circle cx="8" cy="12" r="1" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className='bg-background/90 sticky top-0 z-40 border-y border-border/40 backdrop-blur-md'>
      <div className='layout-container flex h-12 items-center justify-between'>
        
        {/* Left: Logo & Navigation */}
        <div className='flex items-center gap-8 lg:gap-12'>
          <div className='flex items-center gap-4'>
            <div className="hidden sm:block">
              <DecorDots />
            </div>
            
            <Link
              href='/'
              className='flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            >
              <span className='flex size-7 items-center justify-center rounded bg-primary text-primary-foreground border-2 border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.3)]'>
                <Icons.logo className='size-4' />
              </span>
              <div className='flex items-center gap-2'>
                <span className='font-mono text-sm font-semibold tracking-tight'>caniclone</span>
                <span className='font-mono text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-sm uppercase tracking-wider hidden sm:inline-block'>
                  beta
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className='hidden md:flex items-center gap-8 font-mono text-[11px]' aria-label='Primary'>
            {NAV_LINKS.map((link, idx) => {
              const isActive = link.pathPrefix
                ? pathname === link.pathPrefix || pathname.startsWith(`${link.pathPrefix}/`)
                : pathname === link.href;
              return (
                <Link
                  key={`${link.label}-${idx}`}
                  href={link.href}
                  className={cn(
                    'relative py-3 transition-colors hover:text-foreground',
                    isActive ? 'text-foreground font-bold' : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Controls */}
        <div className='hidden md:flex items-center gap-4 font-mono text-[11px]'>
          
          {/* Search Box */}
          <SearchBar
            size='md'
            placeholder='search an app...'
            className='w-48 xl:w-56'
          />
          
          {/* GitHub Button */}
          <a 
            href='https://github.com/rajesh-kayal-dev/CanIClone.git' 
            target='_blank' 
            rel='noopener noreferrer'
            className='flex items-center gap-2 border border-border/40 rounded-md px-2.5 py-1.5 text-muted-foreground hover:text-foreground bg-muted/20 hover:bg-muted/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            aria-label='GitHub repository'
          >
            <Icons.github className='size-3.5 text-foreground' />
            GitHub
            <Icons.star className='size-3 fill-amber-500/80' />
          </a>

          {/* Theme Widget */}
          <div className='flex items-center rounded-md border border-border/40 p-0.5 bg-muted/20'>
            <div className="scale-90 origin-center">
              <ThemeModeToggle />
            </div>
            <div className="scale-90 origin-center -ml-1">
              <ThemeSelector compact />
            </div>
          </div>

          <div className="hidden sm:block ml-2">
            <DecorDots />
          </div>
        </div>

        {/* Mobile Menu */}
        <div className='flex md:hidden items-center gap-2'>
          <Link href='/search' className='text-muted-foreground p-1'>
            <Icons.search className='size-4' />
          </Link>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger render={<Button variant='ghost' size='icon' className='size-8' aria-label='Menu' />}>
              <Icons.menu className='size-4' />
            </SheetTrigger>
            <SheetContent side='right' className='w-[250px] sm:w-[300px] flex flex-col font-mono text-sm'>
              <SheetTitle className='sr-only'>Navigation Menu</SheetTitle>
              <div className='flex flex-col gap-6 mt-8'>
                <div className='flex flex-col gap-4'>
                  <span className='text-[10px] text-muted-foreground uppercase tracking-wider'>Navigation</span>
                  {NAV_LINKS.map((link, idx) => {
                    const isActive = link.pathPrefix
                      ? pathname === link.pathPrefix || pathname.startsWith(`${link.pathPrefix}/`)
                      : pathname === link.href;
                    return (
                      <Link
                        key={`${link.label}-${idx}`}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'transition-colors',
                          isActive ? 'text-foreground font-bold' : 'text-muted-foreground'
                        )}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                  <Link href='/search' onClick={() => setIsOpen(false)} className='text-muted-foreground'>search</Link>
                </div>
                
                <div className='h-px bg-border/60' />
                
                <div className='flex flex-col gap-4'>
                  <span className='text-[10px] text-muted-foreground uppercase tracking-wider'>Links</span>
                  <a 
                    href='https://github.com/rajesh-kayal-dev/CanIClone.git' 
                    target='_blank' 
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 text-muted-foreground'
                  >
                    <Icons.github className='size-4' /> GitHub
                  </a>
                </div>

                <div className='h-px bg-border/60' />
                
                <div className='flex items-center justify-between'>
                  <span className='text-[10px] text-muted-foreground uppercase tracking-wider'>Theme</span>
                  <div className='flex items-center gap-1 rounded border border-border/40 p-0.5'>
                    <ThemeModeToggle />
                    <ThemeSelector compact />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
}
import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { ThemeSelector } from '../themes/theme-selector';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';
import Link from 'next/link';

export default function Header() {
  return (
    <header className='bg-background/90 sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border px-4 backdrop-blur-md'>
      <div className='flex items-center gap-4'>
        <SidebarTrigger className='-ml-1' />
        <Link href='/' className='font-bold text-lg hidden sm:block'>CanIClone?</Link>
      </div>

      <nav className='flex items-center gap-4 font-mono text-[11px] lowercase text-muted-foreground'>
        <Link href='/apps' className='hover:text-foreground hidden sm:block'>the directory</Link>
        <Link href='/categories' className='hover:text-foreground hidden sm:block'>categories</Link>
        <Link href='/search' className='hover:text-foreground'>search</Link>
        <div className='h-4 w-px bg-border mx-1' />
        <ThemeModeToggle />
        <div className='hidden sm:block'>
          <ThemeSelector />
        </div>
      </nav>
    </header>
  );
}

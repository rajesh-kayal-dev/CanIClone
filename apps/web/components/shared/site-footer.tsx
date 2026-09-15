import Link from 'next/link';

import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';

const FOOTER_NAV = [
  { href: '/apps', label: 'Apps' },
  { href: '/categories', label: 'Categories' },
  { href: '/search', label: 'Search' }
];

export function SiteFooter() {
  return (
    <footer className='mt-16 border-t border-border/60 bg-muted/20'>
      <div className='mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]'>
        <div className='flex max-w-sm flex-col gap-3'>
          <Link
            href='/'
            className='flex w-fit shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          >
            <span className='flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground [&>svg]:size-4'>
              <Icons.logo className='size-4' />
            </span>
            <span className='text-[0.95rem] font-semibold tracking-tight'>CanIClone</span>
          </Link>
          <p className='text-sm text-muted-foreground'>
            Finding out whether you can build it — and getting the prompt to start — is hard. We do
            that for every AI product we review.
          </p>
          <div className='flex items-center gap-1'>
            <Link
              href='#'
              aria-label='GitHub'
              className='flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            >
              <Icons.github className='size-4' />
            </Link>
            <Link
              href='#'
              aria-label='X (Twitter)'
              className='flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            >
              <Icons.twitter className='size-4' />
            </Link>
          </div>
        </div>

        <nav aria-label='Browse' className='flex flex-col gap-2 text-sm'>
          <span className='mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase'>
            Directory
          </span>
          {FOOTER_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className='text-muted-foreground transition-colors hover:text-foreground'
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <nav aria-label='Learn' className='flex flex-col gap-2 text-sm'>
          <span className='mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase'>
            Learn
          </span>
          <Link href='/#how-it-works' className='text-muted-foreground transition-colors hover:text-foreground'>
            How the verdict works
          </Link>
          <Link href='/apps/example' className='text-muted-foreground transition-colors hover:text-foreground'>
            Read a sample review
          </Link>
        </nav>
      </div>
      <Separator />
      <div className='mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6'>
        <span>CanIClone &mdash; AI App Directory.</span>
        <span>Sample product data. Build prompts included &mdash; shipping code is up to you.</span>
      </div>
    </footer>
  );
}
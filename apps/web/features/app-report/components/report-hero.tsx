import Link from 'next/link';

import { MicroGlyph } from '@/components/ui/micro-glyph';
import type { AppRecord } from '@/lib/api/types';
import { humanizeSlug } from '@/lib/api/format';

import { AppIcon } from './app-icon';
import { ReportLabel } from './report-label';
import { VerdictPill } from './verdict-display';

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className='inline-flex flex-wrap items-center gap-x-2 gap-y-1'>
      <span className='font-mono text-[11px] uppercase tracking-widest text-muted-foreground'>
        {label}
      </span>
      <span className='font-mono text-sm font-semibold text-foreground'>{children}</span>
    </span>
  );
}

export function ReportHero({ app }: { app: AppRecord }) {
  const monthly = app.priceMonthly !== null ? Number(app.priceMonthly) : NaN;
  const yearlySave = Number.isFinite(monthly) && monthly > 0 ? Math.round(monthly * 12) : null;

  return (
    <header className='flex flex-col gap-8'>
      <nav
        aria-label='Breadcrumb'
        className='flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground'
      >
        <Link href='/apps' className='hover:text-foreground'>
          apps
        </Link>
        <span aria-hidden='true'>/</span>
        <Link href={`/categories/${app.category}`} className='hover:text-foreground'>
          {app.category}
        </Link>
        <span aria-hidden='true'>/</span>
        <span className='text-foreground'>{app.slug}</span>
      </nav>

      <div className='flex flex-col gap-6 md:flex-row md:items-start md:justify-between'>
        <div className='flex min-w-0 items-center gap-4'>
          <AppIcon name={app.name} officialUrl={app.officialUrl} className='size-12 text-[13px]' />
          <h1 className='text-3xl font-bold tracking-tight text-balance sm:text-4xl'>
            Can I clone {app.name}?
          </h1>
        </div>
        <VerdictPill verdict={app.verdict} className='self-start md:mt-1' />
      </div>

      <div className='flex flex-wrap items-center gap-x-6 gap-y-3'>
        <MetaItem label='price'>{app.pricing}</MetaItem>
        {yearlySave !== null && (
          <MetaItem label="you'd save">
            <span className='text-emerald-600 dark:text-emerald-400'>${yearlySave}/yr</span>
          </MetaItem>
        )}
        {app.diyTimeEstimate && <MetaItem label='build time'>{app.diyTimeEstimate}</MetaItem>}
        <MetaItem label='category'>
          <Link
            href={`/categories/${app.category}`}
            className='inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] font-medium normal-case tracking-normal hover:bg-muted'
          >
            <MicroGlyph name={app.category} className='size-3' />
            {humanizeSlug(app.category)}
          </Link>
        </MetaItem>
        {app.openSource.length > 0 && (
          <MetaItem label='free alternatives'>{app.openSource.length}</MetaItem>
        )}
      </div>

      {app.moat.length > 0 && (
        <div className='flex flex-wrap items-center gap-3'>
          <ReportLabel>moat</ReportLabel>
          <div className='flex flex-wrap items-center gap-2'>
            {app.moat.map((tag) => (
              <span
                key={tag}
                className='inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 font-mono text-[11px] text-foreground'
              >
                <MicroGlyph name={tag} className='size-3 text-muted-foreground' />
                {humanizeSlug(tag)}
              </span>
            ))}
          </div>
        </div>
      )}

      {app.description && (
        <p className='max-w-3xl font-mono text-sm leading-relaxed text-muted-foreground'>
          {app.description}
        </p>
      )}
    </header>
  );
}

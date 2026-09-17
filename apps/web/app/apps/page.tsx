import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { ErrorState } from '@/components/shared/error-state';
import { AppList } from '@/features/apps/components/app-list';
import { getApps, getAppCount } from '@/lib/api/apps';
import { fetchCategoryStats } from '@/lib/api/categories';
import { CategoryPill } from '@/components/ui/category-pill';

export const metadata: Metadata = {
  title: 'Apps',
  description: 'Browse every AI app in the CanIClone directory.'
};

export default async function AppsPage() {
  let apps;
  let count;
  let categories;

  try {
    [apps, count, categories] = await Promise.all([getApps(), getAppCount(), fetchCategoryStats()]);
  } catch {
    return <ErrorState title='Could not load apps' />;
  }

  return (
    <div className='layout-container flex flex-col py-8'>
      <div className='flex items-end justify-between border-b border-border pb-3 mb-6'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-3xl font-bold tracking-tight'>The Clone List</h1>
          <span className='font-mono text-[11px] text-muted-foreground uppercase tracking-wider'>ranked by replaced apps</span>
        </div>
        <span className='font-mono text-[11px] text-muted-foreground'>{count} apps</span>
      </div>
      
      <Suspense fallback={<div className='font-mono text-sm text-muted-foreground py-8'>Loading list...</div>}>
        <AppList apps={apps} categories={categories} />
      </Suspense>
    </div>
  );
}
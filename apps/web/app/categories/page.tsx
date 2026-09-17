import type { Metadata } from 'next';

import { ErrorState } from '@/components/shared/error-state';
import { CategoryGrid } from '@/features/categories/components/category-grid';
import { fetchCategoryStats } from '@/lib/api/categories';
import { getAppCount } from '@/lib/api/apps';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse AI apps by category in the CanIClone directory.'
};

export default async function CategoriesPage() {
  let categories;
  let appCount;

  try {
    [categories, appCount] = await Promise.all([fetchCategoryStats(), getAppCount()]);
  } catch {
    return <ErrorState title='Could not load categories' />;
  }

  return (
    <div className='layout-container flex flex-col gap-6 py-8 sm:py-12'>
      <div className='flex flex-col gap-1.5'>
        <span className='inline-flex w-fit items-center gap-1.5 font-mono text-[11px] text-muted-foreground'>
          <span className='size-1.5 rounded-full bg-primary' />
          {categories.length} categories · {appCount} apps
        </span>
        <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
          Browse by category
        </h1>
        <p className='max-w-2xl text-sm text-muted-foreground leading-relaxed'>
          Zero in on the kind of product you want to build — then compare the verdicts inside.
        </p>
      </div>
      <CategoryGrid categories={categories} />
    </div>
  );
}
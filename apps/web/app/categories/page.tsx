import type { Metadata } from 'next';

import { CategoryGrid } from '@/features/categories/components/category-grid';
import { CATEGORIES } from '@/features/categories/data/categories';
import { getAppCount } from '@/features/apps/data/apps';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse AI apps by category in the CanIClone directory.'
};

export default function CategoriesPage() {
  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14'>
      <div className='flex flex-col gap-1'>
        <span className='inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground'>
          <span className='size-1.5 rounded-full bg-primary' />
          {CATEGORIES.length} categories · {getAppCount()} apps
        </span>
        <h1 className='text-3xl font-bold tracking-tight'>Browse by category</h1>
        <p className='max-w-2xl text-muted-foreground'>
          Zero in on the kind of product you want to build — then compare the verdicts inside.
        </p>
      </div>
      <CategoryGrid />
    </div>
  );
}
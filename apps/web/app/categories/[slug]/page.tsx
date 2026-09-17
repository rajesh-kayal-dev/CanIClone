import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { ErrorState } from '@/components/shared/error-state';
import { AppList } from '@/features/apps/components/app-list';
import { getAppsByCategory } from '@/lib/api/apps';
import { fetchCategoryStats } from '@/lib/api/categories';
import { CategoryPill } from '@/components/ui/category-pill';
import { BackButton } from '@/components/ui/back-button';

// ... (Metadata generation is unchanged)

export function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return params.then(async ({ slug }) => {
    try {
      const categories = await fetchCategoryStats();
      const category = categories.find((c) => c.slug === slug);
      if (!category) return { title: 'Category not found' };
      return { title: category.name, description: category.description };
    } catch {
      return { title: 'Category', description: 'Could not load this category right now.' };
    }
  });
}

import { MicroGlyph } from '@/components/ui/micro-glyph';

export default async function CategoryDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let categories;
  let apps;
  try {
    [categories, apps] = await Promise.all([
      fetchCategoryStats(),
      getAppsByCategory(slug).catch(() => [])
    ]);
  } catch {
    return <ErrorState title='Could not load this category' />;
  }

  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const appCount = apps.length;

  return (
    <div className='layout-container flex flex-col py-8'>
      <div className='flex items-center gap-4 font-mono text-[11px] text-muted-foreground mb-6'>
        <BackButton fallbackPath='/categories' />
        <div className='flex items-center gap-2'>
          <Link href='/categories' className='hover:underline'>all categories</Link>
          <span>/</span>
          <span className='text-foreground'>{category.name.toLowerCase()}</span>
        </div>
      </div>

      <div className='flex items-end justify-between border-b border-border pb-2 mb-4'>
        <div className='flex items-center gap-3'>
          <div className='flex size-7 items-center justify-center rounded border border-border/60 bg-muted/40 text-foreground'>
            <MicroGlyph name={category.slug} className='size-4' />
          </div>
          <h1 className='text-2xl font-bold tracking-tight'>{category.name}</h1>
        </div>
        <span className='font-mono text-[11px] text-muted-foreground'>{appCount} apps</span>
      </div>
      
      {apps.length > 0 ? (
        <Suspense fallback={<div className='font-mono text-sm text-muted-foreground py-8'>Loading list...</div>}>
          <AppList apps={apps} categories={categories} />
        </Suspense>
      ) : (
        <Empty className='border-none py-16 text-center'>
          <p className='font-mono text-sm text-muted-foreground'>No apps in this category yet.</p>
        </Empty>
      )}
    </div>
  );
}
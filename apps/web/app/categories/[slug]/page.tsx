import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { AppList } from '@/features/apps/components/app-list';
import { getAppsByCategory, countAppsByCategory } from '@/features/apps/data/apps';
import { getCategoryBySlug } from '@/features/categories/data/categories';

export function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return params.then(({ slug }) => {
    const category = getCategoryBySlug(slug);
    if (!category) return { title: 'Category not found' };
    return { title: category.name, description: category.description };
  });
}

export default async function CategoryDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const apps = getAppsByCategory(slug);
  const Icon = category.icon;

  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14'>
      <div className='flex flex-col gap-4'>
        <Link
          href='/categories'
          className='inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground'
        >
          <Icons.chevronLeft className='size-4' />
          All categories
        </Link>
        <div className='flex items-center gap-3'>
          <span className='flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary [&>svg]:size-5'>
            <Icon className='size-5' />
          </span>
          <div className='flex flex-col gap-1'>
            <h1 className='text-3xl font-bold tracking-tight'>{category.name}</h1>
            <p className='text-sm text-muted-foreground'>
              {countAppsByCategory(slug)} {countAppsByCategory(slug) === 1 ? 'app' : 'apps'} reviewed
            </p>
          </div>
        </div>
        <p className='max-w-2xl text-muted-foreground'>{category.description}</p>
      </div>

      {apps.length > 0 ? (
        <AppList apps={apps} />
      ) : (
        <Empty className='border rounded-xl py-16'>
          <EmptyHeader>
            <EmptyTitle>No apps in this category yet</EmptyTitle>
            <EmptyDescription>
              We’re adding reviews all the time. Meanwhile, browse the full directory.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size='sm' nativeButton={false} render={<Link href='/apps' />}>
              Back to all apps
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
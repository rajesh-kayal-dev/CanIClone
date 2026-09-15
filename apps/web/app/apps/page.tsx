import type { Metadata } from 'next';

import { AppList } from '@/features/apps/components/app-list';
import { APPS, getAppCount } from '@/features/apps/data/apps';

export const metadata: Metadata = {
  title: 'Apps',
  description: 'Browse every AI app in the CanIClone directory.'
};

export default function AppsPage() {
  const count = getAppCount();

  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14'>
      <div className='flex flex-col gap-1'>
        <span className='inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground'>
          <span className='size-1.5 rounded-full bg-primary' />
          {count} apps in the directory
        </span>
        <h1 className='text-3xl font-bold tracking-tight'>Every app, one verdict</h1>
        <p className='max-w-2xl text-muted-foreground'>
          Searchable, comparable, and every single one includes a ready-to-paste build prompt. Green
          means go build; amber means pick your fight; red means walk away.
        </p>
      </div>
      <AppList apps={APPS} />
    </div>
  );
}
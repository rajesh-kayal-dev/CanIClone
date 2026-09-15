import Link from 'next/link';

import { Icons } from '@/components/icons';
import { AppCard } from '@/components/shared/app-card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { searchApps } from '@/features/apps/data/apps';

export function SearchResults({ query }: { query: string }) {
  const results = searchApps(query);
  const normalized = query.trim().toLowerCase();

  if (results.length === 0 && normalized) {
    return (
      <Empty className='border rounded-xl py-16'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <Icons.search />
          </EmptyMedia>
          <EmptyTitle>No apps match “{query}”</EmptyTitle>
          <EmptyDescription>
            Try a different product name, or a category like “image” or “code”. You can also{' '}
            <Link href='/apps'>browse every app</Link>.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {results.map((app) => (
        <AppCard key={app.slug} app={app} />
      ))}
    </div>
  );
}
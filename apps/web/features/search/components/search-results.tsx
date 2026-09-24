import Link from 'next/link';
import { Suspense } from 'react';

import { AppList } from '@/features/apps/components/app-list';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { ErrorState } from '@/components/shared/error-state';
import { searchApps } from '@/lib/api/apps';

export async function SearchResults({ query }: { query: string }) {
  const normalized = query.trim();

  let results;
  try {
    results = await searchApps(normalized, 20);
  } catch {
    return (
      <ErrorState
        title='Search is unavailable right now'
        description='We couldn’t reach the directory. Check that the API is running and try again.'
        className='border-none'
      />
    );
  }

  if (results.length === 0 && normalized) {
    return (
      <Empty className='border-none py-16 text-center'>
        <EmptyHeader>
          <EmptyTitle className='font-mono text-sm'>No apps match “{query}”</EmptyTitle>
          <EmptyDescription className='mx-auto mt-2 max-w-sm font-mono text-xs'>
            Try a different product name, or a category like “image” or “code”. You can also{' '}
            <Link href='/apps' className='underline'>browse every app</Link>.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Suspense fallback={<div className='py-8 font-mono text-sm text-muted-foreground'>Loading results…</div>}>
      <AppList apps={results} />
    </Suspense>
  );
}

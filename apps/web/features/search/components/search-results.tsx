import Link from 'next/link';
import { Suspense } from 'react';

import { Icons } from '@/components/icons';
import { AppList } from '@/features/apps/components/app-list';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { ErrorState } from '@/components/shared/error-state';
import { searchApps } from '@/lib/api/apps';

export async function SearchResults({ query }: { query: string }) {
  const normalized = query.trim();

  let results;
  try {
    results = await searchApps(normalized);
  } catch {
    return <ErrorState title='Search is unavailable right now' description='We couldn’t reach the directory. Check that the API is running and try again.' className='border-none' />;
  }

  if (results.length === 0 && normalized) {
    return (
      <Empty className='border-none py-16 text-center'>
        <EmptyHeader>
          <EmptyTitle className='font-mono text-sm'>No apps match “{query}”</EmptyTitle>
          <EmptyDescription className='font-mono text-xs mt-2 max-w-sm mx-auto'>
            Try a different product name, or a category like “image” or “code”. You can also{' '}
            <Link href='/apps' className='underline'>browse every app</Link>.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Suspense fallback={<div className='font-mono text-sm text-muted-foreground py-8'>Loading results...</div>}>
      <AppList apps={results} />
    </Suspense>
  );
}
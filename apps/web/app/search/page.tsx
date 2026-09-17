import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Icons } from '@/components/icons';
import { AppList } from '@/features/apps/components/app-list';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/shared/error-state';
import { SearchBar } from '@/features/search/components/search-bar';
import { SearchResults } from '@/features/search/components/search-results';
import { getPopularApps } from '@/lib/api/apps';
import type { AppRecord } from '@/lib/api/types';
import { CategoryPill } from '@/components/ui/category-pill';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search the CanIClone directory of AI apps, agents, and tools.'
};

const SUGGESTIONS = [
  { label: 'Chatbot', query: 'chatbot' },
  { label: 'Image', query: 'image' },
  { label: 'Open source', query: 'open source' },
  { label: 'Voice', query: 'audio' },
  { label: 'Code', query: 'code' },
  { label: 'RAG', query: 'rag' }
];

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const normalized = q?.trim() ?? '';

  let trending: AppRecord[] = [];
  try {
    trending = await getPopularApps(5);
  } catch {
    trending = [];
  }

  return (
    <div className='layout-container flex flex-col gap-8 py-8'>
      <div className='flex items-end justify-between border-b border-border pb-2'>
        <h1 className='text-2xl font-bold tracking-tight'>Search</h1>
        <span className='font-mono text-[11px] text-muted-foreground'>Directory</span>
      </div>

      <SearchBar size='lg' defaultValue={normalized} />

      {normalized ? (
        <div className='flex flex-col gap-4'>
          <p className='font-mono text-sm text-muted-foreground'>
            Results for <span className='font-medium text-foreground'>“{normalized}”</span>
          </p>
          <SearchResults query={normalized} />
        </div>
      ) : (
        <div className='flex flex-col gap-8'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='font-mono text-[11px] text-muted-foreground mr-2'>Try:</span>
            {SUGGESTIONS.map((item) => (
              <CategoryPill 
                key={item.query}
                category={{ name: item.label, slug: `/search?q=${encodeURIComponent(item.query)}` }} 
              />
            ))}
          </div>

          <div className='flex flex-col gap-4'>
            <div className='flex items-end justify-between border-b border-border pb-2'>
              <h2 className='text-lg font-semibold tracking-tight'>Trending</h2>
              <Link href='/apps' className='font-mono text-[11px] hover:underline text-muted-foreground flex items-center gap-1'>
                All apps <Icons.arrowRight className='size-3' />
              </Link>
            </div>
            {trending.length > 0 ? (
              <Suspense fallback={<div className='font-mono text-sm text-muted-foreground py-8'>Loading list...</div>}>
                <AppList apps={trending} />
              </Suspense>
            ) : (
              <ErrorState title='Nothing trending right now' description='Trending requires the API to be running.' className='py-12 border-none' />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
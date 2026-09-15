import Link from 'next/link';
import type { Metadata } from 'next';

import { Icons } from '@/components/icons';
import { AppCard } from '@/components/shared/app-card';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/features/search/components/search-bar';
import { SearchResults } from '@/features/search/components/search-results';
import { getPopularApps } from '@/features/apps/data/apps';

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
  const trending = getPopularApps(3);

  return (
    <div className='mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14'>
      <div className='flex flex-col gap-4'>
        <h1 className='text-3xl font-bold tracking-tight'>Search the directory</h1>
        <p className='max-w-2xl text-muted-foreground'>
          Search by product name, category, stack, or what the app is made of.
        </p>
      </div>

      <SearchBar size='lg' defaultValue={normalized} />

      {normalized ? (
        <div className='flex flex-col gap-4'>
          <p className='text-sm text-muted-foreground'>
            Results for <span className='font-medium text-foreground'>“{normalized}”</span>
          </p>
          <SearchResults query={normalized} />
        </div>
      ) : (
        <div className='flex flex-col gap-8'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-xs text-muted-foreground'>Try:</span>
            {SUGGESTIONS.map((item) => (
              <Button
                key={item.query}
                variant='outline'
                size='xs'
                className='rounded-full'
                nativeButton={false}
                render={<Link href={`/search?q=${encodeURIComponent(item.query)}`} />}
              >
                {item.label}
                <Icons.arrowRight className='size-3' />
              </Button>
            ))}
          </div>

          <div className='flex flex-col gap-4'>
            <div className='flex items-end justify-between gap-4'>
              <h2 className='text-lg font-semibold tracking-tight'>Trending while you think</h2>
              <Button variant='ghost' size='sm' nativeButton={false} render={<Link href='/apps' />}>
                All apps
                <Icons.chevronRight className='size-4' />
              </Button>
            </div>
            <div className='grid gap-4 sm:grid-cols-3'>
              {trending.map((app) => (
                <AppCard key={app.slug} app={app} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import type { Metadata } from 'next';

import { CategoryPill } from '@/components/ui/category-pill';
import { SearchBar } from '@/features/search/components/search-bar';
import { SearchResults } from '@/features/search/components/search-results';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Fast keyword and hybrid vector search across the CanIClone directory.',
};

const SUGGESTIONS = [
  { label: 'Chatbot', query: 'chatbot' },
  { label: 'Image', query: 'image' },
  { label: 'Open source', query: 'open source' },
  { label: 'Voice', query: 'audio' },
  { label: 'Code', query: 'code' },
  { label: 'RAG', query: 'rag' },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const normalized = q?.trim() ?? '';

  return (
    <div className='layout-container flex flex-col gap-8 py-8'>
      <div className='flex items-end justify-between border-b border-border pb-2'>
        <h1 className='text-2xl font-bold tracking-tight'>Search</h1>
        <span className='font-mono text-[11px] text-muted-foreground'>Fast hybrid search</span>
      </div>

      <SearchBar key={normalized} size='lg' defaultValue={normalized} />

      {normalized ? (
        <div className='flex flex-col gap-4'>
          <p className='font-mono text-sm text-muted-foreground'>
            Results for <span className='font-medium text-foreground'>“{normalized}”</span>
          </p>
          <SearchResults query={normalized} />
        </div>
      ) : (
        <section className='flex flex-col items-center gap-6 rounded-xl border border-border/60 bg-muted/10 px-6 py-12 text-center'>
          <div className='flex flex-col gap-2'>
            <h2 className='text-lg font-semibold tracking-tight'>Start typing to search</h2>
            <p className='max-w-md text-sm leading-relaxed text-muted-foreground'>
              Suggestions are debounced and combine app text with the existing 384-dimension vector index.
              Press Enter for the full hybrid results.
            </p>
          </div>
          <div className='flex flex-wrap items-center justify-center gap-2'>
            <span className='mr-1 font-mono text-[11px] uppercase text-muted-foreground'>Try</span>
            {SUGGESTIONS.map((item) => (
              <CategoryPill
                key={item.query}
                category={{ name: item.label, slug: item.query }}
                href={`/search?q=${encodeURIComponent(item.query)}`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { CategoryCard } from '@/components/shared/category-card';
import type { CategoryWithCount } from '@/lib/api/categories';
import { MicroGlyph } from '@/components/ui/micro-glyph';

type SortMode = 'most' | 'az' | 'all';

export function CategoryGrid({
  categories,
  className
}: {
  categories: CategoryWithCount[];
  className?: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('all');

  const filteredAndSorted = useMemo(() => {
    let result = [...categories];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    if (sortMode === 'az') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === 'most' || sortMode === 'all') {
      result.sort((a, b) => b.appCount - a.appCount);
    }

    return result;
  }, [categories, searchQuery, sortMode]);

  return (
    <div className={`flex flex-col gap-6 ${className ?? ''}`}>
      {/* Discovery & Filtering Controls */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/40 pb-4'>
        {/* Search input */}
        <div className='relative flex-1 max-w-sm'>
          <div className='absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground'>
            <MicroGlyph name='search' className='size-3.5 opacity-70' />
          </div>
          <input
            type='text'
            placeholder='Filter categories...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full rounded-md border border-border/60 bg-muted/20 pl-8 pr-7 py-1.5 text-xs font-mono placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-colors'
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className='absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground hover:text-foreground px-1'
              aria-label='Clear search'
            >
              ×
            </button>
          )}
        </div>

        {/* Sort Pills */}
        <div className='flex items-center justify-between sm:justify-end gap-3'>
          <div className='flex items-center gap-1 bg-muted/40 p-1 rounded-md border border-border/50 text-[11px] font-mono'>
            <button
              onClick={() => setSortMode('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                sortMode === 'all'
                  ? 'bg-background text-foreground shadow-xs border border-border/60 font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSortMode('most')}
              className={`px-2.5 py-1 rounded transition-colors ${
                sortMode === 'most'
                  ? 'bg-background text-foreground shadow-xs border border-border/60 font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Most Apps
            </button>
            <button
              onClick={() => setSortMode('az')}
              className={`px-2.5 py-1 rounded transition-colors ${
                sortMode === 'az'
                  ? 'bg-background text-foreground shadow-xs border border-border/60 font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              A-Z
            </button>
          </div>
        </div>
      </div>

      {/* Category Cards Grid */}
      {filteredAndSorted.length > 0 ? (
        <div className='grid gap-3.5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
          {filteredAndSorted.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/60 rounded-lg bg-muted/10'>
          <MicroGlyph name='search' className='size-6 text-muted-foreground mb-3 opacity-60' />
          <p className='font-mono text-xs text-muted-foreground'>
            No categories match &quot;{searchQuery}&quot;
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className='mt-3 text-xs font-mono text-primary underline underline-offset-4 hover:opacity-80'
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
}
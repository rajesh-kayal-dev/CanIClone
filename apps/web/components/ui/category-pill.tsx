import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { MicroGlyph } from './micro-glyph';

interface CategoryPillProps {
  category: {
    slug: string;
    name: string;
  };
  isActive?: boolean;
}

export function CategoryPill({ category, isActive }: CategoryPillProps) {
  return (
    <Link 
      href={`/categories/${category.slug}`}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono transition-colors whitespace-nowrap',
        isActive 
          ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
          : 'bg-background hover:bg-muted border-border text-muted-foreground hover:text-foreground'
      )}
    >
      <MicroGlyph name={category.name} className='w-2.5 h-2.5 opacity-80 group-hover:opacity-100 group-hover:text-primary transition-colors' />
      <span>{category.name.toLowerCase()}</span>
    </Link>
  );
}

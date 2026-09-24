'use client';

import { SearchBar } from '@/features/search/components/search-bar';
import { Icons } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { CategoryWithCount } from '@/lib/api/categories';

export type VerdictFilter = 'all' | 'YES' | 'KINDA' | 'NO';
export type SortOption =
  | 'trending'
  | 'popular'
  | 'new'
  | 'votes'
  | 'name'
  | 'price'
  | 'replaced';

export interface SortOptionDefinition {
  id: SortOption;
  label: string;
}

export const APP_SORT_OPTIONS: SortOptionDefinition[] = [
  { id: 'trending', label: 'TRENDING' },
  { id: 'popular', label: 'POPULAR' },
  { id: 'new', label: 'NEWEST' },
  { id: 'name', label: 'NAME' },
  { id: 'price', label: 'PRICE' },
];

export const CLONE_LIST_SORT_OPTIONS: SortOptionDefinition[] = [
  { id: 'replaced', label: 'MOST REPLACED' },
  { id: 'trending', label: 'TRENDING' },
  { id: 'popular', label: 'POPULAR' },
  { id: 'new', label: 'NEWEST' },
  { id: 'name', label: 'NAME' },
  { id: 'price', label: 'PRICE' },
];

interface AppListControlsProps {
  categories: CategoryWithCount[];
  selectedCategory: string;
  verdictFilter: VerdictFilter;
  sortBy: SortOption;
  onCategoryChange: (value: string) => void;
  onVerdictChange: (value: VerdictFilter) => void;
  onSortChange: (value: SortOption) => void;
  searchQuery?: string;
  onSearchSubmit?: (value: string) => void;
  sortOptions?: SortOptionDefinition[];
}

export function AppListControls({
  categories,
  selectedCategory,
  verdictFilter,
  sortBy,
  onCategoryChange,
  onVerdictChange,
  onSortChange,
  searchQuery = '',
  onSearchSubmit,
  sortOptions = APP_SORT_OPTIONS,
}: AppListControlsProps) {
  const activeCategory = categories.find((category) => category.slug === selectedCategory);
  const currentSort = sortOptions.find((option) => option.id === sortBy) ?? sortOptions[0];

  return (
    <div className='flex flex-col gap-3 border-b border-border/60 py-3'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <SearchBar
          key={searchQuery}
          size='md'
          defaultValue={searchQuery}
          placeholder='search apps...'
          onSubmit={onSearchSubmit}
          className='w-full lg:max-w-xs'
        />
        <div className='flex items-center gap-4 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar'>
          {categories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className='flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 font-mono text-[11px] transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring'>
                {activeCategory ? activeCategory.name.toLowerCase() : 'all categories'}
                <Icons.chevronDown className='size-3 opacity-50' />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start' className='max-h-80 overflow-y-auto font-mono text-[11px]'>
                <DropdownMenuItem onClick={() => onCategoryChange('all')}>
                  all categories
                </DropdownMenuItem>
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category.slug}
                    onClick={() => onCategoryChange(category.slug)}
                  >
                    {category.name.toLowerCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className='flex shrink-0 items-center gap-2'>
            <span className='mr-1 font-mono text-[10px] uppercase text-muted-foreground'>
              verdict
            </span>
            <div className='flex items-center gap-1 rounded-md border border-border bg-muted/30 p-0.5'>
              {(['all', 'YES', 'KINDA', 'NO'] as VerdictFilter[]).map((value) => (
                <button
                  key={value}
                  type='button'
                  onClick={() => onVerdictChange(value)}
                  className={cn(
                    'rounded-sm px-2 py-1 font-mono text-[10px] uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
                    verdictFilter === value
                      ? 'border border-border/50 bg-background font-bold text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {value === 'NO' ? 'NOT REALLY' : value}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='flex items-center justify-end'>
        <DropdownMenu>
          <DropdownMenuTrigger className='flex items-center gap-1.5 rounded-sm px-1 font-mono text-[10px] uppercase text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring'>
            sort: {currentSort?.label ?? sortBy}
            <Icons.chevronDown className='size-3' />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='font-mono text-[11px] uppercase'>
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => onSortChange(option.id)}
                className={cn(sortBy === option.id && 'font-bold text-primary')}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

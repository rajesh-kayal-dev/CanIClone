'use client';

import type { AppRecord } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { AppListTable } from './app-list-table';

export type { SortOption, VerdictFilter } from './app-list-controls';

interface AppListProps {
  apps: AppRecord[];
  className?: string;
}

/** Presentational list for already-ranked server results. */
export function AppList({ apps, className }: AppListProps) {
  return <AppListTable apps={apps} className={cn('w-full', className)} />;
}

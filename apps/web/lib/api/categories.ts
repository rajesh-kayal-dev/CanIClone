import { apiFetch } from './client';
import { Icons } from '@/components/icons';
import {
  CATEGORIES,
  getCategoryBySlug,
} from '@/features/categories/data/categories';
import type { CategoryRecord } from '@/features/categories/data/categories';
import type { ApiListApp } from './types';
import { humanizeSlug } from './format';

let _appsCache: ApiListApp[] | null = null;

async function fetchApps(): Promise<ApiListApp[]> {
  if (!_appsCache) _appsCache = await apiFetch<ApiListApp[]>('/api/apps');
  return _appsCache;
}

export interface CategoryWithCount extends CategoryRecord {
  appCount: number;
}

function categoryMeta(slug: string): CategoryRecord | undefined {
  return getCategoryBySlug(slug);
}

export async function fetchAllCategorySlugs(): Promise<string[]> {
  return apiFetch<string[]>('/api/apps/categories');
}

/**
 * Returns all live categories with counts, sorted by count descending.
 * Merges static presentation metadata (name/description/icon) with live data.
 */
export async function fetchCategoryStats(): Promise<CategoryWithCount[]> {
  const slugs = await fetchAllCategorySlugs();
  const apps = await fetchApps();

  const countMap: Record<string, number> = {};
  for (const a of apps) {
    countMap[a.category] = (countMap[a.category] || 0) + 1;
  }

  return slugs
    .map((slug) => {
      const meta = categoryMeta(slug);
      return {
        slug,
        name: meta?.name ?? humanizeSlug(slug),
        description: meta?.description ?? `Browse apps in ${humanizeSlug(slug)}.`,
        icon: meta?.icon ?? Icons.circle,
        appCount: countMap[slug] || 0,
      };
    })
    .sort((a, b) => b.appCount - a.appCount);
}

/**
 * Returns the top N categories by app count, with static metadata merged in.
 */
export async function getTopCategories(limit = 8): Promise<CategoryWithCount[]> {
  const all = await fetchCategoryStats();
  return all.slice(0, limit);
}

export async function isCategoryValid(slug: string): Promise<boolean> {
  const slugs = await fetchAllCategorySlugs();
  return slugs.includes(slug);
}

import { apiFetch } from './client';
import {
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

export interface SampleApp {
  slug: string;
  name: string;
  domain: string | null;
}

export interface CategoryWithCount {
  slug: string;
  name: string;
  description: string;
  appCount: number;
  sampleApps?: SampleApp[];
}

function categoryMeta(slug: string): CategoryRecord | undefined {
  return getCategoryBySlug(slug);
}

export async function fetchAllCategorySlugs(): Promise<string[]> {
  return apiFetch<string[]>('/api/apps/categories');
}

/**
 * Returns all live categories with counts, sorted by count descending.
 * Merges static presentation metadata (name/description) with live data.
 */
export async function fetchCategoryStats(): Promise<CategoryWithCount[]> {
  const slugs = await fetchAllCategorySlugs();
  const apps = await fetchApps();

  const countMap: Record<string, number> = {};
  const sampleAppsMap: Record<string, SampleApp[]> = {};

  for (const a of apps) {
    countMap[a.category] = (countMap[a.category] || 0) + 1;

    if (!sampleAppsMap[a.category]) {
      sampleAppsMap[a.category] = [];
    }
    if (sampleAppsMap[a.category].length < 3) {
      sampleAppsMap[a.category].push({
        slug: a.slug,
        name: a.name,
        domain: a.domain,
      });
    }
  }

  return slugs
    .map((slug) => {
      const meta = categoryMeta(slug);
      return {
        slug,
        name: meta?.name ?? humanizeSlug(slug),
        description: meta?.description ?? `Browse apps in ${humanizeSlug(slug)}.`,
        appCount: countMap[slug] || 0,
        sampleApps: sampleAppsMap[slug] || [],
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

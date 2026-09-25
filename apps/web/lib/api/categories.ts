import { cachedApiFetch } from './client';
import {
  getCategoryBySlug,
  type CategoryRecord,
} from '@/features/categories/data/categories';
import type { ApiCategoryStat } from './types';
import { humanizeSlug } from './format';

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
  sampleApps: SampleApp[];
}

function categoryMeta(slug: string): CategoryRecord | undefined {
  return getCategoryBySlug(slug);
}

function toCategoryWithCount(category: ApiCategoryStat): CategoryWithCount {
  const meta = categoryMeta(category.slug);
  return {
    slug: category.slug,
    name: meta?.name ?? humanizeSlug(category.slug),
    description:
      meta?.description ?? `Browse apps in ${humanizeSlug(category.slug)}.`,
    appCount: category.appCount,
    sampleApps: category.sampleApps ?? [],
  };
}

export async function fetchAllCategorySlugs(): Promise<string[]> {
  const categories = await cachedApiFetch<ApiCategoryStat[]>(
    '/api/apps/categories',
    300,
    ['categories'],
  );
  return categories.map((category) => category.slug);
}

/**
 * Category cards are backed by one aggregate API query. It never downloads the
 * app directory just to count cards or choose three sample logos.
 */
export async function fetchCategoryStats(): Promise<CategoryWithCount[]> {
  const categories = await cachedApiFetch<ApiCategoryStat[]>(
    '/api/apps/categories',
    300,
    ['categories'],
  );
  return categories.map(toCategoryWithCount);
}

export async function fetchCategoryBySlug(
  slug: string,
): Promise<CategoryWithCount | null> {
  try {
    const category = await cachedApiFetch<ApiCategoryStat>(
      `/api/apps/categories/${encodeURIComponent(slug)}`,
      300,
      ['categories', `category:${slug}`],
    );
    return toCategoryWithCount(category);
  } catch {
    return null;
  }
}

export async function getTopCategories(limit = 8): Promise<CategoryWithCount[]> {
  return (await fetchCategoryStats()).slice(0, limit);
}

export async function isCategoryValid(slug: string): Promise<boolean> {
  return (await fetchCategoryBySlug(slug)) !== null;
}

import { CategoryCard } from '@/components/shared/category-card';
import { CATEGORIES } from '@/features/categories/data/categories';
import { countAppsByCategory } from '@/features/apps/data/apps';

export function CategoryGrid({ className }: { className?: string }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className ?? ''}`}>
      {CATEGORIES.map((category) => (
        <CategoryCard
          key={category.slug}
          category={category}
          appCount={countAppsByCategory(category.slug)}
        />
      ))}
    </div>
  );
}
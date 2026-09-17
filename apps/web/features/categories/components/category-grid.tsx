import { CategoryCard } from '@/components/shared/category-card';
import type { CategoryWithCount } from '@/lib/api/categories';

export function CategoryGrid({
  categories,
  className
}: {
  categories: CategoryWithCount[];
  className?: string;
}) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className ?? ''}`}>
      {categories.map((category) => (
        <CategoryCard
          key={category.slug}
          category={category}
          appCount={category.appCount}
        />
      ))}
    </div>
  );
}
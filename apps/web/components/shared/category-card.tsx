import Link from 'next/link';

import { Icons } from '@/components/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import type { CategoryRecord } from '@/features/categories/data/categories';

export function CategoryCard({
  category,
  appCount,
  className
}: {
  category: CategoryRecord;
  appCount: number;
  className?: string;
}) {
  const Icon = category.icon || Icons.circle;
  return (
    <Link
      href={`/categories/${category.slug}`}
      className='group/cat focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
    >
      <Card className='h-full transition-colors group-hover/cat:bg-muted/30 group-hover/cat:ring-ring/50'>
        <CardHeader>
          <div className='flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover/cat:bg-primary group-hover/cat:text-primary-foreground [&>svg]:size-4'>
            <Icon className='size-4' />
          </div>
        </CardHeader>
        <CardContent className='flex flex-col gap-1'>
          <CardTitle className='flex items-center justify-between gap-2'>
            <span>{category.name}</span>
            <span className='text-xs font-normal text-muted-foreground tabular-nums'>
              {appCount} {appCount === 1 ? 'app' : 'apps'}
            </span>
          </CardTitle>
          <CardDescription className='line-clamp-2'>{category.description}</CardDescription>
          <span className='mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover/cat:text-foreground'>
            Browse
            <Icons.chevronRight className='size-3.5' />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
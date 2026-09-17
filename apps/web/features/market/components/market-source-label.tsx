import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';

interface MarketSourceLabelProps {
  source: 'google-trends' | 'trends-api';
  className?: string;
}

export function MarketSourceLabel({ source, className }: MarketSourceLabelProps) {
  const isGoogle = source === 'google-trends';

  return (
    <div className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
      <Icons.galleryVerticalEnd className="h-3 w-3" />
      <span>{isGoogle ? 'Search interest — Google Trends' : 'App-store signals — Trends API'}</span>
    </div>
  );
}

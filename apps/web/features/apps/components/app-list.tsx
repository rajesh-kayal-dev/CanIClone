import { AppCard } from '@/components/shared/app-card';
import type { AppRecord } from '@/features/apps/data/apps';

export function AppList({ apps, className }: { apps: AppRecord[]; className?: string }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className ?? ''}`}>
      {apps.map((app) => (
        <AppCard key={app.slug} app={app} />
      ))}
    </div>
  );
}
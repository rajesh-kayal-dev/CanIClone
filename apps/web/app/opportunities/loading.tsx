import { AppListSkeleton } from '@/components/ui/app-list-skeleton';

export default function Loading() {
  return (
    <div className='layout-container flex flex-col py-8'>
      <div className='mb-6 flex flex-col gap-1 border-b border-border pb-3'>
        <h1 className='text-3xl font-bold tracking-tight'>Build Opportunities</h1>
        <span className='font-mono text-[11px] uppercase tracking-wider text-muted-foreground'>
          loading evidence-backed signals…
        </span>
      </div>
      <AppListSkeleton count={10} />
    </div>
  );
}

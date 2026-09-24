import { AppListSkeleton } from '@/components/ui/app-list-skeleton';

export default function Loading() {
  return (
    <div className='layout-container flex flex-col py-8'>
      <div className='mb-6 flex flex-col gap-1 border-b border-border pb-3'>
        <h1 className='text-2xl font-bold tracking-tight'>Clone List</h1>
        <span className='font-mono text-[11px] uppercase tracking-wider text-muted-foreground'>
          loading tracked alternatives…
        </span>
      </div>
      <AppListSkeleton count={10} />
    </div>
  );
}

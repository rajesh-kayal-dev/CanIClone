import { AppListSkeleton } from '@/components/ui/app-list-skeleton';

export default function Loading() {
  return (
    <div className='layout-container flex flex-col py-8'>
      <div className='mb-6 flex items-end justify-between border-b border-border pb-3'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl font-bold tracking-tight'>Apps</h1>
          <span className='font-mono text-[11px] uppercase tracking-wider text-muted-foreground'>
            loading directory…
          </span>
        </div>
      </div>
      <AppListSkeleton count={10} />
    </div>
  );
}

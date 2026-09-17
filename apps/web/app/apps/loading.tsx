import { AppListSkeleton } from '@/components/ui/app-list-skeleton';

export default function AppsLoading() {
  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col px-4 py-8 sm:px-6'>
      <div className='flex items-end justify-between border-b border-border pb-3 mb-6'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-3xl font-bold tracking-tight'>The Clone List</h1>
          <span className='font-mono text-[11px] text-muted-foreground uppercase tracking-wider'>ranked by replaced apps</span>
        </div>
        <div className='h-3 w-16 bg-muted animate-pulse rounded' />
      </div>
      
      <AppListSkeleton count={15} />
    </div>
  );
}

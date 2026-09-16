import { AppListSkeleton } from '@/components/ui/app-list-skeleton';

export default function SearchLoading() {
  return (
    <div className='mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6'>
      <div className='flex items-end justify-between border-b border-border pb-2'>
        <h1 className='text-2xl font-bold tracking-tight'>Search</h1>
        <span className='font-mono text-[11px] text-muted-foreground'>Directory</span>
      </div>

      <div className='h-14 w-full bg-muted animate-pulse rounded border border-border' />

      <div className='flex flex-col gap-4'>
        <div className='h-4 w-48 bg-muted animate-pulse rounded' />
        <AppListSkeleton count={8} />
      </div>
    </div>
  );
}

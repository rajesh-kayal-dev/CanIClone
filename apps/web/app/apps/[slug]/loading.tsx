import { Separator } from '@/components/ui/separator';
import { AppListSkeleton } from '@/components/ui/app-list-skeleton';

export default function AppDetailLoading() {
  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14'>
      {/* Header Skeleton */}
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-4'>
          <div className='h-4 w-20 bg-muted animate-pulse rounded' />
          <div className='flex flex-col gap-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <div className='h-8 w-64 bg-muted animate-pulse rounded' />
              <div className='h-6 w-16 bg-muted animate-pulse rounded-full' />
            </div>
            <div className='h-6 w-full max-w-2xl bg-muted animate-pulse rounded' />
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-4'>
          <div className='h-4 w-32 bg-muted animate-pulse rounded' />
          <div className='h-4 w-24 bg-muted animate-pulse rounded' />
          <div className='h-6 w-24 bg-muted animate-pulse rounded' />
          <div className='h-6 w-24 bg-muted animate-pulse rounded' />
        </div>
      </div>

      <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]'>
        <div className='flex min-w-0 flex-col gap-8'>
          <section className='flex flex-col gap-2'>
            <div className='h-4 w-32 bg-muted animate-pulse rounded' />
            <div className='h-4 w-full bg-muted animate-pulse rounded' />
            <div className='h-4 w-5/6 bg-muted animate-pulse rounded' />
            <div className='h-4 w-4/6 bg-muted animate-pulse rounded' />
          </section>

          <div className='h-48 w-full bg-muted animate-pulse rounded border border-border' />
          <div className='h-64 w-full bg-muted animate-pulse rounded border border-border' />
        </div>

        <aside className='flex flex-col gap-4'>
          <div className='h-40 w-full bg-muted animate-pulse rounded border border-border' />
          <div className='h-32 w-full bg-muted animate-pulse rounded border border-border' />
        </aside>
      </div>

      <Separator />

      <section className='flex flex-col gap-6'>
        <div className='flex items-end justify-between gap-4'>
          <div className='flex flex-col gap-1'>
            <div className='h-8 w-40 bg-muted animate-pulse rounded' />
            <div className='h-4 w-64 bg-muted animate-pulse rounded' />
          </div>
          <div className='h-8 w-20 bg-muted animate-pulse rounded' />
        </div>
        <AppListSkeleton count={4} />
      </section>
    </div>
  );
}

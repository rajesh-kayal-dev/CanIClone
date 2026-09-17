import { AppListSkeleton } from '@/components/ui/app-list-skeleton';

export default function AlternativesLoading() {
  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14'>
      <div className='flex flex-col gap-4'>
        <div className='h-4 w-24 bg-muted animate-pulse rounded' />
        <div className='flex flex-col gap-2'>
          <div className='h-8 w-64 bg-muted animate-pulse rounded' />
          <div className='h-4 w-full max-w-2xl bg-muted animate-pulse rounded' />
          <div className='h-4 w-3/4 max-w-2xl bg-muted animate-pulse rounded' />
        </div>
      </div>

      <div className='flex flex-col gap-4'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='h-32 w-full bg-muted animate-pulse rounded border border-border' />
        ))}
      </div>

      <div className='flex flex-col gap-2'>
        <div className='h-6 w-32 bg-muted animate-pulse rounded' />
        <div className='h-4 w-96 bg-muted animate-pulse rounded' />
      </div>

      <AppListSkeleton count={3} />
    </div>
  );
}

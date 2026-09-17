import { AppListSkeleton } from '@/components/ui/app-list-skeleton';

export default function CategoryLoading() {
  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col px-4 py-8 sm:px-6'>
      <div className='flex items-center gap-2 font-mono text-[11px] text-muted-foreground mb-6'>
        <div className='h-3 w-12 bg-muted animate-pulse rounded' />
      </div>

      <div className='flex items-end justify-between border-b border-border pb-2 mb-4'>
        <div className='flex items-center gap-3'>
          <div className='size-6 bg-muted animate-pulse rounded' />
          <div className='h-8 w-48 bg-muted animate-pulse rounded' />
        </div>
        <div className='h-3 w-16 bg-muted animate-pulse rounded' />
      </div>
      
      <div className='flex flex-wrap gap-2 mb-8'>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className='h-6 w-24 bg-muted animate-pulse rounded-full' />
        ))}
      </div>
      
      <AppListSkeleton count={10} />
    </div>
  );
}

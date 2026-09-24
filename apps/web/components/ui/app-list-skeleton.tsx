import React from 'react';

export function AppListRowSkeleton() {
  return (
    <div className='flex items-center justify-between border-b border-border py-[6px] px-2'>
      <div className='flex items-center gap-3 flex-1 min-w-0'>
        <div className='w-6 h-4 bg-muted animate-pulse rounded' />
        <div className='flex items-center gap-3 min-w-0 flex-1'>
          <div className='size-6 bg-muted animate-pulse rounded flex-shrink-0' />
          <div className='h-4 bg-muted animate-pulse rounded w-32' />
        </div>
      </div>
      
      <div className='hidden sm:flex items-center gap-4 flex-1 justify-between'>
        <div className='h-3 bg-muted animate-pulse rounded w-20' />
        <div className='h-3 bg-muted animate-pulse rounded w-12' />
        <div className='h-4 bg-muted animate-pulse rounded w-16' />
        <div className='h-3 bg-muted animate-pulse rounded w-6' />
      </div>
    </div>
  );
}

export function AppListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className='w-full flex flex-col'>
      {/* Controls Skeleton */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border/60 mb-2'>
        <div className='flex items-center gap-4'>
          <div className='h-7 bg-muted animate-pulse rounded w-32' />
          <div className='h-6 bg-muted animate-pulse rounded w-48' />
        </div>
        <div className='h-5 bg-muted animate-pulse rounded w-20' />
      </div>

      {/* Header */}
      <div className='flex items-center justify-between border-b border-border pb-2 px-2 mt-2'>
        <div className='flex items-center gap-4 flex-1 min-w-0'>
          <div className='w-6 h-3 bg-muted animate-pulse rounded' />
          <div className='w-12 h-3 bg-muted animate-pulse rounded ml-1' />
        </div>
        <div className='hidden sm:flex items-center gap-4 flex-1 justify-between'>
          <div className='w-16 h-3 bg-muted animate-pulse rounded' />
          <div className='w-10 h-3 bg-muted animate-pulse rounded' />
          <div className='w-14 h-3 bg-muted animate-pulse rounded' />
          <div className='w-16 h-3 bg-muted animate-pulse rounded' />
        </div>
      </div>
      
      {/* Rows */}
      <div className='flex flex-col'>
        {Array.from({ length: count }).map((_, i) => (
          <AppListRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

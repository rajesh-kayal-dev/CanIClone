import { Separator } from '@/components/ui/separator';
import { AppListSkeleton } from '@/components/ui/app-list-skeleton';

export default function AppDetailLoading() {
  return (
    <div className='mx-auto grid w-full max-w-[1560px] items-start gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-10'>
      <div className='flex min-w-0 flex-col gap-10'>
        <div className='flex flex-col gap-6'>
          <div className='flex flex-col gap-4'>
            <div className='h-4 w-20 animate-pulse rounded bg-muted' />
            <div className='flex flex-col gap-2'>
              <div className='flex flex-wrap items-center gap-2'>
                <div className='h-8 w-64 animate-pulse rounded bg-muted' />
                <div className='h-6 w-16 animate-pulse rounded-full bg-muted' />
              </div>
              <div className='h-6 w-full max-w-2xl animate-pulse rounded bg-muted' />
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-4'>
            <div className='h-4 w-32 animate-pulse rounded bg-muted' />
            <div className='h-4 w-24 animate-pulse rounded bg-muted' />
            <div className='h-6 w-24 animate-pulse rounded-full bg-muted' />
            <div className='h-6 w-24 animate-pulse rounded-full bg-muted' />
          </div>
        </div>

        <section className='flex flex-col gap-2'>
          <div className='h-4 w-32 animate-pulse rounded bg-muted' />
          <div className='h-4 w-full animate-pulse rounded bg-muted' />
          <div className='h-4 w-5/6 animate-pulse rounded bg-muted' />
          <div className='h-4 w-4/6 animate-pulse rounded bg-muted' />
        </section>

        <div className='h-48 w-full animate-pulse rounded border border-border bg-muted' />
        <div className='h-64 w-full animate-pulse rounded border border-border bg-muted' />

        <Separator />

        <section className='flex flex-col gap-6'>
          <div className='flex items-end justify-between gap-4'>
            <div className='flex flex-col gap-1'>
              <div className='h-8 w-40 animate-pulse rounded bg-muted' />
              <div className='h-4 w-64 animate-pulse rounded bg-muted' />
            </div>
            <div className='h-8 w-20 animate-pulse rounded bg-muted' />
          </div>
          <AppListSkeleton count={4} />
        </section>
      </div>

      <aside className='flex min-h-[680px] flex-col gap-4 rounded-xl border border-border/70 bg-card/40 p-4 lg:sticky lg:top-20'>
        <div className='h-10 w-48 animate-pulse rounded bg-muted' />
        <div className='h-24 w-full animate-pulse rounded bg-muted' />
        <div className='h-64 w-full animate-pulse rounded bg-muted' />
      </aside>
    </div>
  );
}

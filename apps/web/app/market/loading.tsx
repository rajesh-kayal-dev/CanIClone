export default function Loading() {
  return (
    <div className='layout-container flex flex-col gap-6 py-6'>
      <div className='flex flex-col gap-2 border-b border-border pb-4'>
        <div className='h-8 w-56 animate-pulse rounded bg-muted' />
        <div className='h-3 w-80 animate-pulse rounded bg-muted' />
      </div>
      <div className='h-10 animate-pulse rounded bg-muted/60' />
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className='h-64 animate-pulse rounded-xl bg-muted/40' />
        ))}
      </div>
    </div>
  );
}

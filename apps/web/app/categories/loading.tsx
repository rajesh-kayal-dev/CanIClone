export default function CategoriesLoading() {
  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14'>
      <div className='flex flex-col gap-1'>
        <div className='h-4 w-32 bg-muted animate-pulse rounded mb-1' />
        <h1 className='text-3xl font-bold tracking-tight mb-1'>Browse by category</h1>
        <div className='h-4 w-full max-w-2xl bg-muted animate-pulse rounded' />
      </div>
      <div className='grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className='h-24 w-full bg-muted animate-pulse rounded-lg border border-border' />
        ))}
      </div>
    </div>
  );
}

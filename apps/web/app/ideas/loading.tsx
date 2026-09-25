export default function IdeasLoading() {
  return (
    <div className='layout-container flex min-h-[calc(100vh-4rem)] flex-col py-8'>
      <div className='mb-5 h-14 animate-pulse rounded-lg bg-muted' />
      <div className='grid min-h-[680px] flex-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]'>
        <div className='animate-pulse rounded-xl border border-border/70 bg-muted/40' />
        <div className='animate-pulse rounded-xl border border-border/70 bg-muted/40' />
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';

export function ConfidenceBar({
  value,
  className
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      role='progressbar'
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Confidence ${value}%`}
      className={cn('h-1 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div
        className='h-full rounded-full bg-primary transition-all'
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
import { cn } from '@/lib/utils';

export function ReportLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground',
        className
      )}
    >
      {children}
    </div>
  );
}

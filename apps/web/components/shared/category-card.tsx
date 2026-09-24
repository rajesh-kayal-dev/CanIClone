import Link from 'next/link';
import { MicroGlyph } from '@/components/ui/micro-glyph';
import type { CategoryWithCount } from '@/lib/api/categories';
import { cn } from '@/lib/utils';

export function formatApproximateCount(count: number): string {
  if (count >= 50) return '50+';
  if (count >= 40) return '40+';
  if (count >= 30) return '30+';
  if (count >= 20) return '20+';
  if (count >= 10) return '10+';
  if (count >= 5) return '5+';
  if (count >= 1) return '1+';
  return '0';
}

function cleanDomainName(domain: string | null): string {
  if (!domain) return '';
  return domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}

export function CategoryCard({
  category,
  className
}: {
  category: CategoryWithCount;
  className?: string;
}) {
  const approxCount = formatApproximateCount(category.appCount);
  const sampleApps = (category.sampleApps || []).slice(0, 3);

  return (
    <Link
      href={`/categories/${category.slug}`}
      prefetch={false}
      className={cn(
        'group/cat flex flex-col justify-between rounded-lg border border-border/70 bg-card p-4 transition-all duration-150 hover:border-foreground/30 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
    >
      <div>
        {/* Header row: Glyph + App Count */}
        <div className='flex items-center justify-between gap-2 mb-3'>
          <div className='flex size-7 items-center justify-center rounded border border-border/60 bg-muted/40 text-foreground transition-colors group-hover/cat:border-foreground/30 group-hover/cat:bg-muted/80'>
            <MicroGlyph name={category.slug} className='size-3.5 opacity-90' />
          </div>
          <span className='font-mono text-[11px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/40 tabular-nums'>
            {approxCount}
          </span>
        </div>

        {/* Category Name */}
        <h3 className='font-semibold text-sm tracking-tight text-foreground group-hover/cat:text-foreground mb-1 line-clamp-1'>
          {category.name}
        </h3>

        {/* Description */}
        <p className='text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4 min-h-[2.25rem]'>
          {category.description}
        </p>
      </div>

      {/* Footer row: Sample App Icons + Browse affordance */}
      <div className='flex items-center justify-between gap-2 border-t border-border/40 pt-3 mt-auto'>
        {/* Ecosystem signals: small app icons */}
        <div className='flex items-center gap-1 min-w-0'>
          {sampleApps.length > 0 ? (
            <div className='flex items-center -space-x-1.5 overflow-hidden py-0.5'>
              {sampleApps.map((app) => {
                const domain = cleanDomainName(app.domain);
                const initials = app.name ? app.name.substring(0, 2).toUpperCase() : '??';

                return (
                  <div
                    key={app.slug}
                    title={app.name}
                    className='relative flex size-4.5 items-center justify-center rounded-full border border-background bg-muted text-[8px] font-mono text-muted-foreground overflow-hidden flex-shrink-0 ring-1 ring-border/30'
                  >
                    {domain ? (
                      <>
                        {/* Official domain favicon; preserve the real provider asset. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                          alt={app.name}
                          loading='lazy'
                          className='size-full object-cover'
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </>
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <span className='font-mono text-[10px] text-muted-foreground/60'>
              ·
            </span>
          )}
        </div>

        {/* Browse affordance */}
        <span className='inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors group-hover/cat:text-foreground'>
          Browse
          <span className='inline-block transition-transform duration-150 group-hover/cat:translate-x-0.5'>
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
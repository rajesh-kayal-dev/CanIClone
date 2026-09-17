import React from 'react';
import { cn } from '@/lib/utils';

interface AppListRowProps {
  app: any;
  rank: number;
}

export function AppListRow({ app, rank }: AppListRowProps) {
  const replacedCount = app.alternatives?.length || 0;
  
  let cleanDomain = '';
  if (app.officialUrl) {
    try {
      cleanDomain = new URL(app.officialUrl).hostname;
    } catch {
      // Ignore invalid URLs
    }
  }

  const fallbackInitials = app.name ? app.name.substring(0, 2).toUpperCase() : '??';

  return (
    <div className='flex items-center justify-between border-b border-border py-[6px] px-2 text-sm hover:bg-muted/30 transition-colors'>
      <div className='flex items-center gap-3 flex-1 min-w-0'>
        <span className='font-mono text-muted-foreground w-6 text-right text-[13px]'>
          {String(rank).padStart(2, '0')}
        </span>
        <div className='flex items-center gap-3 min-w-0 flex-1'>
          <div className='flex-shrink-0 size-6 bg-muted rounded overflow-hidden border border-border/50 flex items-center justify-center font-mono text-[9px] text-muted-foreground bg-muted/50'>
            {cleanDomain ? (
              <img 
                src={`https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=64`} 
                alt={`${app.name} icon`}
                className='w-full h-full object-cover'
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const fallback = document.createElement('span');
                    fallback.innerText = fallbackInitials;
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <span>{fallbackInitials}</span>
            )}
          </div>
          <span className='font-medium truncate text-[15px]'>{app.name}</span>
        </div>
      </div>
      
      <div className='hidden sm:flex items-center gap-4 flex-1 justify-between'>
        <div className='flex items-center min-w-[140px]'>
          <span className='font-mono text-[10px] uppercase text-muted-foreground truncate'>
            {app.category.replace(/-/g, ' ')}
          </span>
        </div>
        
        <span className='font-mono text-[11px] text-foreground w-20 truncate'>
          {app.pricing || 'Free'}
        </span>
        
        <div className='w-24'>
          <span 
            className={cn(
              'font-mono text-[10px] font-bold uppercase rounded-sm px-1.5 py-0.5 whitespace-nowrap',
              app.verdict === 'YES' ? 'bg-green-500/10 text-green-600' : 
              app.verdict === 'KINDA' ? 'bg-yellow-500/10 text-yellow-600' : 
              'bg-red-500/10 text-red-600'
            )}
          >
            {app.verdict || 'KINDA'}
          </span>
        </div>
        
        <span className='font-mono text-[12px] text-foreground w-12 text-right'>
          {replacedCount}
        </span>
      </div>
    </div>
  );
}

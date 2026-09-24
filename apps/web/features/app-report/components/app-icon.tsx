'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

interface AppIconProps {
  name: string;
  officialUrl?: string;
  className?: string;
}

/**
 * App logo resolution priority:
 *   1. (reserved) a stored verified official logo — none in the dataset today
 *   2. the app's own official domain favicon  (https://<host>/favicon.ico)
 *   3. a trusted favicon provider for that domain (Google s2)
 *   4. a neutral monogram fallback
 *
 * Sources are tried in order via onError; we never substitute a category glyph,
 * generated image, or screenshot for a real logo.
 */
export function AppIcon({ name, officialUrl, className }: AppIconProps) {
  const [sourceIndex, setSourceIndex] = React.useState(0);
  const imgRef = React.useRef<HTMLImageElement>(null);

  let hostname = '';
  if (officialUrl) {
    try {
      hostname = new URL(officialUrl).hostname;
    } catch {
      hostname = '';
    }
  }

  const sources = React.useMemo(() => {
    if (!hostname) return [] as string[];
    return [
      `https://${hostname}/favicon.ico`,
      `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
    ];
  }, [hostname]);

  const src = sources[sourceIndex];
  const initials = name ? name.substring(0, 2).toUpperCase() : '??';

  const advance = React.useCallback(() => setSourceIndex((i) => i + 1), []);

  // An image can fail before hydration attaches onError; catch that case on mount.
  React.useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) advance();
  }, [src, advance]);

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted font-mono text-muted-foreground',
        className
      )}
      aria-hidden='true'
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src}
          alt=''
          className='size-full object-cover'
          onError={advance}
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}

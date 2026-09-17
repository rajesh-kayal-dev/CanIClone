'use client';

import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';

export function BackButton({ fallbackPath = '/' }: { fallbackPath?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackPath);
        }
      }}
      className='inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors'
    >
      <Icons.chevronLeft className='size-3' /> back
    </button>
  );
}

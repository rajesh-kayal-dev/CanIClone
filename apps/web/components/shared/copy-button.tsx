'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import * as React from 'react';

export function CopyButton({ text, label = 'Copy prompt' }: { text: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [text]);

  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      onClick={handleCopy}
      aria-live='polite'
    >
      {copied ? <Icons.check className='text-emerald-500' /> : <Icons.forms />}
      {copied ? 'Copied' : label}
    </Button>
  );
}
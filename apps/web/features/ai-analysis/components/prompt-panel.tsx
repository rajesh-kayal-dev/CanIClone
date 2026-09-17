import { Icons } from '@/components/icons';
import { CopyButton } from '@/components/shared/copy-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AppRecord } from '@/lib/api/types';

export function PromptPanel({ app }: { app: AppRecord }) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-start justify-between gap-3'>
        <div className='flex flex-col gap-1'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.sparkles className='size-4 text-primary' />
            Get the build prompt
          </CardTitle>
          <p className='text-sm text-muted-foreground'>
            Paste into your favorite AI builder or coding agent to scaffold this app.
          </p>
        </div>
        <CopyButton text={app.prompt} />
      </CardHeader>
      <CardContent>
        <div className='relative overflow-hidden rounded-xl border border-border bg-muted/40 p-4'>
          <pre className='max-h-80 overflow-auto text-sm leading-relaxed whitespace-pre-wrap text-foreground/90'>
            {app.prompt}
          </pre>
        </div>
        <p className='mt-3 flex items-start gap-1.5 text-xs text-muted-foreground'>
          <Icons.info className='mt-0.5 size-3.5 shrink-0' />
          Prompts are illustrative starting points, not guarantees. Models change, data matters, and
          shipping is where the real work lives.
        </p>
      </CardContent>
    </Card>
  );
}
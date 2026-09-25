import type { AppRecord } from '@/lib/api/types';

import { PromptActions } from '@/features/ai-workspace/components/prompt-actions';
import { ReportLabel } from './report-label';

export function ReportPrompt({ app }: { app: AppRecord }) {
  if (!app.prompt) {
    return (
      <section className='flex flex-col gap-3'>
        <ReportLabel>the prompt</ReportLabel>
        <div className='rounded-lg border border-border bg-muted/20 p-4 font-mono text-sm text-muted-foreground'>
          No build prompt is available for {app.name} yet.
        </div>
      </section>
    );
  }

  return (
    <section className='flex flex-col gap-3'>
      <div className='flex flex-col gap-3 rounded-t-lg border border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
        <ReportLabel>the prompt</ReportLabel>
        <PromptActions prompt={app.prompt} />
      </div>
      <div className='rounded-b-lg border border-t-0 border-border bg-muted/10 p-5'>
        <pre className='font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-foreground/90'>
          {app.prompt}
        </pre>
      </div>
      <p className='font-mono text-[11px] leading-relaxed text-muted-foreground'>
        <span className='text-emerald-600 dark:text-emerald-400'>$</span> open in your agent (prompt
        copied, you press enter) or copy it raw · this prompt is generated from the build plan
      </p>
    </section>
  );
}

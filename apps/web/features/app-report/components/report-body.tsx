import { Icons } from '@/components/icons';
import type { AppRecord } from '@/lib/api/types';

import { ReportLabel } from './report-label';

export function ReportWhyPay({ app }: { app: AppRecord }) {
  if (!app.whyPeopleStillPay && !app.moatNotes) return null;
  return (
    <section className='flex flex-col gap-3'>
      <ReportLabel>why people still pay</ReportLabel>
      {app.whyPeopleStillPay && (
        <p className='max-w-3xl font-mono text-sm leading-relaxed text-foreground/90'>
          {app.whyPeopleStillPay}
        </p>
      )}
      {app.moatNotes && (
        <p className='max-w-3xl font-mono text-[12px] leading-relaxed text-muted-foreground'>
          moat: {app.moatNotes}
        </p>
      )}
    </section>
  );
}

export function ReportLose({ app }: { app: AppRecord }) {
  if (app.whatYouLose.length === 0) return null;
  return (
    <section className='flex flex-col gap-3'>
      <ReportLabel>what you lose</ReportLabel>
      <ul className='flex flex-col'>
        {app.whatYouLose.map((item) => (
          <li
            key={item}
            className='flex items-center gap-3 border-b border-border/60 py-2 last:border-b-0'
          >
            <span className='flex size-4 shrink-0 items-center justify-center rounded-[3px] bg-red-500/15 text-red-500'>
              <Icons.close className='size-2.5' strokeWidth={3} />
            </span>
            <span className='font-mono text-sm text-foreground/90'>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ReportSignal({ app }: { app: AppRecord }) {
  const metrics: { label: string; value: string }[] = [
    { label: 'community votes', value: String(app.voteCount) },
    { label: 'ai confidence', value: `${app.confidence}%` }
  ];
  if (app.openSource.length > 0) {
    metrics.push({ label: 'free alternatives', value: String(app.openSource.length) });
  }
  if (app.priorArt.length > 0) {
    metrics.push({ label: 'prior art', value: String(app.priorArt.length) });
  }
  if (app.verifiedOneShot) {
    metrics.push({ label: 'one-shot', value: 'verified' });
  }

  return (
    <section className='flex flex-col gap-3'>
      <ReportLabel>community / build signal</ReportLabel>
      <div className='flex flex-wrap items-center gap-x-6 gap-y-2'>
        {metrics.map((metric) => (
          <span key={metric.label} className='inline-flex items-baseline gap-2'>
            <span className='font-mono text-sm font-bold text-foreground'>{metric.value}</span>
            <span className='font-mono text-[11px] uppercase tracking-widest text-muted-foreground'>
              {metric.label}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}

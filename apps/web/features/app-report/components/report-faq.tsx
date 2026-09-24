'use client';

import * as React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import type { AppRecord } from '@/lib/api/types';

import { ReportLabel } from './report-label';

interface FaqEntry {
  value: string;
  question: string;
  answer: string;
}

function buildEntries(app: AppRecord): FaqEntry[] {
  const entries: FaqEntry[] = [];

  const verdictPhrase =
    app.verdict === 'NO' ? 'Not really' : app.verdict === 'KINDA' ? 'Kinda' : 'Yes';
  if (app.description) {
    entries.push({
      value: 'clone',
      question: `Can I clone ${app.name}?`,
      answer: `${verdictPhrase}. ${app.description}`
    });
  }

  entries.push({
    value: 'cost',
    question: `How much does ${app.name} cost?`,
    answer:
      app.pricingPlans.length > 0
        ? `${app.pricing} to start. The table above lists all ${app.pricingPlans.length} tracked plans.`
        : `${app.pricing}.`
  });

  if (app.whatYouLose.length > 0) {
    entries.push({
      value: 'lose',
      question: `What do I lose by replacing ${app.name}?`,
      answer: app.whatYouLose.join(' · ')
    });
  }

  entries.push({
    value: 'oss',
    question: `Is there an open-source alternative to ${app.name}?`,
    answer:
      app.openSource.length > 0
        ? `Yes — ${app.openSource.map((alt) => alt.name).join(', ')}.`
        : 'None tracked yet.'
  });

  if (app.diyTimeEstimate) {
    entries.push({
      value: 'time',
      question: 'How long would a DIY build take?',
      answer: app.coreLoopDIY
        ? `${app.diyTimeEstimate}. ${app.coreLoopDIY}`
        : app.diyTimeEstimate
    });
  }

  return entries;
}

export function ReportFaq({ app }: { app: AppRecord }) {
  const entries = React.useMemo(() => buildEntries(app), [app]);
  if (entries.length === 0) return null;

  return (
    <section className='flex flex-col gap-4'>
      <ReportLabel>questions</ReportLabel>
      <Accordion defaultValue={[entries[0].value]}>
        {entries.map((entry) => (
          <AccordionItem key={entry.value} value={entry.value}>
            <AccordionTrigger className='font-mono text-sm font-semibold'>
              {entry.question}
            </AccordionTrigger>
            <AccordionContent className='font-mono text-[13px] leading-relaxed text-muted-foreground'>
              {entry.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

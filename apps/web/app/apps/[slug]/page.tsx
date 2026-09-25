import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { BackButton } from '@/components/ui/back-button';
import { ErrorState } from '@/components/shared/error-state';
import { getAppBySlug, getRelatedApps } from '@/lib/api/apps';
import { getOpportunityBySlug } from '@/lib/api/opportunities';
import type { AppRecord } from '@/lib/api/types';

import { ReportHero } from '@/features/app-report/components/report-hero';
import { ReportPrompt } from '@/features/app-report/components/report-prompt';
import { ReportWhyPay, ReportLose, ReportSignal } from '@/features/app-report/components/report-body';
import { ReportActions } from '@/features/app-report/components/report-actions';
import { ReportOpportunity } from '@/features/app-report/components/report-opportunity';
import { ReportEscape } from '@/features/app-report/components/report-escape';
import { ReportRelated } from '@/features/app-report/components/report-related';
import { ReportPricing } from '@/features/app-report/components/report-pricing';
import { ReportFaq } from '@/features/app-report/components/report-faq';
import { AppAssistantPanel } from '@/features/app-assistant/components/app-assistant-panel';

export function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return params.then(async ({ slug }) => {
    try {
      const app = await getAppBySlug(slug);
      if (!app) return { title: 'App not found' };
      return { title: `Can I clone ${app.name}?`, description: app.tagline };
    } catch {
      return { title: 'App', description: 'Could not load this review right now.' };
    }
  });
}

export default async function AppDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let app: AppRecord | null = null;
  try {
    app = await getAppBySlug(slug);
  } catch {
    return <ErrorState title='Could not load this app' />;
  }
  if (!app) notFound();

  const [relatedResult, opportunityResult] = await Promise.allSettled([
    getRelatedApps(app, 3),
    getOpportunityBySlug(slug),
  ]);
  const related: AppRecord[] =
    relatedResult.status === 'fulfilled' ? relatedResult.value : [];
  const opportunity =
    opportunityResult.status === 'fulfilled' ? opportunityResult.value : null;

  return (
    <div className='mx-auto grid w-full max-w-[1560px] items-start gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-10'>
      <div className='flex min-w-0 flex-col gap-10'>
        <BackButton fallbackPath='/apps' />

        <ReportHero app={app} />

        <ReportPrompt app={app} />

        <ReportWhyPay app={app} />

        <ReportLose app={app} />

        <ReportSignal app={app} />

        <ReportActions app={app} />

        {opportunity && <ReportOpportunity opportunity={opportunity} />}

        <ReportEscape app={app} />

        <ReportRelated apps={related} />

        <ReportPricing app={app} />

        <ReportFaq app={app} />
      </div>

      <AppAssistantPanel app={app} />
    </div>
  );
}

import type { AppRecord, PricingPlanRecord } from '@/lib/api/types';

import { ReportLabel } from './report-label';

function money(value: string | null, per: string | null): string {
  if (value === null) return '—';
  const suffix = per && per !== 'flat' ? `/${per}` : '';
  return `$${value}${suffix}`;
}

export function ReportPricing({ app }: { app: AppRecord }) {
  const plans: PricingPlanRecord[] = app.pricingPlans;

  return (
    <section className='flex flex-col gap-4'>
      <div className='flex flex-col gap-2'>
        <ReportLabel>the numbers</ReportLabel>
        <h2 className='text-xl font-bold tracking-tight sm:text-2xl'>{app.name} pricing</h2>
      </div>

      {plans.length === 0 ? (
        <p className='font-mono text-sm text-muted-foreground'>
          Pricing isn&apos;t tracked for {app.name} yet — expect it to vary.
        </p>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[560px] border-collapse text-left'>
            <thead>
              <tr className='border-b border-border'>
                <th className='py-2 pr-4 font-mono text-[10px] font-medium tracking-widest text-muted-foreground uppercase'>
                  plan
                </th>
                <th className='py-2 pr-4 font-mono text-[10px] font-medium tracking-widest text-muted-foreground uppercase'>
                  monthly
                </th>
                <th className='py-2 pr-4 font-mono text-[10px] font-medium tracking-widest text-muted-foreground uppercase'>
                  annual (per mo)
                </th>
                <th className='py-2 font-mono text-[10px] font-medium tracking-widest text-muted-foreground uppercase'>
                  what you get
                </th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.name} className='border-b border-border/60 align-top'>
                  <td className='py-3 pr-4 font-mono text-sm font-semibold text-foreground'>
                    {plan.name}
                  </td>
                  <td className='py-3 pr-4 font-mono text-sm text-foreground'>
                    {money(plan.monthly, plan.per)}
                  </td>
                  <td className='py-3 pr-4 font-mono text-sm text-foreground'>
                    {money(plan.annualPerMonth, plan.per)}
                  </td>
                  <td className='py-3 font-mono text-[12px] leading-relaxed text-muted-foreground'>
                    {plan.limits ?? '—'}
                    {plan.notes && <span className='block text-[11px] opacity-70'>{plan.notes}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

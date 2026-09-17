'use client';

import { useMemo } from 'react';
import { ApiMarketTrend } from '@/lib/api/types';
import Link from 'next/link';
import { Icons } from '@/components/icons';

interface MarketInsightsProps {
  trending: ApiMarketTrend[];
  overview: ApiMarketTrend[];
}

export function MarketInsights({ trending, overview }: MarketInsightsProps) {
  // Dynamically derive meaningful insights from the active market dataset
  const insights = useMemo(() => {
    const list: Array<{ icon: string; text: string }> = [];

    // 1. Top rising query / app
    const topGainer = trending.find((t) => t.growthPercent && t.growthPercent > 0) || trending[0];
    if (topGainer) {
      const gName = topGainer.app?.name || topGainer.query || 'AI Tools';
      const gVal = topGainer.growthPercent ? `+${topGainer.growthPercent}%` : 'surging';
      list.push({
        icon: '📈',
        text: `Search interest for "${gName}" is up ${gVal} in the recent evaluation period.`,
      });
    } else {
      list.push({
        icon: '📈',
        text: 'Developer and productivity tools continue to show steady market momentum.',
      });
    }

    // 2. Leader in absolute interest
    const topLeader = overview[0];
    if (topLeader) {
      const leaderName = topLeader.app?.name || topLeader.query || 'Top Apps';
      list.push({
        icon: '📊',
        text: `${leaderName} commands high search interest index across global queries.`,
      });
    } else {
      list.push({
        icon: '📊',
        text: 'Search volume indexes remain concentrated in established SaaS workflows.',
      });
    }

    // 3. Category observation
    list.push({
      icon: '📱',
      text: 'Productivity and AI utilities dominate user attention across mobile and desktop.',
    });

    // 4. Growth signal
    const secondGainer = trending[1] || trending[0];
    if (secondGainer && secondGainer !== topGainer) {
      const sName = secondGainer.app?.name || secondGainer.query;
      list.push({
        icon: '✨',
        text: `Emerging tools like "${sName}" are showing strong breakout adoption signals.`,
      });
    } else {
      list.push({
        icon: '✨',
        text: 'Specialized workflow and automation utilities are showing strong breakout interest.',
      });
    }

    return list;
  }, [trending, overview]);

  return (
    <div className="flex flex-col gap-4">
      {/* Insights Card */}
      <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 flex flex-col gap-3.5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-base">💡</span>
          <h3 className="font-semibold text-sm text-foreground tracking-tight">Market Insights</h3>
        </div>

        <div className="flex flex-col gap-3">
          {insights.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <span className="text-sm shrink-0 mt-0.5">{item.icon}</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Build What's Next Banner */}
      <div className="rounded-xl p-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 text-white shadow-lg flex items-center justify-between gap-3 relative overflow-hidden group">
        <div className="flex flex-col gap-1 z-10">
          <h4 className="font-bold text-sm tracking-tight">Build what&apos;s next.</h4>
          <p className="text-[11px] text-blue-100/90 leading-snug">
            Explore apps, get AI insights, and start cloning ideas.
          </p>
        </div>

        <Link
          href="/apps"
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center shrink-0 text-white transition-all transform group-hover:scale-105"
          aria-label="Explore Apps"
        >
          <Icons.arrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

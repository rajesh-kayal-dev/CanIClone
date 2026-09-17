'use client';

import { useState, useMemo } from 'react';
import { ApiMarketTrend } from '@/lib/api/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';

interface MarketChartProps {
  overview: ApiMarketTrend[];
  timeframe?: '30D' | '90D' | '12M';
}

interface TimelineItem {
  date?: string;
  time?: string;
  timestamp?: string;
  formattedTime?: string;
  formattedAxisTime?: string;
  values?: Array<{
    query: string;
    value?: string | number;
    extracted_value?: string | number;
  }>;
}

const LINE_COLORS = [
  '#3b82f6', // Blue (ChatGPT / Primary)
  '#a855f7', // Purple (Claude)
  '#10b981', // Emerald (Gemini)
  '#f97316', // Orange (Cursor)
  '#ec4899', // Pink (Perplexity)
  '#06b6d4', // Cyan
  '#eab308', // Amber
];

/**
 * Normalizes any timeline date format into a short, clean, valid display date (e.g. "Sep 13", "Aug 22").
 */
function normalizeDate(tp: TimelineItem): string {
  if (tp.formattedAxisTime) return tp.formattedAxisTime;
  if (tp.formattedTime) return tp.formattedTime;

  // Check if date string exists, e.g. "Sep 13 – 19, 2026" or "Aug 18, 2026"
  if (tp.date) {
    const cleanDate = tp.date.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    const firstPart = cleanDate.split(/[–—-]/)[0]?.trim();
    if (firstPart) {
      // Look for Month + Day e.g. "Sep 13"
      const match = firstPart.match(/^([A-Za-z]{3,9})\s+(\d{1,2})/);
      if (match) {
        const month = match[1].substring(0, 3);
        const day = match[2].padStart(2, '0');
        return `${month} ${day}`;
      }
      // Try parsing direct date string
      const parsed = Date.parse(firstPart);
      if (!isNaN(parsed)) {
        const d = new Date(parsed);
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      }
    }
  }

  // Check timestamp / time
  const rawTime = tp.timestamp || tp.time;
  if (rawTime) {
    const num = typeof rawTime === 'string' ? parseInt(rawTime, 10) : rawTime;
    if (!isNaN(num) && num > 0) {
      // Check if seconds (epoch < 1e11) vs milliseconds
      const d = new Date(num > 1e11 ? num : num * 1000);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      }
    }
  }

  return tp.date || '';
}

export function MarketChart({ overview, timeframe = '30D' }: MarketChartProps) {
  // Filter items that have timelineData
  const validItems = useMemo(() => {
    return overview.filter(
      (item) => item.timelineData && Array.isArray(item.timelineData) && item.timelineData.length > 0
    );
  }, [overview]);

  // Initial active lines
  const [selectedApps, setSelectedApps] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    validItems.forEach((item, idx) => {
      const name = item.app?.name || item.query || `App ${idx + 1}`;
      initial[name] = true;
    });
    return initial;
  });

  const toggleApp = (appName: string) => {
    setSelectedApps((prev) => ({
      ...prev,
      [appName]: !prev[appName],
    }));
  };

  // Find the base timeline with highest length
  const baseTimeline = useMemo<TimelineItem[]>(() => {
    if (validItems.length === 0) return [];
    const longest = validItems.reduce((prev, current) => {
      const prevLen = Array.isArray(prev.timelineData) ? prev.timelineData.length : 0;
      const currLen = Array.isArray(current.timelineData) ? current.timelineData.length : 0;
      return currLen > prevLen ? current : prev;
    });

    const list = (longest.timelineData as TimelineItem[]) || [];

    // Slice based on timeframe
    if (timeframe === '30D') {
      return list.slice(-8); // Last 8 weekly points (~2 months / 30-60d)
    } else if (timeframe === '90D') {
      return list.slice(-14);
    }
    return list;
  }, [validItems, timeframe]);

  // Transform data for Recharts
  const chartData = useMemo(() => {
    if (baseTimeline.length === 0) return [];

    return baseTimeline.map((timePoint, index) => {
      const dateLabel = normalizeDate(timePoint) || `Point ${index + 1}`;
      const dataPoint: Record<string, string | number> = {
        name: dateLabel,
      };

      validItems.forEach((item, appIdx) => {
        const appName = item.app?.name || item.query || `App ${appIdx + 1}`;
        const timeline = (item.timelineData as TimelineItem[]) || [];
        
        // Match by timestamp or date or index
        const matched =
          timeline.find(
            (t) =>
              (t.timestamp && t.timestamp === timePoint.timestamp) ||
              (t.date && t.date === timePoint.date) ||
              (t.time && t.time === timePoint.time)
          ) || timeline[index];

        if (matched && matched.values) {
          const valObj = matched.values.find(
            (v) =>
              v.query.toLowerCase() === appName.toLowerCase() ||
              v.query.toLowerCase() === (item.query || '').toLowerCase()
          ) || matched.values[appIdx] || matched.values[0];

          if (valObj) {
            const rawVal = valObj.extracted_value ?? valObj.value ?? 0;
            const parsed = typeof rawVal === 'string' ? parseInt(rawVal, 10) : Number(rawVal);
            dataPoint[appName] = isNaN(parsed) ? 0 : parsed;
          } else {
            dataPoint[appName] = 0;
          }
        } else {
          dataPoint[appName] = 0;
        }
      });

      return dataPoint;
    });
  }, [baseTimeline, validItems]);

  if (validItems.length === 0 || chartData.length === 0) {
    return (
      <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
        <Icons.info className="h-6 w-6 mb-2 opacity-50" />
        <p className="text-sm font-medium">Search interest timeline data unavailable.</p>
        <p className="text-xs text-muted-foreground/80 mt-1">
          Historical Google Trends data will appear after the market sync completes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Chart Canvas */}
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 12, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="hsl(var(--border) / 0.4)" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              dy={6}
              minTickGap={20}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                return (
                  <div className="rounded-lg border border-border bg-popover/95 p-2.5 shadow-xl backdrop-blur-md text-xs">
                    <div className="font-semibold text-foreground mb-1.5 border-b border-border/50 pb-1">
                      {label}
                    </div>
                    <div className="flex flex-col gap-1">
                      {payload.map((entry) => {
                        if (!selectedApps[entry.name as string]) return null;
                        return (
                          <div key={entry.name} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-muted-foreground">{entry.name}:</span>
                            </div>
                            <span className="font-mono font-bold text-foreground">
                              {entry.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
            />
            {validItems.map((item, idx) => {
              const name = item.app?.name || item.query || `App ${idx + 1}`;
              const isVisible = selectedApps[name] ?? true;
              const color = LINE_COLORS[idx % LINE_COLORS.length];

              if (!isVisible) return null;

              return (
                <Line
                  key={item.id || name}
                  type="monotone"
                  dataKey={name}
                  stroke={color}
                  strokeWidth={2.2}
                  dot={false}
                  activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: 'hsl(var(--background))' }}
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Legend / Filter Toggles */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-border/40">
        {validItems.map((item, idx) => {
          const name = item.app?.name || item.query || `App ${idx + 1}`;
          const isSelected = selectedApps[name] ?? true;
          const color = LINE_COLORS[idx % LINE_COLORS.length];

          return (
            <button
              key={item.id || name}
              type="button"
              onClick={() => toggleApp(name)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer select-none',
                isSelected
                  ? 'bg-muted/80 text-foreground border border-border/80 shadow-xs'
                  : 'bg-muted/20 text-muted-foreground/60 border border-transparent line-through hover:text-muted-foreground'
              )}
            >
              <span
                className={cn(
                  'w-3 h-3 rounded-sm flex items-center justify-center text-[9px] text-white font-bold transition-opacity',
                  !isSelected && 'opacity-30'
                )}
                style={{ backgroundColor: color }}
              >
                {isSelected && '✓'}
              </span>
              <span className="truncate max-w-[120px]">{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

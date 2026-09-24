import { Request, Response } from 'express';
import { prisma } from '@caniclone/database';

import * as MarketService from '../services/market.service.js';
import * as TrendsApiService from '../services/trends-api.service.js';

const VERIFIED_MAPPING: Record<string, string> = {
  chatgpt: 'com.openai.chatgpt',
  claude: 'com.anthropic.claude',
  perplexity: 'ai.perplexity.app',
  notion: 'notion.id',
};

function readCache(res: Response): void {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
}

export async function getTrending(_req: Request, res: Response) {
  try {
    const trending = await MarketService.getMarketTrending();
    readCache(res);
    return res.json({ data: trending });
  } catch (error) {
    console.error('Error in getTrending:', error);
    return res.status(500).json({ error: 'Failed to fetch cached market data' });
  }
}

export async function getOverview(_req: Request, res: Response) {
  try {
    const overview = await MarketService.getMarketOverview();
    readCache(res);
    return res.json({ data: overview });
  } catch (error) {
    console.error('Error in getOverview:', error);
    return res.status(500).json({ error: 'Failed to fetch cached market data' });
  }
}

export async function getSummary(_req: Request, res: Response) {
  try {
    const types = ['App Store Top Free', 'App Store Top Paid', 'Google Play'];
    const [market, cachedCharts] = await Promise.all([
      MarketService.getMarketSummary(),
      TrendsApiService.getCachedTopChartsFor(types),
    ]);
    const topCharts = types.map((type) => {
      const cached = cachedCharts.get(type);
      return {
        chart: type === 'Google Play' ? 'Google Play Top Free' : type,
        data: cached?.data ?? [],
        fetchedAt: cached?.fetchedAt?.toISOString() ?? null,
        ...(cached?.data ? {} : { error: 'No cached data available' }),
      };
    });
    readCache(res);
    return res.json({
      data: { ...market, topCharts },
    });
  } catch (error) {
    console.error('Error in getSummary:', error);
    return res.status(500).json({ error: 'Failed to read cached market data' });
  }
}

export async function getAppMarketData(req: Request, res: Response) {
  try {
    const slug = req.params.slug as string;
    const data = await MarketService.getAppMarketData(slug);
    if (!data) return res.status(404).json({ error: 'Market data not found for this app' });
    readCache(res);
    return res.json({ data });
  } catch (error) {
    console.error('Error in getAppMarketData:', error);
    return res.status(500).json({ error: 'Failed to fetch cached app market data' });
  }
}

/** Reads MarketCache only. External Trends API calls belong to the sync command. */
export async function getTopChartsData(_req: Request, res: Response) {
  try {
    const charts = [
      { name: 'App Store Top Free', type: 'App Store Top Free' },
      { name: 'App Store Top Paid', type: 'App Store Top Paid' },
      { name: 'Google Play Top Free', type: 'Google Play' },
    ];
    const data = await Promise.all(
      charts.map(async ({ name, type }) => {
        const cached = await TrendsApiService.getCachedTopCharts(type);
        return {
          chart: name,
          data: cached.data ?? [],
          fetchedAt: cached.fetchedAt?.toISOString() ?? null,
          ...(cached.data ? {} : { error: 'No cached data available' }),
        };
      }),
    );
    readCache(res);
    return res.json({ data });
  } catch (error) {
    console.error('Error in getTopChartsData:', error);
    return res.status(500).json({ error: 'Failed to read cached top charts' });
  }
}

/** Reads cached Trends API signals only; it never refreshes them on a page view. */
export async function getTrendsApiData(req: Request, res: Response) {
  try {
    const slug = req.params.slug as string;
    const app = await prisma.app.findUnique({ where: { slug }, select: { slug: true } });
    if (!app) return res.status(404).json({ error: 'App not found' });

    const identifier = VERIFIED_MAPPING[slug];
    if (!identifier) {
      return res.json({ data: null, message: 'No verified identifier for Trends API' });
    }

    const signals = await TrendsApiService.getCachedAppSignals(identifier);
    readCache(res);
    return res.json({
      data: {
        identifier,
        growth: signals.growth.data,
        timeSeries: signals.timeSeries.data,
        fetchedAt:
          signals.growth.fetchedAt && signals.timeSeries.fetchedAt
            ? new Date(
                Math.min(
                  signals.growth.fetchedAt.getTime(),
                  signals.timeSeries.fetchedAt.getTime(),
                ),
              ).toISOString()
            : signals.growth.fetchedAt?.toISOString() ?? signals.timeSeries.fetchedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error('Error in getTrendsApiData:', error);
    return res.status(500).json({ error: 'Failed to read cached Trends API data' });
  }
}

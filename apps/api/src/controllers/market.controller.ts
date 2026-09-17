import { Request, Response } from 'express';
import * as MarketService from '../services/market.service.js';
import { prisma } from '@caniclone/database';
import * as TrendsApiService from '../services/trends-api.service.js';

export async function getTrending(req: Request, res: Response) {
  try {
    const trending = await MarketService.getMarketTrending();
    res.json({ data: trending });
  } catch (error) {
    console.error('Error in getTrending:', error);
    res.status(500).json({
      error: 'Failed to fetch trending market data',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function getOverview(req: Request, res: Response) {
  try {
    const overview = await MarketService.getMarketOverview();
    res.json({ data: overview });
  } catch (error) {
    console.error('Error in getOverview:', error);
    res.status(500).json({ error: 'Failed to fetch market overview' });
  }
}

export async function getAppMarketData(req: Request, res: Response) {
  try {
    const slug = req.params.slug as string;
    const data = await MarketService.getAppMarketData(slug);
    if (!data) {
      return res.status(404).json({ error: 'Market data not found for this app' });
    }
    res.json({ data });
  } catch (error) {
    console.error('Error in getAppMarketData:', error);
    res.status(500).json({ error: 'Failed to fetch app market data' });
  }
}

export async function getTopChartsData(req: Request, res: Response) {
  try {
    const charts = [
      { name: 'App Store Top Free', type: 'App Store Top Free' },
      { name: 'App Store Top Paid', type: 'App Store Top Paid' },
      { name: 'Google Play Top Free', type: 'Google Play' },
    ];
    const results = await Promise.all(
      charts.map(async ({ name, type }) => {
        try {
          const data = await TrendsApiService.getTopCharts(type);
          return { chart: name, data };
        } catch (e: any) {
          return { chart: name, error: e?.message || 'Unavailable' };
        }
      })
    );
    res.json({ data: results });
  } catch (error) {
    console.error('Error in getTopChartsData:', error);
    res.status(500).json({ error: 'Failed to fetch top charts' });
  }
}

export async function getTrendsApiData(req: Request, res: Response) {
  try {
    const slug = req.params.slug as string;
    const app = await prisma.app.findUnique({ where: { slug } });
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    const verifiedMapping: Record<string, string> = {
      chatgpt: 'com.openai.chatgpt',
      claude: 'com.anthropic.claude',
      perplexity: 'ai.perplexity.app',
      notion: 'notion.id',
    };

    const identifier = verifiedMapping[slug];
    if (!identifier) {
      return res.json({ data: null, message: 'No verified identifier for Trends API' });
    }

    const growth = await TrendsApiService.getAppGrowth(identifier).catch(() => null);
    const timeSeries = await TrendsApiService.getAppTimeSeries(identifier).catch(() => null);

    res.json({ data: { identifier, growth, timeSeries } });
  } catch (error) {
    console.error('Error in getTrendsApiData:', error);
    res.status(500).json({ error: 'Failed to fetch trends API data' });
  }
}

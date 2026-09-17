import 'dotenv/config';
import { prisma } from '@caniclone/database';
import { getTopCharts, getAppGrowth, getAppTimeSeries, getChartCacheKey } from '../src/services/trends-api.service.js';

const VERIFIED_MAPPING: Record<string, string> = {
  'chatgpt': 'com.openai.chatgpt',
  'claude': 'com.anthropic.claude',
  'perplexity': 'ai.perplexity.app',
  'notion': 'notion.id',
};

async function syncTopCharts() {
  console.log('Syncing Top Charts...');
  const charts = [
    { title: 'App Store Top Free', type: 'App Store Top Free' },
    { title: 'App Store Top Paid', type: 'App Store Top Paid' },
    { title: 'Google Play Top Free', type: 'Google Play' },
  ];

  for (const chart of charts) {
    console.log(`Fetching ${chart.title} (Trends API type: "${chart.type}")...`);
    try {
      const data = await getTopCharts(chart.type);
      const key = getChartCacheKey(chart.type);
      const count = Array.isArray(data) ? data.length : 0;
      console.log(`✓ ${chart.title} synced (${count} items, cache key: "${key}").`);
    } catch (e: any) {
      console.error(`✗ Failed to sync ${chart.title}:`, e?.message || e);
    }
    // delay to avoid spamming the API
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

async function syncAppSignals() {
  console.log('Syncing App Signals...');
  const slugs = Object.keys(VERIFIED_MAPPING);

  for (const slug of slugs) {
    const identifier = VERIFIED_MAPPING[slug];
    console.log(`Fetching data for ${slug} (${identifier})...`);

    try {
      await getAppGrowth(identifier);
      console.log(`✓ Growth synced for ${slug}.`);
    } catch (e: any) {
      console.error(`✗ Failed to sync growth for ${slug}:`, e?.message || e);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      await getAppTimeSeries(identifier);
      console.log(`✓ Time Series synced for ${slug}.`);
    } catch (e: any) {
      console.error(`✗ Failed to sync time series for ${slug}:`, e?.message || e);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

async function main() {
  try {
    console.log('Starting Trends API manual sync...');
    
    await syncTopCharts();
    await syncAppSignals();

    console.log('Sync complete.');
  } catch (error) {
    console.error('Fatal error during sync:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

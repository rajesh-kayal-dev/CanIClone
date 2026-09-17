import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const { prisma } = await import('@caniclone/database');

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

const TREND_THRESHOLD = 15; // +15% / -15%

if (!SERPAPI_KEY) {
  console.error("Missing SERPAPI_API_KEY environment variable. Exiting.");
  process.exit(1);
}

// Helper to delay between requests
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchGoogleTrends(appsChunk: { id: string; name: string }[]) {
  const query = appsChunk.map(app => app.name).join(',');
  console.log(`Fetching trends for: ${query}`);

  const baseUrl = 'https://serpapi.com/search.json?engine=google_trends';
  
  try {
    // 1. TIMESERIES
    const tsRes = await fetch(`${baseUrl}&q=${encodeURIComponent(query)}&data_type=TIMESERIES&api_key=${SERPAPI_KEY}`);
    const tsData = await tsRes.json();
    
    await sleep(1000);

    // 2. RELATED_QUERIES
    const rqRes = await fetch(`${baseUrl}&q=${encodeURIComponent(query)}&data_type=RELATED_QUERIES&api_key=${SERPAPI_KEY}`);
    const rqData = await rqRes.json();
    
    await sleep(1000);

    // 3. GEO_MAP
    const geoRes = await fetch(`${baseUrl}&q=${encodeURIComponent(query)}&data_type=GEO_MAP_0&api_key=${SERPAPI_KEY}`);
    const geoData = await geoRes.json();
    
    return { tsData, rqData, geoData, query };
  } catch (error) {
    console.error(`Error fetching data from SerpApi for queries: ${query}`, error);
    return null;
  }
}

function calculateTrend(timelineData: any[], queryName: string) {
  if (!timelineData || timelineData.length === 0) {
    return { trendDirection: 'STABLE', growthPercent: 0, currentInterest: 0, averageInterest: 0 };
  }

  // Find the values for this specific queryName across the timeline
  const values = timelineData.map(t => {
    const match = t.values.find((v: any) => v.query.toLowerCase() === queryName.toLowerCase());
    return match ? parseInt(match.extracted_value, 10) : 0;
  });

  if (values.length === 0) {
    return { trendDirection: 'STABLE', growthPercent: 0, currentInterest: 0, averageInterest: 0 };
  }

  const currentInterest = values[values.length - 1];
  const averageInterest = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  // Compare recent vs previous (e.g. last 4 weeks vs previous 4 weeks)
  const recentLength = Math.min(4, Math.floor(values.length / 2));
  if (recentLength === 0) {
    return { trendDirection: 'STABLE', growthPercent: 0, currentInterest, averageInterest };
  }

  const recentSlice = values.slice(-recentLength);
  const previousSlice = values.slice(-recentLength * 2, -recentLength);

  const recentAvg = recentSlice.reduce((a, b) => a + b, 0) / recentSlice.length;
  const previousAvg = previousSlice.reduce((a, b) => a + b, 0) / previousSlice.length;

  let growthPercent: number | null = null;
  let trendDirection = 'STABLE';
  
  const MIN_BASELINE = 5;
  const ABSOLUTE_GROWTH_THRESHOLD = 10;

  if (previousAvg < MIN_BASELINE) {
    growthPercent = null;
    if (recentAvg - previousAvg >= ABSOLUTE_GROWTH_THRESHOLD) {
      trendDirection = 'RISING';
    } else if (previousAvg - recentAvg >= ABSOLUTE_GROWTH_THRESHOLD) {
      trendDirection = 'FALLING';
    }
  } else {
    growthPercent = Math.round(((recentAvg - previousAvg) / previousAvg) * 100);
    if (growthPercent > TREND_THRESHOLD) {
      trendDirection = 'RISING';
    } else if (growthPercent < -TREND_THRESHOLD) {
      trendDirection = 'FALLING';
    }
  }

  return { trendDirection, growthPercent, currentInterest, averageInterest };
}

async function main() {
  console.log("Starting Market Sync...");
  
  // Fetch top 50 apps based on pagePriority (ascending is better) and voteCount (descending)
  const topApps = await prisma.app.findMany({
    orderBy: [
      { pagePriority: 'asc' },
      { voteCount: 'desc' }
    ],
    take: 50,
    select: { id: true, name: true }
  });

  console.log(`Found ${topApps.length} apps to sync.`);

  // Chunk by 5
  const chunkSize = 5;
  for (let i = 0; i < topApps.length; i += chunkSize) {
    const chunk = topApps.slice(i, i + chunkSize);
    const data = await fetchGoogleTrends(chunk);
    
    if (data) {
      const { tsData, rqData, geoData, query } = data;
      const timeline = tsData.interest_over_time?.timeline_data || [];

      for (const app of chunk) {
        const trendMetrics = calculateTrend(timeline, app.name);
        
        // Extract related queries
        const related = rqData.related_queries?.[app.name]?.rising || [];
        
        // Extract regional data
        const regional = geoData.compared_breakdown_by_region || [];

        await prisma.marketTrend.upsert({
          where: { appId: app.id },
          update: {
            source: 'Google Trends',
            query: app.name,
            ...trendMetrics,
            timelineData: timeline,
            regionalData: regional,
            relatedQueries: related,
            fetchedAt: new Date()
          },
          create: {
            appId: app.id,
            source: 'Google Trends',
            query: app.name,
            ...trendMetrics,
            timelineData: timeline,
            regionalData: regional,
            relatedQueries: related,
          }
        });
        
        console.log(`Updated MarketTrend for ${app.name} -> Direction: ${trendMetrics.trendDirection}, Growth: ${trendMetrics.growthPercent}%`);
      }
    }
    
    console.log("Sleeping to respect API rate limits...");
    await sleep(2000);
  }

  console.log("Market Sync Complete.");
  await prisma.$disconnect();
}

main().catch(console.error);

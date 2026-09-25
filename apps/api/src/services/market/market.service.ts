import { prisma } from '@caniclone/database';

const APP_SELECT = {
  name: true,
  slug: true,
  category: true,
  domain: true,
} as const;

const SCALAR_SELECT = {
  id: true,
  appId: true,
  source: true,
  query: true,
  trendDirection: true,
  growthPercent: true,
  currentInterest: true,
  averageInterest: true,
  fetchedAt: true,
  app: { select: APP_SELECT },
} as const;

function directionRank(value: string | null): number {
  if (value === 'RISING') return 3;
  if (value === 'STABLE') return 2;
  if (value === 'FALLING') return 1;
  return 0;
}

function sortTrending<T extends { trendDirection: string | null; growthPercent: number | null; currentInterest: number | null }>(rows: T[]) {
  return [...rows].sort(
    (a, b) =>
      directionRank(b.trendDirection) - directionRank(a.trendDirection) ||
      (b.growthPercent ?? -Infinity) - (a.growthPercent ?? -Infinity) ||
      (b.currentInterest ?? -Infinity) - (a.currentInterest ?? -Infinity),
  );
}

function sortOverview<T extends { currentInterest: number | null; averageInterest: number | null }>(rows: T[]) {
  return [...rows].sort(
    (a, b) =>
      (b.currentInterest ?? -Infinity) - (a.currentInterest ?? -Infinity) ||
      (b.averageInterest ?? -Infinity) - (a.averageInterest ?? -Infinity),
  );
}

async function getTrendRows() {
  return prisma.marketTrend.findMany({
    take: 100,
    select: SCALAR_SELECT,
  });
}

async function getOverviewRows(limit: number) {
  return prisma.marketTrend.findMany({
    where: { currentInterest: { not: null } },
    orderBy: { currentInterest: 'desc' },
    take: Math.min(100, Math.max(1, limit)),
    include: { app: { select: APP_SELECT } },
  });
}

interface MarketSummaryRow {
  id: string;
  appId: string;
  source: string;
  query: string;
  trendDirection: string | null;
  growthPercent: number | null;
  currentInterest: number | null;
  averageInterest: number | null;
  timelineData: unknown;
  regionalData: unknown;
  relatedQueries: unknown;
  fetchedAt: Date;
  overviewRank: number | null;
  app: {
    name: string;
    slug: string;
    category: string;
    domain: string | null;
  };
}

export async function getMarketSummary() {
  // Only the five chart rows carry timeline/region payloads. Returning NULL for
  // the other 45 rows avoids downloading the large Google Trends JSON blobs.
  const rows = await prisma.$queryRawUnsafe<MarketSummaryRow[]>(`
    WITH ranked AS (
      SELECT
        mt.*,
        a."name" AS app_name,
        a."slug" AS app_slug,
        a."category" AS app_category,
        a."domain" AS app_domain,
        CASE
          WHEN mt."currentInterest" IS NOT NULL THEN
            ROW_NUMBER() OVER (ORDER BY mt."currentInterest" DESC)
          ELSE NULL
        END AS overview_rank
      FROM "MarketTrend" mt
      JOIN "App" a ON a."id" = mt."appId"
    )
    SELECT
      "id",
      "appId",
      "source",
      "query",
      "trendDirection",
      "growthPercent",
      "currentInterest",
      "averageInterest",
      CASE WHEN "overview_rank" <= 5 THEN "timelineData" ELSE NULL END AS "timelineData",
      CASE WHEN "overview_rank" <= 5 THEN "regionalData" ELSE NULL END AS "regionalData",
      CASE WHEN "overview_rank" <= 5 THEN "relatedQueries" ELSE NULL END AS "relatedQueries",
      "fetchedAt",
      "overview_rank"::int AS "overviewRank",
      json_build_object(
        'name', "app_name",
        'slug', "app_slug",
        'category', "app_category",
        'domain', "app_domain"
      ) AS app
    FROM ranked
  `);

  const clean = (row: MarketSummaryRow) => {
    const { overviewRank: _overviewRank, ...data } = row;
    return data;
  };
  return {
    trending: sortTrending(rows).slice(0, 15).map(clean),
    overview: rows
      .filter((row) => row.overviewRank !== null && row.overviewRank <= 5)
      .sort((a, b) => (a.overviewRank ?? 99) - (b.overviewRank ?? 99))
      .map(clean),
  };
}

export async function getMarketTrending(limit = 15) {
  return sortTrending(await getTrendRows()).slice(0, Math.min(100, Math.max(1, limit)));
}

export async function getMarketOverview(limit = 5) {
  return sortOverview(await getOverviewRows(limit)).slice(0, Math.min(100, Math.max(1, limit)));
}

export async function getAppMarketData(slug: string) {
  return prisma.marketTrend.findFirst({
    where: { app: { slug } },
    include: { app: { select: APP_SELECT } },
  });
}

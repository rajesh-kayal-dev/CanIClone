import { prisma } from "@caniclone/database";

export const DEFAULT_OPPORTUNITY_LIMIT = 10;
const MAX_OPPORTUNITY_LIMIT = 50;

const VALID_VERDICTS = new Set(["yes", "kinda", "no"]);
const VALID_MARKET = new Set(["RISING", "STABLE", "FALLING"]);
const DIFFICULTY_TIERS: Record<string, number[]> = {
  EASY: [1, 2],
  MEDIUM: [3],
  HARD: [4],
  VERY_HARD: [5],
};

const EFFORT_TIER = `
  CASE
    WHEN app."diyTimeEstimate" ILIKE '%not realistically solo%'
      OR app."diyTimeEstimate" ILIKE '%months%'
      OR app."diyTimeEstimate" ILIKE '%long-term%'
      OR app."diyTimeEstimate" ILIKE '%open-ended%' THEN 5
    WHEN app."diyTimeEstimate" ILIKE '%multi-week%'
      OR app."diyTimeEstimate" ILIKE '%weeks%' THEN 4
    WHEN app."diyTimeEstimate" ILIKE '%multi-day%'
      OR app."diyTimeEstimate" ILIKE '%two days%' THEN 3
    WHEN app."diyTimeEstimate" ILIKE '%weekend%' THEN 2
    WHEN app."diyTimeEstimate" ILIKE '%one sitting%'
      OR app."diyTimeEstimate" ILIKE '%one session%' THEN 1
    ELSE 3
  END`;

/**
 * Opportunity rows are a transparent view over existing App, AIAnalysis,
 * MarketTrend, and Alternative records. The pre-aggregated CTEs are important:
 * the old implementation performed a correlated count and latest-analysis
 * lookup for every app before it could sort or paginate.
 */
const scoredOpportunities = (appFilter = "") => `
  WITH latest_analysis AS (
    SELECT DISTINCT ON ("appId") "appId", "complexity"
    FROM "AIAnalysis"
    ORDER BY "appId", "createdAt" DESC
  ),
  alternative_counts AS (
    SELECT "appId", COUNT(*)::int AS "ossCount"
    FROM "Alternative"
    GROUP BY "appId"
  ),
  base AS (
    SELECT
      app."id",
      app."slug",
      app."name",
      app."domain",
      app."category",
      app."verdict",
      app."verdictConfidence",
      app."verdictSummary",
      app."subcategory",
      app."tagline",
      app."diyTimeEstimate",
      app."priceMonthly"::text AS "priceMonthly",
      app."voteCount",
      app."createdAt",
      app."updatedAt",
      COALESCE(alt."ossCount", 0)::int AS "ossCount",
      mt."trendDirection" AS "marketDirection",
      mt."growthPercent" AS "marketGrowth",
      mt."currentInterest" AS "marketInterest",
      mt."fetchedAt" AS "marketFetchedAt",
      ai."complexity" AS "aiComplexity",
      ${EFFORT_TIER} AS "effortTier"
    FROM "App" app
    LEFT JOIN alternative_counts alt ON alt."appId" = app."id"
    LEFT JOIN "MarketTrend" mt ON mt."appId" = app."id"
    LEFT JOIN latest_analysis ai ON ai."appId" = app."id"
    ${appFilter}
  ),
  points AS (
    SELECT
      b.*,
      (CASE b."verdict" WHEN 'yes' THEN 2 WHEN 'kinda' THEN 1 ELSE 0 END)::int AS "clonePts",
      (CASE b."effortTier" WHEN 1 THEN 2 WHEN 2 THEN 2 WHEN 3 THEN 1 ELSE 0 END)::int AS "effortPts",
      (CASE WHEN b."ossCount" >= 3 THEN 2 WHEN b."ossCount" >= 1 THEN 1 ELSE 0 END)::int AS "ossPts",
      (CASE b."marketDirection" WHEN 'RISING' THEN 2 WHEN 'STABLE' THEN 1 ELSE 0 END)::int AS "marketPts"
    FROM base b
  )
  SELECT
    p.*,
    (
      (p."clonePts" + p."effortPts" + p."ossPts" + p."marketPts")::double precision
      / (6 + CASE WHEN p."marketDirection" IS NOT NULL THEN 2 ELSE 0 END)
    ) AS ratio
  FROM points p`;

const ORDER_BY: Record<string, string> = {
  recommended: `"ratio" DESC, "clonePts" DESC, "effortTier" ASC, lower("name") ASC`,
  newest: `"createdAt" DESC, lower("name") ASC`,
  rising: `("marketDirection" IS NOT NULL) DESC, ("marketDirection" = 'RISING') DESC, "marketGrowth" DESC NULLS LAST, "marketInterest" DESC NULLS LAST, lower("name") ASC`,
  "shortest-build": `"effortTier" ASC, "ratio" DESC, lower("name") ASC`,
  "open-source": `"ossCount" DESC, "ratio" DESC, lower("name") ASC`,
};

export interface ListOpportunitiesParams {
  page?: number;
  limit?: number;
  category?: string;
  verdict?: string;
  difficulty?: string;
  market?: string;
  sort?: string;
  q?: string;
}

export interface ListOpportunitiesResult {
  items: OpportunityRow[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface OpportunityRow {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  category: string;
  subcategory: string | null;
  tagline: string | null;
  verdict: string;
  verdictConfidence: string | null;
  verdictSummary: string | null;
  diyTimeEstimate: string | null;
  priceMonthly: string | null;
  voteCount: number;
  createdAt: Date;
  updatedAt: Date;
  ossCount: number;
  marketDirection: string | null;
  marketGrowth: number | null;
  marketInterest: number | null;
  marketFetchedAt: Date | null;
  aiComplexity: string | null;
  effortTier: number;
  clonePts: number;
  effortPts: number;
  ossPts: number;
  marketPts: number;
  ratio: number;
  searchRank?: number;
  totalCount?: number;
}

export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "VERY_HARD";
export type OpportunityLevel = "HIGH" | "MEDIUM" | "LOW";

export interface Opportunity {
  app: {
    slug: string;
    name: string;
    domain: string | null;
    category: string;
  };
  verdict: "YES" | "KINDA" | "NO";
  difficulty: Difficulty | null;
  buildTime: string | null;
  estimatedCost: { min: number; max: number; currency: "USD" } | null;
  market: {
    direction: "RISING" | "STABLE" | "FALLING" | null;
    growthPercent: number | null;
    currentInterest: number | null;
  };
  openSourceAlternatives: number;
  signals: {
    cloneability: string;
    market: string;
    cost: string;
    buildTime: string;
    openSource: string;
  };
  opportunityLevel: OpportunityLevel;
  ratio: number;
}

function tierToDifficulty(tier: number, aiComplexity: string | null): Difficulty {
  if (aiComplexity) {
    const normalized = aiComplexity.toUpperCase().replace(/[\s-]+/g, "_");
    if (
      normalized === "EASY" ||
      normalized === "MEDIUM" ||
      normalized === "HARD" ||
      normalized === "VERY_HARD"
    ) {
      return normalized as Difficulty;
    }
  }
  if (tier <= 2) return "EASY";
  if (tier === 3) return "MEDIUM";
  if (tier === 4) return "HARD";
  return "VERY_HARD";
}

function toLevel(row: OpportunityRow): OpportunityLevel {
  let level: OpportunityLevel =
    row.ratio >= 0.7 ? "HIGH" : row.ratio >= 0.45 ? "MEDIUM" : "LOW";
  if (level === "HIGH" && row.verdict === "no") level = "MEDIUM";
  return level;
}

export function toOpportunity(row: OpportunityRow): Opportunity {
  const verdict = row.verdict.toUpperCase() as Opportunity["verdict"];
  const direction = (row.marketDirection ?? null) as Opportunity["market"]["direction"];
  return {
    app: {
      slug: row.slug,
      name: row.name,
      domain: row.domain,
      category: row.category,
    },
    verdict,
    difficulty: tierToDifficulty(row.effortTier, row.aiComplexity),
    buildTime: row.diyTimeEstimate,
    // There is no real operating-cost source in the current schema.
    estimatedCost: null,
    market: {
      direction,
      growthPercent: row.marketGrowth,
      currentInterest: row.marketInterest,
    },
    openSourceAlternatives: row.ossCount,
    signals: {
      cloneability: verdict,
      market: direction ?? "no signal",
      cost: "n/a",
      buildTime: row.diyTimeEstimate ?? "n/a",
      openSource: `${row.ossCount} alternative${row.ossCount === 1 ? "" : "s"}`,
    },
    opportunityLevel: toLevel(row),
    ratio: Math.round(row.ratio * 100) / 100,
  };
}

function buildWhere(params: ListOpportunitiesParams): {
  sql: string;
  values: unknown[];
  searchPlaceholder?: string;
} {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let searchPlaceholder: string | undefined;
  const bind = (value: unknown): string => {
    values.push(value);
    return `$${values.length}`;
  };

  const category = params.category?.trim();
  if (category && category !== "all") conditions.push(`"category" = ${bind(category)}`);

  const verdict = params.verdict?.trim().toLowerCase();
  if (verdict && verdict !== "all" && VALID_VERDICTS.has(verdict)) {
    conditions.push(`"verdict" = ${bind(verdict)}::"Verdict"`);
  }

  const difficulty = params.difficulty?.trim().toUpperCase();
  if (difficulty && difficulty !== "all" && DIFFICULTY_TIERS[difficulty]) {
    conditions.push(`"effortTier" = ANY(${bind(DIFFICULTY_TIERS[difficulty])}::int[])`);
  }

  const market = params.market?.trim().toUpperCase();
  if (market && market !== "all" && VALID_MARKET.has(market)) {
    conditions.push(`"marketDirection" = ${bind(market)}`);
  }

  const query = params.q?.trim();
  if (query) {
    const term = bind(query.slice(0, 120));
    searchPlaceholder = term;
    conditions.push(`(
      strpos(lower("name"), lower(${term})) > 0 OR
      strpos(lower(COALESCE("tagline", '')), lower(${term})) > 0 OR
      strpos(lower(COALESCE("category", '')), lower(${term})) > 0 OR
      strpos(lower(COALESCE("subcategory", '')), lower(${term})) > 0 OR
      strpos(lower(COALESCE("verdictSummary", '')), lower(${term})) > 0 OR
      strpos(lower(COALESCE("diyTimeEstimate", '')), lower(${term})) > 0
    )`);
  }

  return {
    sql: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
    searchPlaceholder,
  };
}

function cleanLimit(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return DEFAULT_OPPORTUNITY_LIMIT;
  return Math.min(MAX_OPPORTUNITY_LIMIT, Math.max(1, Math.floor(value)));
}

function cleanPage(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

export async function listOpportunities(
  params: ListOpportunitiesParams,
): Promise<ListOpportunitiesResult> {
  const limit = cleanLimit(params.limit);
  const page = cleanPage(params.page);
  const sort = params.sort && ORDER_BY[params.sort] ? params.sort : "recommended";
  const { sql: whereSql, values, searchPlaceholder } = buildWhere(params);
  const limitPlaceholder = `$${values.length + 1}`;
  const offsetPlaceholder = `$${values.length + 2}`;
  const offset = (page - 1) * limit;
  const searchRankSql = searchPlaceholder
    ? `CASE
        WHEN lower(o."name") = lower(${searchPlaceholder}) THEN 0
        WHEN lower(o."name") LIKE lower(${searchPlaceholder}) || '%' THEN 1
        WHEN strpos(lower(o."name"), lower(${searchPlaceholder})) > 0 THEN 2
        WHEN strpos(lower(COALESCE(o."tagline", '')), lower(${searchPlaceholder})) > 0
          OR strpos(lower(COALESCE(o."category", '')), lower(${searchPlaceholder})) > 0 THEN 3
        ELSE 4
      END`
    : '0';

  const rows = await prisma.$queryRawUnsafe<OpportunityRow[]>(
    `
      SELECT o.*, COUNT(*) OVER()::int AS "totalCount",
        ${searchRankSql} AS "searchRank"
      FROM (${scoredOpportunities()}) o
      ${whereSql}
      ORDER BY ${searchPlaceholder ? '"searchRank" ASC, ' : ''}${ORDER_BY[sort]}
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
    `,
    ...values,
    limit,
    offset,
  );

  const total = rows[0]?.totalCount ?? 0;
  return {
    items: rows.map(({ totalCount: _totalCount, searchRank: _searchRank, ...row }) => row),
    total,
    page,
    limit,
    hasMore: page * limit < total,
  };
}

export async function getOpportunityBySlug(slug: string): Promise<Opportunity | null> {
  const rows = await prisma.$queryRawUnsafe<OpportunityRow[]>(
    `
      SELECT *
      FROM (${scoredOpportunities('WHERE app."slug" = $1')}) o
      LIMIT 1
    `,
    slug,
  );
  const row = rows[0];
  return row ? toOpportunity(row) : null;
}

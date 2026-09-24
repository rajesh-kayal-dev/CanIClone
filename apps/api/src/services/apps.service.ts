import { prisma, hybridSearchApps } from "@caniclone/database";

export const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 50;

const VALID_VERDICTS = new Set(["yes", "kinda", "no"]);
const VALID_SORTS = new Set([
  "trending",
  "popular",
  "new",
  "votes",
  "name",
  "price",
  "replaced",
]);

/**
 * All ordering is whitelisted and evaluated by PostgreSQL. The aliases in these
 * clauses refer to the filtered CTE below, so no application-side sorting is
 * needed (and no complete directory is sent to the browser).
 */
const ORDER_BY: Record<string, string> = {
  trending: `
    ("marketDirection" IS NOT NULL) DESC,
    ("marketDirection" = 'RISING') DESC,
    "marketGrowth" DESC NULLS LAST,
    "marketInterest" DESC NULLS LAST,
    "pagePriority" ASC,
    lower("name") ASC`,
  popular: `
    "popularityScore" DESC,
    "voteCount" DESC,
    lower("name") ASC`,
  new: `"createdAt" DESC, lower("name") ASC`,
  votes: `"voteCount" DESC, lower("name") ASC`,
  name: `lower("name") ASC, "voteCount" DESC`,
  price: `"priceMonthly" ASC NULLS LAST, lower("name") ASC`,
  replaced: `
    "alternativeCount" DESC,
    "popularityScore" DESC,
    lower("name") ASC`,
};

const LIST_COLUMNS = `
  a."id",
  a."slug",
  a."name",
  a."domain",
  a."category",
  a."subcategory",
  a."tagline",
  a."priceMonthly"::text AS "priceMonthly",
  a."verdict",
  a."verdictConfidence",
  a."verdictSummary",
  a."diyTimeEstimate",
  a."pagePriority",
  a."voteCount",
  a."createdAt",
  a."updatedAt",
  COALESCE(alt."alternativeCount", 0)::int AS "alternativeCount",
  COALESCE(pop."popularityScore", 0)::int AS "popularityScore",
  mt."trendDirection" AS "marketDirection",
  mt."growthPercent" AS "marketGrowth",
  mt."currentInterest" AS "marketInterest",
  mt."fetchedAt" AS "marketFetchedAt"`;

export interface AppListRow {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  category: string;
  subcategory: string | null;
  tagline: string | null;
  priceMonthly: string | null;
  verdict: string;
  verdictConfidence: string | null;
  verdictSummary: string | null;
  diyTimeEstimate: string | null;
  pagePriority: number;
  voteCount: number;
  createdAt: Date;
  updatedAt: Date;
  alternativeCount: number;
  popularityScore: number;
  marketDirection: string | null;
  marketGrowth: number | null;
  marketInterest: number | null;
  marketFetchedAt: Date | null;
  searchRank?: number;
  totalCount?: number;
}

export interface ListAppsPageParams {
  page?: number;
  limit?: number;
  category?: string;
  verdict?: string;
  sort?: string;
  q?: string;
}

export interface ListAppsPageResult {
  items: AppListRow[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

function cleanLimit(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return DEFAULT_PAGE_LIMIT;
  return Math.min(MAX_PAGE_LIMIT, Math.max(1, Math.floor(value)));
}

function cleanPage(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function normalizedSearch(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 120) : undefined;
}

/**
 * Database-level discovery listing. Filtering, sorting, counting, and pagination
 * happen in one PostgreSQL query. The two aggregate CTEs also provide the real
 * replaced/alternative and GitHub-star signals used by the discovery pages
 * without an N+1 lookup.
 */
export async function listAppsPage(
  params: ListAppsPageParams = {},
): Promise<ListAppsPageResult> {
  const limit = cleanLimit(params.limit);
  const page = cleanPage(params.page);
  const sort = params.sort && VALID_SORTS.has(params.sort) ? params.sort : "trending";
  const values: unknown[] = [];
  const conditions: string[] = [];
  let searchTermPlaceholder: string | undefined;

  const bind = (value: unknown): string => {
    values.push(value);
    return `$${values.length}`;
  };

  const category = params.category?.trim();
  if (category && category !== "all") {
    conditions.push(`a."category" = ${bind(category)}`);
  }

  const verdict = params.verdict?.trim().toLowerCase();
  if (verdict && verdict !== "all" && VALID_VERDICTS.has(verdict)) {
    conditions.push(`a."verdict" = ${bind(verdict)}::"Verdict"`);
  }

  const query = normalizedSearch(params.q);
  if (query) {
    const term = bind(query);
    searchTermPlaceholder = term;
    // strpos keeps user input literal (unlike an unbounded ILIKE pattern) and
    // searches the same real fields that users see in the app report.
    conditions.push(`(
      strpos(lower(a."name"), lower(${term})) > 0 OR
      strpos(lower(COALESCE(a."domain", '')), lower(${term})) > 0 OR
      strpos(lower(COALESCE(a."tagline", '')), lower(${term})) > 0 OR
      strpos(lower(COALESCE(a."category", '')), lower(${term})) > 0 OR
      strpos(lower(COALESCE(a."subcategory", '')), lower(${term})) > 0 OR
      strpos(lower(COALESCE(a."verdictSummary", '')), lower(${term})) > 0 OR
      strpos(lower(COALESCE(a."diyTimeEstimate", '')), lower(${term})) > 0
    )`);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (page - 1) * limit;
  const limitPlaceholder = `$${values.length + 1}`;
  const offsetPlaceholder = `$${values.length + 2}`;

  const searchRankSql = searchTermPlaceholder
    ? `CASE
        WHEN lower(a."name") = lower(${searchTermPlaceholder}) THEN 0
        WHEN lower(a."name") LIKE lower(${searchTermPlaceholder}) || '%' THEN 1
        WHEN strpos(lower(a."name"), lower(${searchTermPlaceholder})) > 0 THEN 2
        WHEN strpos(lower(COALESCE(a."tagline", '')), lower(${searchTermPlaceholder})) > 0
          OR strpos(lower(COALESCE(a."category", '')), lower(${searchTermPlaceholder})) > 0 THEN 3
        ELSE 4
      END`
    : '0';

  const sql = `
    WITH alternative_counts AS (
      SELECT "appId", COUNT(*)::int AS "alternativeCount"
      FROM "Alternative"
      GROUP BY "appId"
    ),
    popularity AS (
      SELECT "appId", SUM(COALESCE("stars", 0))::bigint AS "popularityScore"
      FROM "Alternative"
      GROUP BY "appId"
    ),
    filtered AS (
      SELECT ${LIST_COLUMNS},
        ${searchRankSql} AS "searchRank"
      FROM "App" a
      LEFT JOIN alternative_counts alt ON alt."appId" = a."id"
      LEFT JOIN popularity pop ON pop."appId" = a."id"
      LEFT JOIN "MarketTrend" mt ON mt."appId" = a."id"
      ${whereSql}
    )
    SELECT filtered.*, COUNT(*) OVER()::int AS "totalCount"
    FROM filtered
    ORDER BY ${searchTermPlaceholder ? '"searchRank" ASC, ' : ''}${ORDER_BY[sort]}
    LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`;

  const rows = await prisma.$queryRawUnsafe<AppListRow[]>(sql, ...values, limit, offset);
  const total = rows[0]?.totalCount ?? 0;
  const items = rows.map(({ totalCount: _totalCount, searchRank: _searchRank, ...row }) => row);

  return {
    items,
    total,
    page,
    limit,
    hasMore: page * limit < total,
  };
}

/** The legacy helper now returns only the first database-sized batch. */
export async function getApps(): Promise<AppListRow[]> {
  return (await listAppsPage({ limit: DEFAULT_PAGE_LIMIT })).items;
}

export async function getAppCount(): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
    `SELECT COUNT(*)::int AS count FROM "App"`,
  );
  return rows[0]?.count ?? 0;
}

export interface CategorySampleApp {
  slug: string;
  name: string;
  domain: string | null;
}

export interface CategoryStatsRow {
  slug: string;
  appCount: number;
  sampleApps: CategorySampleApp[];
}

export async function getCategoryStats(): Promise<CategoryStatsRow[]> {
  const rows = await prisma.$queryRawUnsafe<
    Array<{ slug: string; appCount: number; sampleApps: CategorySampleApp[] }>
  >(`
    WITH ranked AS (
      SELECT
        a."category" AS category_slug,
        a."slug" AS app_slug,
        a."name" AS app_name,
        a."domain" AS app_domain,
        COUNT(*) OVER (PARTITION BY a."category")::int AS category_count,
        ROW_NUMBER() OVER (
          PARTITION BY a."category"
          ORDER BY a."pagePriority" ASC, lower(a."name") ASC
        ) AS sample_rank
      FROM "App" a
    )
    SELECT
      category_slug AS slug,
      MAX(category_count)::int AS "appCount",
      COALESCE(
        json_agg(
          json_build_object('slug', app_slug, 'name', app_name, 'domain', app_domain)
          ORDER BY sample_rank
        ) FILTER (WHERE sample_rank <= 3),
        '[]'::json
      ) AS "sampleApps"
    FROM ranked
    GROUP BY category_slug
    ORDER BY "appCount" DESC, category_slug ASC
  `);

  return rows.map((row) => ({
    slug: row.slug,
    appCount: Number(row.appCount),
    sampleApps: Array.isArray(row.sampleApps) ? row.sampleApps : [],
  }));
}

export async function getCategoryStatsBySlug(slug: string): Promise<CategoryStatsRow | null> {
  const all = await getCategoryStats();
  return all.find((category) => category.slug === slug) ?? null;
}

export async function getAppBySlug(slug: string) {
  return prisma.app.findUnique({
    where: { slug },
    include: {
      pricingPlans: true,
      alternatives: true,
    },
  });
}

export async function getAppAlternatives(slug: string) {
  return prisma.alternative.findMany({
    where: { app: { slug } },
    orderBy: { name: "asc" },
  });
}

/**
 * Resolve related directory apps without downloading the directory into the web
 * process. Curated relatedSlugs are honoured first, then same-category apps.
 */
export async function getRelatedApps(slug: string, limit = 4): Promise<AppListRow[]> {
  const boundedLimit = Math.min(12, Math.max(1, Math.floor(limit)));
  const app = await prisma.app.findUnique({
    where: { slug },
    select: { category: true, relatedSlugs: true },
  });
  if (!app) return [];

  const relatedSlugs = Array.isArray(app.relatedSlugs)
    ? app.relatedSlugs.filter((value): value is string => typeof value === "string")
    : [];
  const ids = await prisma.app.findMany({
    where: {
      slug: { in: relatedSlugs },
      NOT: { slug },
    },
    select: { slug: true },
  });
  const curated = ids.map((row) => row.slug);
  const rows = await listAppsPage({
    limit: boundedLimit + curated.length,
    sort: "popular",
  });
  const bySlug = new Map(rows.items.map((row) => [row.slug, row]));
  const curatedRows = curated
    .map((relatedSlug) => bySlug.get(relatedSlug))
    .filter((row): row is AppListRow => Boolean(row));
  const fallback = rows.items.filter(
    (row) => !curated.includes(row.slug) && row.category === app.category,
  );
  const fill = rows.items.filter(
    (row) => !curated.includes(row.slug) && !fallback.includes(row),
  );
  return [...curatedRows, ...fallback, ...fill].slice(0, boundedLimit);
}

export async function searchApps(query: string, limit = 20) {
  return hybridSearchApps(query, { limit: Math.min(50, Math.max(1, Math.floor(limit))) });
}

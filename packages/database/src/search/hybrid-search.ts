import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";
import {
  env,
  pipeline,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";

/**
 * Hybrid search over the Neon "App" table.
 *
 * Combination: PostgreSQL keyword scoring (name / tagline / category /
 * subcategory) weighted together with pgvector cosine similarity scored from
 * the local all-MiniLM-L6-v2 query embedding (mean-pooled, normalized).
 *
 * Reads from the target Neon database via DIRECT_URL (or SEARCH_DATABASE_URL),
 * NOT the source database used by the Prisma client.
 *
 * Environment contract:
 *   SEARCH_DATABASE_URL  (optional, preferred)
 *   DIRECT_URL           (fallback)
 */

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const EMBEDDING_DIM = 384;

const DEFAULT_LIMIT = 20;
const DEFAULT_KEYWORD_WEIGHT = 0.6;
const DEFAULT_SEMANTIC_WEIGHT = 0.4;
const DEFAULT_MIN_SEMANTIC_SCORE = 0.25;

env.cacheDir = path.join(
  ROOT,
  "node_modules",
  ".cache",
  "@huggingface",
  "transformers"
);

type Embedder = FeatureExtractionPipeline;
type EmbeddingData = Float32Array | Float64Array;

let embedderPromise: Promise<Embedder> | null = null;

function getEmbedder(): Promise<Embedder> {
  if (!embedderPromise) {
    embedderPromise = pipeline(
      "feature-extraction",
      MODEL_ID
    ) as Promise<Embedder>;
  }
  return embedderPromise;
}

let poolPromise: Promise<pg.Pool> | null = null;

function getSearchUrl(): string {
  const url = process.env.SEARCH_DATABASE_URL ?? process.env.DIRECT_URL;
  if (!url) {
    throw new Error(
      "hybrid search requires SEARCH_DATABASE_URL or DIRECT_URL to be defined"
    );
  }
  return url;
}

function getPool(): Promise<pg.Pool> {
  if (!poolPromise) {
    poolPromise = (async () => {
      const pool = new pg.Pool({
        connectionString: getSearchUrl(),
        max: 4,
      });
      return pool;
    })();
  }
  return poolPromise;
}

async function embedQuery(query: string): Promise<EmbeddingData> {
  const extractor = await getEmbedder();
  const output = await extractor(query, { pooling: "mean", normalize: true });
  const data = output.data as EmbeddingData;
  if (data.length !== EMBEDDING_DIM) {
    throw new Error(
      `embedding model returned ${data.length} dims, expected ${EMBEDDING_DIM}`
    );
  }
  return data;
}

function vectorsToSql(data: EmbeddingData): string {
  return `[${Array.from(data).join(",")}]`;
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export interface HybridSearchResult {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  category: string | null;
  subcategory: string | null;
  tagline: string | null;
  verdict: string | null;
  verdictConfidence: string | null;
  verdictSummary: string | null;
  priceMonthly: string | null;
  diyTimeEstimate: string | null;
  pagePriority: number;
  voteCount: number;
  keywordScore: number;
  semanticScore: number;
  finalScore: number;
  matchType: string;
}

export interface HybridSearchOptions {
  limit?: number;
  keywordWeight?: number;
  semanticWeight?: number;
  minSemanticScore?: number;
}

export async function hybridSearchApps(
  query: string,
  options: HybridSearchOptions = {}
): Promise<HybridSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const limit = clamp(options.limit ?? DEFAULT_LIMIT, 1, 100);
  const keywordWeight = clamp(
    options.keywordWeight ?? DEFAULT_KEYWORD_WEIGHT,
    0,
    1
  );
  const semanticWeight = clamp(
    options.semanticWeight ?? DEFAULT_SEMANTIC_WEIGHT,
    0,
    1
  );
  const minSemanticScore = clamp(
    options.minSemanticScore ?? DEFAULT_MIN_SEMANTIC_SCORE,
    0,
    1
  );

  const queryVector = await embedQuery(trimmed);

  const pool = await getPool();

  const { rows } = await pool.query<HybridSearchResult>(
    `
      WITH q AS (
        SELECT lower($1)::text    AS phrase,
               $2::vector         AS qvec,
               string_to_array(lower($1), ' ')::text[] AS words
      )
      SELECT
        a."id"::text              AS "id",
        a."slug"                  AS "slug",
        a."name"                  AS "name",
        a."domain"                AS "domain",
        a."category"              AS "category",
        a."subcategory"           AS "subcategory",
        a."tagline"               AS "tagline",
        a."verdict"               AS "verdict",
        a."verdictConfidence"     AS "verdictConfidence",
        a."verdictSummary"        AS "verdictSummary",
        a."priceMonthly"::text    AS "priceMonthly",
        a."diyTimeEstimate"       AS "diyTimeEstimate",
        a."pagePriority"          AS "pagePriority",
        a."voteCount"             AS "voteCount",
        ROUND(kw.kw_score::numeric, 6)::float8            AS "keywordScore",
        ROUND(sem.sem_score::numeric, 6)::float8          AS "semanticScore",
        ROUND((($3::float8 * kw.kw_score) + ($4::float8 * sem.sem_score))::numeric, 6)::float8 AS "finalScore",
        kw.kw_match                                        AS "matchType"
      FROM "App" a
      CROSS JOIN q
      CROSS JOIN LATERAL (
        SELECT
          GREATEST(
            CASE WHEN a."name" ILIKE q.phrase THEN 1.0 ELSE 0.0 END,
            CASE WHEN a."name" ILIKE q.phrase || '%' THEN 0.92 ELSE 0.0 END,
            CASE WHEN a."name" ILIKE '%' || q.phrase || '%' THEN 0.85 ELSE 0.0 END,
            CASE WHEN EXISTS (
              SELECT 1 FROM unnest(string_to_array(lower(a."name"), ' ')) AS nw(n)
              WHERE nw.n = ANY(q.words)
            ) THEN 0.7 ELSE 0.0 END,
            CASE WHEN coalesce(a."tagline", '') ILIKE '%' || q.phrase || '%'
                   OR coalesce(a."category", '') ILIKE '%' || q.phrase || '%'
                   OR coalesce(a."subcategory", '') ILIKE '%' || q.phrase || '%'
              THEN 0.6 ELSE 0.0 END,
            CASE WHEN EXISTS (
              SELECT 1 FROM unnest(
                string_to_array(
                  lower(coalesce(a."tagline", '') || ' ' || coalesce(a."category", '') || ' ' || coalesce(a."subcategory", '')),
                  ' '
                )
              ) AS tw(t)
              WHERE tw.t = ANY(q.words)
            ) THEN 0.5 ELSE 0.0 END
          ) AS kw_score,
          CASE
            WHEN a."name" ILIKE q.phrase THEN 'name-exact'
            WHEN a."name" ILIKE q.phrase || '%' THEN 'name-prefix'
            WHEN a."name" ILIKE '%' || q.phrase || '%' THEN 'name-contains'
            WHEN EXISTS (
              SELECT 1 FROM unnest(string_to_array(lower(a."name"), ' ')) AS nw(n)
              WHERE nw.n = ANY(q.words)
            ) THEN 'name-word'
            WHEN coalesce(a."tagline", '') ILIKE '%' || q.phrase || '%'
              OR coalesce(a."category", '') ILIKE '%' || q.phrase || '%'
              OR coalesce(a."subcategory", '') ILIKE '%' || q.phrase || '%'
              THEN 'text-contains'
            WHEN EXISTS (
              SELECT 1 FROM unnest(
                string_to_array(
                  lower(coalesce(a."tagline", '') || ' ' || coalesce(a."category", '') || ' ' || coalesce(a."subcategory", '')),
                  ' '
                )
              ) AS tw(t)
              WHERE tw.t = ANY(q.words)
            ) THEN 'text-word'
            ELSE 'semantic-only'
          END AS kw_match
      ) kw
      CROSS JOIN LATERAL (
        SELECT (1.0 - (a."embedding" <=> q.qvec)) AS sem_score
      ) sem
      WHERE a."embedding" IS NOT NULL
        AND (kw.kw_score > 0.0 OR sem.sem_score >= $5::float8)
      ORDER BY "finalScore" DESC, a."name" ASC
      LIMIT $6::int
    `,
    [
      trimmed,
      vectorsToSql(queryVector),
      keywordWeight,
      semanticWeight,
      minSemanticScore,
      limit,
    ]
  );

  return rows;
}
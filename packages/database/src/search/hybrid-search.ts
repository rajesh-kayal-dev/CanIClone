import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";
import {
  env,
  pipeline,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";

/**
 * Hybrid search over the existing PostgreSQL App table.
 *
 * The 384-dimensional MiniLM vectors are already stored in App.embedding. This
 * module only embeds the incoming query and scores those existing vectors; it
 * never regenerates or writes application embeddings.
 */

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const EMBEDDING_DIM = 384;

const DEFAULT_LIMIT = 20;
const DEFAULT_KEYWORD_WEIGHT = 0.45;
const DEFAULT_SEMANTIC_WEIGHT = 0.55;
const DEFAULT_MIN_SEMANTIC_SCORE = 0.15;

// Keep the model cache shared with scripts/generate-embeddings.ts. The previous
// relative path pointed at packages/node_modules and could create a second copy.
env.cacheDir = path.join(ROOT, "node_modules", ".cache", "@huggingface", "transformers");

type Embedder = FeatureExtractionPipeline;
type EmbeddingData = Float32Array | Float64Array;

let embedderPromise: Promise<Embedder> | null = null;

function getEmbedder(): Promise<Embedder> {
  if (!embedderPromise) {
    embedderPromise = pipeline(
      "feature-extraction",
      MODEL_ID,
    ) as Promise<Embedder>;
  }
  return embedderPromise;
}

let poolPromise: Promise<pg.Pool> | null = null;

function getSearchUrl(): string {
  const url = process.env.SEARCH_DATABASE_URL ?? process.env.DIRECT_URL;
  if (!url) {
    throw new Error(
      "hybrid search requires SEARCH_DATABASE_URL or DIRECT_URL to be defined",
    );
  }
  return url;
}

function getPool(): Promise<pg.Pool> {
  if (!poolPromise) {
    poolPromise = Promise.resolve(
      new pg.Pool({
        connectionString: getSearchUrl(),
        max: 4,
      }),
    );
  }
  return poolPromise;
}

async function embedQuery(query: string): Promise<EmbeddingData> {
  const extractor = await getEmbedder();
  const output = await extractor(query, { pooling: "mean", normalize: true });
  const data = output.data as EmbeddingData;
  if (data.length !== EMBEDDING_DIM) {
    throw new Error(
      `embedding model returned ${data.length} dims, expected ${EMBEDDING_DIM}`,
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
  alternativeCount: number;
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
  options: HybridSearchOptions = {},
): Promise<HybridSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const limit = clamp(options.limit ?? DEFAULT_LIMIT, 1, 50);
  const keywordWeight = clamp(
    options.keywordWeight ?? DEFAULT_KEYWORD_WEIGHT,
    0,
    1,
  );
  const semanticWeight = clamp(
    options.semanticWeight ?? DEFAULT_SEMANTIC_WEIGHT,
    0,
    1,
  );
  const minSemanticScore = clamp(
    options.minSemanticScore ?? DEFAULT_MIN_SEMANTIC_SCORE,
    0,
    1,
  );

  const queryVector = await embedQuery(trimmed);
  const pool = await getPool();

  const { rows } = await pool.query<HybridSearchResult>(
    `
      WITH params AS (
        SELECT
          lower($1::text) AS phrase,
          $2::vector AS qvec,
          string_to_array(lower($1::text), ' ')::text[] AS words
      ),
      alternative_counts AS (
        SELECT "appId", COUNT(*)::int AS "alternativeCount"
        FROM "Alternative"
        GROUP BY "appId"
      ),
      expanded AS (
        SELECT
          a."id",
          a."slug",
          a."name",
          a."domain",
          a."category",
          a."subcategory",
          a."tagline",
          a."verdict",
          a."verdictConfidence",
          a."verdictSummary",
          a."priceMonthly"::text AS "priceMonthly",
          a."diyTimeEstimate",
          a."pagePriority",
          a."voteCount",
          a."embedding",
          COALESCE(ac."alternativeCount", 0)::int AS "alternativeCount",
          lower(concat_ws(' ',
            a."name", a."domain", a."category", a."subcategory", a."tagline",
            a."verdictSummary", a."coreLoopDIY", a."diyTimeEstimate",
            a."moatNotes", a."whyPeopleStillPay"
          )) AS search_text,
          p.phrase,
          p.words,
          p.qvec
        FROM "App" a
        CROSS JOIN params p
        LEFT JOIN alternative_counts ac ON ac."appId" = a."id"
        WHERE a."embedding" IS NOT NULL
      ),
      scored AS (
        SELECT
          e.*,
          GREATEST(
            CASE WHEN lower(e."name") = e.phrase THEN 1.0 ELSE 0.0 END,
            CASE WHEN left(lower(e."name"), length(e.phrase)) = e.phrase THEN 0.94 ELSE 0.0 END,
            CASE WHEN strpos(' ' || lower(e."name") || ' ', ' ' || e.phrase || ' ') > 0 THEN 0.88 ELSE 0.0 END,
            CASE WHEN strpos(' ' || e.search_text || ' ', ' ' || e.phrase || ' ') > 0 THEN 0.96 ELSE 0.0 END,
            CASE WHEN EXISTS (
              SELECT 1 FROM unnest(string_to_array(lower(e."name"), ' ')) AS nw(n)
              WHERE left(nw.n, length(e.phrase)) = e.phrase
            ) THEN 0.90 ELSE 0.0 END,
            CASE WHEN EXISTS (
              SELECT 1 FROM unnest(string_to_array(lower(e."name"), ' ')) AS nw(n)
              WHERE nw.n = ANY(e.words)
            ) THEN 0.78 ELSE 0.0 END,
            CASE WHEN EXISTS (
              SELECT 1 FROM unnest(string_to_array(e.search_text, ' ')) AS tw(t)
              WHERE tw.t = ANY(e.words)
            ) THEN 0.62 ELSE 0.0 END
          ) AS kw_score,
          (1.0 - (e."embedding" <=> e.qvec)) AS sem_score
        FROM expanded e
      ),
      filtered AS (
        SELECT
          s.*,
          (($3::float8 * s.kw_score) + ($4::float8 * s.sem_score)
            + CASE
                WHEN s.phrase LIKE '%coding%'
                  OR s.phrase LIKE '%developer%'
                  OR s.phrase LIKE '%code assistant%'
                THEN CASE WHEN s."category" = 'dev-tools' THEN 0.12 ELSE 0 END
                WHEN s.phrase LIKE '%image%'
                  OR s.phrase LIKE '%photo%'
                THEN CASE WHEN s."category" IN ('ai-image', 'generative-media', 'photo-editing', 'design') THEN 0.12 ELSE 0 END
                WHEN s.phrase LIKE '%video%'
                THEN CASE WHEN s."category" IN ('ai-video', 'audio-video', 'generative-media') THEN 0.12 ELSE 0 END
                WHEN s.phrase LIKE '%productivity%'
                THEN CASE WHEN s."category" LIKE '%productivity%' OR s."category" IN ('tasks', 'time-tracking', 'calendar', 'notes-knowledge') THEN 0.10 ELSE 0 END
                WHEN s.phrase LIKE '%assistant%'
                THEN CASE WHEN s."category" IN ('ai-assistant', 'dev-tools', 'automation') THEN 0.10 ELSE 0 END
                ELSE 0
              END
          ) AS weighted_score,
          CASE
            WHEN lower(s."name") = s.phrase THEN 'name-exact'
            WHEN left(lower(s."name"), length(s.phrase)) = s.phrase THEN 'name-prefix'
            WHEN strpos(' ' || lower(s."name") || ' ', ' ' || s.phrase || ' ') > 0 THEN 'name-contains'
            WHEN strpos(' ' || s.search_text || ' ', ' ' || s.phrase || ' ') > 0 THEN 'text-exact'
            WHEN EXISTS (
              SELECT 1 FROM unnest(string_to_array(lower(s."name"), ' ')) AS nw(n)
              WHERE left(nw.n, length(s.phrase)) = s.phrase
            ) THEN 'name-prefix-word'
            WHEN EXISTS (
              SELECT 1 FROM unnest(string_to_array(lower(s."name"), ' ')) AS nw(n)
              WHERE nw.n = ANY(s.words)
            ) THEN 'name-word'
            WHEN EXISTS (
              SELECT 1 FROM unnest(string_to_array(s.search_text, ' ')) AS tw(t)
              WHERE tw.t = ANY(s.words)
            ) THEN 'text-word'
            ELSE 'semantic-only'
          END AS match_type
        FROM scored s
        WHERE s.kw_score > 0.0 OR s.sem_score >= $5::float8
      )
      SELECT
        "id"::text AS "id",
        "slug",
        "name",
        "domain",
        "category",
        "subcategory",
        "tagline",
        "verdict",
        "verdictConfidence",
        "verdictSummary",
        "priceMonthly",
        "diyTimeEstimate",
        "pagePriority",
        "voteCount",
        "alternativeCount",
        ROUND(kw_score::numeric, 6)::float8 AS "keywordScore",
        ROUND(sem_score::numeric, 6)::float8 AS "semanticScore",
        ROUND(weighted_score::numeric, 6)::float8 AS "finalScore",
        match_type AS "matchType"
      FROM filtered
      ORDER BY weighted_score DESC, lower("name") ASC
      LIMIT $6::int
    `,
    [
      trimmed,
      vectorsToSql(queryVector),
      keywordWeight,
      semanticWeight,
      minSemanticScore,
      limit,
    ],
  );

  return rows;
}

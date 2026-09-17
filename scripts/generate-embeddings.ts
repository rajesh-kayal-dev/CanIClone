import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";
import { env, pipeline } from "@huggingface/transformers";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EMBEDDING_COLUMN = "embedding";
const BATCH_SIZE = 50;
const DIM = 384;
const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const EXPECTED_APP_COUNT = 996;

const { Pool } = pg;

function loadTargetEnv() {
  const envPath = path.join(ROOT, "packages", "database", ".env");
  const raw = fs.readFileSync(envPath, "utf8");
  const values: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function maskUrl(url: string) {
  try {
    const u = new URL(url);
    u.password = "***";
    u.search = "";
    return u.toString().replace("://", "://");
  } catch {
    return "<unparseable>";
  }
}

function asText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const v = value.trim();
    return v.length > 0 ? v : null;
  }
  if (Array.isArray(value)) {
    const items = value
      .map((item) => {
        if (item === null || item === undefined) return null;
        if (typeof item === "string") {
          const v = item.trim();
          return v.length > 0 ? v : null;
        }
        if (typeof item === "object") {
          const obj = item as Record<string, unknown>;
          const label =
            [obj.name, obj.title, obj.desc, obj.url]
              .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
              .join(": ") || JSON.stringify(item);
          return label.trim().length > 0 ? label.trim() : null;
        }
        return String(item).trim() || null;
      })
      .filter((x): x is string => x !== null);
    return items.length > 0 ? items.join(", ") : null;
  }
  return JSON.stringify(value);
}

function buildEmbeddingText(row: Record<string, unknown>): string {
  const lines: string[] = [];

  const add = (label: string, value: unknown) => {
    const text = asText(value);
    if (text) lines.push(`${label}: ${text}`);
  };

  add("Name", row.name);
  add("Category", row.category);
  add("Subcategory", row.subcategory);
  add("Tagline", row.tagline);
  add("MOAT tags", row.moatTags);
  add("MOAT notes", row.moatNotes);
  add("Why people still pay", row.whyPeopleStillPay);
  add("Requirements", row.requirements);
  add("What you lose", row.whatYouLose);
  add("Prior art", row.priorArt);
  add("Verdict summary", row.verdictSummary);
  add("Core loop", row.coreLoopDIY);
  add("DIY time estimate", row.diyTimeEstimate);
  add("Prompt", row.prompt);

  return lines.join("\n");
}

function vectorsToSql(data: Float32Array | Float64Array): string {
  return `[${Array.from(data).join(",")}]`;
}

async function verify(
  pool: pg.Pool,
  dim: number,
  expectedCount: number,
  idsSlugsHashBefore: string
): Promise<boolean> {
  const postRows = await pool.query(
    `SELECT
       count(*)::int AS total,
       count(*) FILTER (WHERE "${EMBEDDING_COLUMN}" IS NULL)::int AS null_count,
       count(*) FILTER (WHERE "${EMBEDDING_COLUMN}" IS NOT NULL)::int AS non_null_count,
       count(*) FILTER (WHERE "${EMBEDDING_COLUMN}" IS NOT NULL AND vector_dims("${EMBEDDING_COLUMN}") <> $1)::int AS wrong_dim
     FROM "App"`,
    [dim]
  );
  const post = postRows.rows[0];

  const idSlugPostRows = await pool.query(
    `SELECT md5(string_agg(md5(id || '|' || slug), '' ORDER BY id)) AS h FROM "App"`
  );
  const idsSlugsHashAfter = idSlugPostRows.rows[0].h;

  console.log("\nPost-check:");
  console.log(`  App total        = ${post.total}`);
  console.log(`  NULL embeddings  = ${post.null_count}`);
  console.log(`  non-NULL         = ${post.non_null_count}`);
  console.log(`  wrong-dim (≠${dim}) = ${post.wrong_dim}`);
  console.log(`  dimension verified = ${post.wrong_dim === 0 && post.non_null_count === expectedCount ? "yes" : "NO"}`);
  console.log(`  ids/slugs unchanged = ${idsSlugsHashBefore === idsSlugsHashAfter && idsSlugsHashAfter !== null ? "yes" : "CHANGED"}`);

  const pass =
    post.total === expectedCount &&
    post.null_count === 0 &&
    post.non_null_count === expectedCount &&
    post.wrong_dim === 0 &&
    idsSlugsHashBefore === idsSlugsHashAfter;

  return pass;
}

async function main() {
  const targetEnv = loadTargetEnv();
  const directUrl = targetEnv.DIRECT_URL;
  if (!directUrl) {
    console.error("[fatal] DIRECT_URL not found in packages/database/.env");
    process.exit(1);
  }

  env.cacheDir = path.join(ROOT, "node_modules", ".cache", "@huggingface", "transformers");

  const pool = new Pool({
    connectionString: directUrl,
    max: 2,
  });

  const fail = (message: string) => {
    console.error(`[fatal] ${message}`);
    process.exit(1);
  };

  try {
    console.log(`Target: ${maskUrl(directUrl)}`);

    const countRows = await pool.query(
      `SELECT
         count(*)::int AS total,
         count(*) FILTER (WHERE "${EMBEDDING_COLUMN}" IS NULL)::int AS null_count,
         count(*) FILTER (WHERE "${EMBEDDING_COLUMN}" IS NOT NULL)::int AS non_null_count
       FROM "App"`
    );
    const { total, null_count: nullCount, non_null_count: nonNullCount } = countRows.rows[0];

    console.log("Pre-check:");
    console.log(`  App total      = ${total}`);
    console.log(`  NULL embeddings = ${nullCount}`);
    console.log(`  non-NULL        = ${nonNullCount}`);

    if (total !== EXPECTED_APP_COUNT) {
      fail(`expected ${EXPECTED_APP_COUNT} apps but found ${total}`);
    }
    if (nonNullCount > EXPECTED_APP_COUNT) {
      fail(`non-NULL embeddings (${nonNullCount}) exceed total apps (${total})`);
    }

    if (nonNullCount === EXPECTED_APP_COUNT) {
      console.log("[done] every app already has an embedding; skipping generation.");
      const idSlugRowsDone = await pool.query(
        `SELECT md5(string_agg(md5(id || '|' || slug), '' ORDER BY id)) AS h FROM "App"`
      );
      const donePass = await verify(pool, DIM, EXPECTED_APP_COUNT, idSlugRowsDone.rows[0].h);
      console.log(donePass ? "\n[result] OK — all embeddings already present, dimensions correct, ids/slugs unchanged." : "\n[result] VERIFICATION FAILED");
      if (!donePass) process.exitCode = 1;
      return;
    }

    if (nonNullCount > 0) {
      const dimRows = await pool.query(
        `SELECT count(*)::int AS mismatched
         FROM "App"
         WHERE "${EMBEDDING_COLUMN}" IS NOT NULL AND vector_dims("${EMBEDDING_COLUMN}") <> $1`,
        [DIM]
      );
      if (dimRows.rows[0].mismatched > 0) {
        fail(`existing embeddings have non-${DIM} dimensions; refusing to resume`);
      }
      const okRows = await pool.query(
        `SELECT count(*)::int AS ok
         FROM "App"
         WHERE "${EMBEDDING_COLUMN}" IS NOT NULL AND vector_dims("${EMBEDDING_COLUMN}") = $1`,
        [DIM]
      );
      if (okRows.rows[0].ok !== nonNullCount) {
        fail("inconsistent embedding dimension state; refusing to proceed");
      }
      console.log(`[resume] ${nonNullCount} existing embeddings verified (dim ${DIM}); processing ${nullCount} remaining.`);
    }

    const idSlugRows = await pool.query(
      `SELECT md5(string_agg(md5(id || '|' || slug), '' ORDER BY id)) AS h FROM "App"`
    );
    const idsSlugsHashBefore = idSlugRows.rows[0].h;

    console.log("Loading embedding model...");
    const extractor = await pipeline("feature-extraction", MODEL_ID);
    console.log(`Model loaded: ${MODEL_ID} (local/ONNX)`);

    const failures: Array<{ id: string; slug: string; error: string }> = [];
    let processed = 0;
    let skipped = 0;
    let failed = 0;
    const totalToProcess = nullCount;

    const report = (force = false) => {
      if (force || processed === totalToProcess || processed % 100 === 0) {
        console.log(`[${processed}/${totalToProcess}]`);
      }
    };

    while (true) {
      const batchRows = await pool.query(
        `SELECT "id", "slug", "name",
                "category", "subcategory", "tagline",
                "requirements", "whatYouLose", "moatTags",
                "moatNotes", "whyPeopleStillPay", "priorArt",
                "verdictSummary", "coreLoopDIY", "diyTimeEstimate",
                "prompt"
         FROM "App"
         WHERE "${EMBEDDING_COLUMN}" IS NULL
         ORDER BY "id"
         LIMIT $1`,
        [BATCH_SIZE]
      );

      if (batchRows.rows.length === 0) break;

      for (const row of batchRows.rows) {
        try {
          const text = buildEmbeddingText(row);
          if (!text) {
            throw new Error("no text fields available to embed");
          }
          const output = await extractor(text, { pooling: "mean", normalize: true });
          const data = output.data as Float32Array | Float64Array;
          if (data.length !== DIM) {
            throw new Error(`model returned ${data.length} dims, expected ${DIM}`);
          }

          const result = await pool.query(
            `UPDATE "App"
             SET "${EMBEDDING_COLUMN}" = $2::vector
             WHERE "id" = $1 AND "${EMBEDDING_COLUMN}" IS NULL`,
            [row.id, vectorsToSql(data)]
          );

          if (result.rowCount === 1) {
            processed++;
          } else {
            skipped++;
          }
        } catch (error) {
          failed++;
          failures.push({
            id: row.id,
            slug: row.slug,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        report();
      }
    }

    console.log(`\nEmbedding summary: processed=${processed} skipped=${skipped} failed=${failed}`);

    if (failures.length > 0) {
      console.log("\nFailures:");
      for (const f of failures) {
        console.log(`  [${f.id}] ${f.slug}: ${f.error}`);
      }
    }

    const pass = await verify(pool, DIM, EXPECTED_APP_COUNT, idsSlugsHashBefore);

    if (!pass) {
      console.error("\n[result] VERIFICATION FAILED");
      process.exitCode = 1;
    } else {
      console.log("\n[result] OK — all embeddings populated, dimensions correct, ids/slugs unchanged.");
    }
  } catch (error) {
    console.error("[fatal]", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
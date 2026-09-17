import dotenv from "dotenv";

dotenv.config({ path: "packages/database/.env" });

const { hybridSearchApps } = await import("@caniclone/database");

const QUERIES = [
  "Claude Code",
  "AI coding agent",
  "AI image generation",
  "AI video editor",
  "open source productivity tool",
  "developer coding assistant",
];

async function maskPooledUrl() {
  const url = process.env.SEARCH_DATABASE_URL ?? process.env.DIRECT_URL;
  if (!url) return "<missing>";
  const u = new URL(url);
  u.password = "***";
  u.search = "";
  return u.toString();
}

async function run(query: string) {
  const results = await hybridSearchApps(query, { limit: 5 });
  console.log(`\n=== "${query}" (${results.length} results) ===`);
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    console.log(
      `  ${i + 1}. ${r.name}  (${r.slug})  [${r.category}]  kw=${r.keywordScore} sem=${r.semanticScore} final=${r.finalScore} via ${r.matchType}`
    );
  }
}

async function main() {
  console.log(`Search target: ${await maskPooledUrl()}`);
  for (const q of QUERIES) {
    try {
      await run(q);
    } catch (error) {
      console.error(`\n[error] "${q}": ${error instanceof Error ? error.message : error}`);
      process.exitCode = 1;
    }
  }
}

main();
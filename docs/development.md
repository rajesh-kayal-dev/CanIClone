# CanIClone development guide

This guide documents the commands and setup currently present in the repository.

## Prerequisites

- Node.js 22 or newer is the CI baseline.
- pnpm `10.33.0` (the version pinned in `package.json`).
- PostgreSQL with the `vector` extension.
- Provider credentials for the features being developed.

There is no root `engines` field yet. Use Corepack to activate the pinned pnpm version:

```bash
corepack enable
```

## Installation

```bash
pnpm install
```

Local environment files are ignored by Git. Start from the templates:

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
```

The API loads the root `.env` and `packages/database/.env` through `apps/api/src/config/env.ts`. Prisma CLI commands use `packages/database/.env`, and Next.js reads `apps/web/.env.local`.

Never copy real credentials into `.env.example` or commit an environment file.

## Workspace structure

```text
apps/web       Next.js frontend
apps/api       Express API and WebSocket server
packages/ai    Shared AI prompts, schemas, and provider services
packages/database
               Prisma client, schema, migrations, and hybrid search
data/apps      Application catalog source data
scripts        Import, embedding, and search utilities
docs           Architecture and development documentation
```

The repository uses the workspace globs in `pnpm-workspace.yaml` and Turborepo for build orchestration.

## Database setup

Set the runtime and direct database URLs before generating the Prisma client:

```bash
pnpm db:generate
```

`DATABASE_URL` is used by the runtime. `DIRECT_URL` is used by Prisma CLI and migration operations. `SEARCH_DATABASE_URL` is optional and is used by hybrid search when supplied; otherwise the search code falls back to `DIRECT_URL`.

Validate the schema:

```bash
pnpm --filter @caniclone/database db:validate
```

Apply migrations only after reviewing the migration files and taking the appropriate database backup:

```bash
pnpm --filter @caniclone/database db:migrate
```

Do not edit or delete an applied migration to repair local state. Create a reviewed forward migration instead.

## Running the application

Start both development applications through the root command:

```bash
pnpm dev
```

The root `predev` script generates Prisma Client and builds the database and AI packages before starting development tasks.

Run one application independently:

```bash
pnpm --filter @caniclone/web dev
pnpm --filter @caniclone/api dev
```

The web development server uses port `6001`. The API uses `PORT`, defaulting to `7000`, and attaches the WebSocket server at `/ws`.

## Existing commands

```bash
# Lint the Next.js application
pnpm lint

# Typecheck the web application and build the API
pnpm typecheck

# Build all workspace packages and applications
pnpm build

# Database schema validation
pnpm --filter @caniclone/database db:validate

# Import the application catalog
pnpm import:apps

# Generate or resume application embeddings
pnpm embed:apps

# Check hybrid search
pnpm test:hybrid

# Sync Trends API data
pnpm market:sync:trends

# Run the existing analysis script for selected slugs
pnpm --filter @caniclone/api test:analysis
```

The repository does not currently define a root automated test command. Use the validation commands above and targeted manual checks for the area you change.

## Development workflow

1. Keep the worktree focused and preserve unrelated local changes.
2. Make application changes with their existing route, API, persistence, and WebSocket contracts in mind.
3. Update `.env.example` or documentation when configuration changes.
4. Run lint, typecheck, and build for code changes.
5. Run `db:validate` for schema or Prisma configuration changes.
6. Review the diff for secrets, generated files, migration changes, and unintended provider changes.

## Provider and research changes

The shared AI package owns provider calls. Gemini 2.5 Flash is primary and Groq `openai/gpt-oss-120b` is the fallback. Do not add a second provider architecture casually.

Firecrawl is called by the API research integration. If a provider or Firecrawl is unavailable, preserve the existing honest error/degraded-state behavior; do not fabricate research or AI output.

## Common troubleshooting

### `pnpm install` reports an outdated lockfile

The current worktree has a stale `@caniclone/utils` entry in `pnpm-lock.yaml` after that unused package was removed. Do not bypass the issue by committing an unreviewed lockfile change. Reconcile the lockfile with the workspace manifests in a dedicated dependency-cleanup change, then rerun:

```bash
pnpm install --frozen-lockfile
```

### `DATABASE_URL is not defined`

The database client requires a runtime `DATABASE_URL`. Confirm the root/API environment is loaded and that `packages/database/.env` contains the expected values. Prisma CLI operations additionally require `DIRECT_URL`.

### Prisma reports a missing vector extension

The schema uses PostgreSQL's `vector` extension. Confirm that the target database has the extension available and that the migration/user has permission to create or use it.

### AI features are disabled

Check `GEMINI_API_KEY` and `GROQ_API_KEY` on the API process. The capabilities endpoint reports AI availability; keys must not be placed in `NEXT_PUBLIC_*` variables.

### Research is unavailable

Check `FIRECRAWL_API_KEY` and the API logs. The UI intentionally reports live research as unavailable when the integration is not configured or the request fails.

### Hybrid search cannot connect

Provide `SEARCH_DATABASE_URL`, or ensure `DIRECT_URL` is available as the fallback. The search path uses the existing 384-dimension embeddings and does not regenerate them.

### Port already in use

Set a different `PORT` for the API and update `NEXT_PUBLIC_API_URL` and the WebSocket base URL used by the web environment. The web dev script is configured for port `6001`.

## Before opening a pull request

Run the relevant commands:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

For database changes, also run:

```bash
pnpm --filter @caniclone/database db:validate
```

Do not commit credentials, generated build output, database data, or migration history changes without review.

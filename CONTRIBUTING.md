# Contributing to CanIClone

Thank you for helping improve CanIClone. This is an individually maintained project, so focused, well-described contributions are especially valuable.

## Project overview

CanIClone is a product research and build-planning workspace. It combines an application directory, hybrid search, market and opportunity views, an Ideas workspace, and an app-level AI assistant.

The application uses a Next.js frontend, an Express API, a shared AI package, Prisma, and PostgreSQL/pgvector. AI requests use Gemini 2.5 Flash as the primary provider and Groq `openai/gpt-oss-120b` as the fallback. Live research uses Firecrawl.

## Prerequisites

- Node.js 22 or newer
- pnpm `10.33.0`
- PostgreSQL with the `vector` extension
- Provider keys for the features you want to exercise

The repository does not currently define a root `engines` field; Node.js 22 is the CI baseline.

## Local setup

```bash
corepack enable
pnpm install
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
```

Configure the database variables in `packages/database/.env` before running Prisma commands. The API loads the root `.env` and `packages/database/.env`; Next.js reads `apps/web/.env.local`.

Generate the Prisma client:

```bash
pnpm db:generate
```

## Running the project

Start the web and API development servers:

```bash
pnpm dev
```

Run one application independently:

```bash
pnpm --filter @caniclone/web dev
pnpm --filter @caniclone/api dev
```

The web app runs on port `6001`; the API and WebSocket server use `PORT`, which defaults to `7000`.

## Development workflow

1. Create a focused branch from the current base branch.
2. Make the smallest change that addresses the issue or feature.
3. Keep application behavior, API contracts, database migrations, and provider configuration changes explicit.
4. Run the relevant validation commands before opening a pull request.
5. Update documentation when behavior, setup, or configuration changes.

Suggested branch names:

- `feat/short-description`
- `fix/short-description`
- `docs/short-description`
- `chore/short-description`

## Code quality expectations

- Prefer clear, typed TypeScript and small, purposeful functions.
- Keep changes scoped to the requested behavior.
- Do not commit secrets, `.env` files, database credentials, or provider keys.
- Do not fabricate AI output or research results when a provider is unavailable.
- Do not change the Gemini-to-Groq fallback contract casually.
- Do not add another research provider or move Firecrawl into the AI provider package.
- Do not edit or rewrite applied Prisma migrations. Use a reviewed forward migration for schema changes.
- Preserve anonymous ownership checks and existing REST/WebSocket contracts unless the change explicitly calls for a contract update.
- Add or update documentation for user-visible behavior and configuration changes.

## Running validation

Run the commands that apply to your change:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm --filter @caniclone/database db:validate
```

There is currently no root automated test script. For database or integration changes, also exercise the relevant existing manual scripts and document what you ran.

## Bug reports

Open a bug report using the repository template. Include a minimal reproduction, expected and actual behavior, environment details, and redacted logs or screenshots. Never include API keys, database URLs, or private user data.

## Feature requests

Describe the user problem before proposing the solution. Explain alternatives considered, affected routes or packages, and how the change fits the current architecture. Features that require a new provider, persistence model, or protocol should be discussed before implementation.

## Pull request expectations

A pull request should include:

- a concise description of what changed and why;
- the relevant validation commands and results;
- screenshots or recordings for visible UI changes;
- notes about migrations, environment variables, or deployment implications;
- a clear statement when there are no breaking changes.

Keep pull requests focused. Unrelated formatting, dependency upgrades, and refactors should be separate changes.

## Commit expectations

There is no enforced commit-message tool in the repository. Use clear, imperative subjects such as `fix research error handling` or `docs update setup instructions`. Avoid vague subjects such as `changes` or `fix stuff`.

## Important architectural rules

- Keep the shared AI package as the owner of prompts, schemas, and provider calls.
- Keep Gemini 2.5 Flash primary and Groq `openai/gpt-oss-120b` fallback unless a separate design decision is approved.
- Keep Firecrawl behind the API research integration.
- Keep PostgreSQL access behind `@caniclone/database` and Prisma.
- Treat applied migrations as immutable history.
- Keep Ideas and App Assistant ownership and persistence behavior explicit.
- Do not claim that optional provider or research services are available when their credentials are missing.

# Changelog

## Unreleased

### Added

- Ideas workspace with onboarding, persisted idea context, streaming conversation, live research, prompt refinement, and MVP generation.
- App-level AI workspace for application details, including research, prompt refinement, MVP generation, and streaming responses.
- Application directory views for search, app details, alternatives, market information, clone-list ranking, and build opportunities.
- Hybrid search and market data integrations backed by the existing PostgreSQL/pgvector data model.

### Changed

- Shared AI requests use Gemini 2.5 Flash as the primary provider and Groq `openai/gpt-oss-120b` as the fallback.
- Research remains behind the API research service and Firecrawl integration; unavailable research is reported honestly.
- API and frontend code is organized around the current Ideas, App Assistant, market, opportunities, and AI-workspace responsibilities.

### Notes

- No historical release entries are documented yet.
- No root automated test script is currently defined.

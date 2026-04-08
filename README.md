# ResearchLog

ResearchLog is a structured research memory workspace for computer science practitioners. It tracks ideas, experiments, decisions, research assets, and later an LLM-generated idea graph.

## Current prototype

This first implementation focuses on the MVP v1 loop from `research_log_prd.md`:

- Idea list and quick creation
- Experiment list and quick creation
- Decision log capture
- Status/type updates and delete actions
- Detail panels for maintaining idea, experiment, and decision records
- Markdown text areas with lightweight previews for experiment notes and decisions
- Experiment comparison across setup, metrics, conclusions, and next steps
- Search and status filtering for core records
- Timeline feed
- Basic Vault v1.5 foundation for Token, Server, Platform, and Template assets
- Token secrets are encrypted at rest and shown only as masked previews in the asset list
- Vault asset update, delete, revoke, archive, reveal, and copy flows
- Vault reveal/copy requires `VAULT_PASSWORD`, logs an audit event, and updates last-used time
- Experiments can link to Vault assets for reproducibility context
- Research Map v2 foundation with IdeaProfile, IdeaRelation, GraphAnalysisJob, configurable graph analysis settings, provider abstraction, rule-based regeneration, and explainable relation detail
- Optional OpenAI-compatible graph inference through `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and the `openai-compatible` provider setting
- Research Map relation review with Suggested, Accepted, Hidden, and Rejected states plus relation filters for status, type, provider, and confidence
- Research Map review notes and three graph views: Network, Evolution, and Clusters
- Local profile embeddings and candidate pair retrieval for graph analysis
- Refresh behavior settings for manual, create-triggered, update-triggered, and incremental graph regeneration
- Graph analysis jobs track candidates, proposed relations, inserted relations, request fallback, and provider errors

Data is persisted with Prisma and a local SQLite database at `prisma/dev.db`. The first workspace load seeds sample records from `lib/sample-data.ts` when the database is empty. Authentication and production key management are intentionally deferred.

Vault encryption uses `VAULT_ENCRYPTION_KEY`. If it is not set, the app falls back to a local development key so the prototype can run, but real use should set a long random value in `.env`.

Research Map uses the local `rule-engine` provider by default. To test a real OpenAI-compatible endpoint, set `OPENAI_API_KEY`, optionally set `OPENAI_BASE_URL` and `OPENAI_REQUEST_TIMEOUT_MS`, then change the Research Map provider to `openai-compatible` in the AI Settings panel. If the external request fails, graph generation falls back to the local rule engine and records the reason on the analysis job.

## Code structure

- `app/page.tsx` owns page state, data mutations, and section composition.
- `components/workspace-ui.tsx` contains only small shared workspace pieces such as summary cards and timeline rendering.
- `components/ideas-ui.tsx`, `components/experiments-ui.tsx`, and `components/decisions-ui.tsx` own the core research record panels and lists.
- `components/vault-ui.tsx` owns Vault panels, asset lists, and audit rendering.
- `components/research-map-ui.tsx` owns graph rendering, relation review, and AI settings UI.
- `components/form-controls.tsx` contains shared form inputs and lightweight Markdown helpers.
- `lib/use-workspace.ts` loads and refreshes the workspace snapshot.
- `lib/constants.ts` keeps shared statuses and navigation definitions.
- `lib/form-utils.ts` contains small form parsing helpers.
- `lib/graph-providers.ts` contains the Research Map provider abstraction and local graph inference engines.
- `lib/repository.ts` is the server-side persistence boundary.
- `*.test.ts` files use Bun's built-in test runner.

## Run locally

```bash
bun install
bun run dev
```

For checks:

```bash
bun test
bunx tsc --noEmit
bun run build
bun run test:e2e
```

For database updates:

```bash
bun run db:push
```

For migration-based environments:

```bash
bun run db:migrate
bun run db:deploy
```

Deployment preflight and secret handling notes live in `DEPLOYMENT.md`.

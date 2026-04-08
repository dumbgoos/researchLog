# Deployment

ResearchLog is currently optimized for a single-user deployment. Treat Vault and AI provider settings as production secrets.

## Required Environment

- `DATABASE_URL`: Prisma database URL. Use a persistent database in production.
- `VAULT_ENCRYPTION_KEY`: Long random secret used for Vault encryption.
- `VAULT_PASSWORD`: Password required for reveal/copy actions.
- `OPENAI_API_KEY`: Optional. Required only for the `openai-compatible` Research Map provider.
- `OPENAI_BASE_URL`: Optional OpenAI-compatible base URL. Defaults to `https://api.openai.com/v1`.
- `OPENAI_REQUEST_TIMEOUT_MS`: Optional model request timeout.

## Preflight Checks

Run these before deploying:

```bash
bun install
bun run typecheck
bun test
bun run build
bun run test:e2e
```

## Database

For local development, `bun run db:push` is enough. For deployment environments, prefer migration-based flows:

```bash
bun run db:deploy
```

The current CI still uses `db:push` because Prisma's schema engine has been flaky on this Windows workstation. The migration files are present for environments where `migrate deploy` is stable.

## Vault Safety

- Do not store SSH private keys or root passwords.
- Rotate `VAULT_ENCRYPTION_KEY` only with a planned data migration.
- Keep `VAULT_PASSWORD` out of source control.
- Review `VaultAuditLog` after reveal/copy operations when testing a production environment.

## E2E Notes

`bun run test:e2e` creates a fresh `prisma/e2e.db`, starts Next.js on `127.0.0.1:3100`, and runs the browser smoke test.

If browser download fails locally but Chrome or Edge is already installed, set:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="/path/to/chrome-or-edge"
```

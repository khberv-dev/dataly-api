# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev       # watch mode (hot reload)
npm run start:debug     # debug + watch

# Build & production
npm run build           # compile via NestJS CLI
npm run start:prod      # run compiled dist/

# Lint & format
npm run lint            # ESLint with auto-fix
npm run format          # Prettier write

# Tests
npm run test            # unit tests (jest, rootDir: src)
npm run test:watch      # jest watch
npm run test:cov        # with coverage
npm run test:e2e        # e2e suite (test/jest-e2e.json)
# Run a single test file:
npx jest src/path/to/file.spec.ts

# Database migrations (TypeORM)
npm run migration:generate -- src/migrations/<MigrationName>
npm run migration:run
npm run migration:revert
```

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `DB_HOST` | `localhost` | Postgres host |
| `DB_PORT` | `5432` | Postgres port |
| `DB_USER` | `postgres` | DB username |
| `DB_PASSWORD` | `postgres` | DB password |
| `DB_NAME` | `dataly` | Database name |
| `JWT_SECRET` | `change-me` | JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | JWT TTL |
| `PORT` | `3000` | HTTP port |

## Architecture

This is a NestJS + TypeORM (PostgreSQL) REST API. All column names use `snake_case` via `SnakeNamingStrategy`.

### Module layout

```
src/
  common/                   # Shared cross-cutting concerns
    decorators/             # @Public() (skip JWT), @CurrentUser()
    guards/                 # JwtAuthGuard (global APP_GUARD)
    pipes/                  # Global ValidationPipe (class-validator)
  core/                     # Feature modules
    auth/                   # JWT login/register, returns { accessToken }
    user/                   # UserEntity CRUD (password excluded from SELECT by default)
    keys/                   # API key store (KeyEntity, unique per KeyType enum)
    marketing/              # Aggregation layer — joins FB + amoCRM data
    facebook/               # Wraps Meta Graph API v25.0 (ad accounts, campaigns, insights)
    amocrm/                 # Wraps amoCRM API (paginated lead fetching)
  shared/
    config/
      database.source.ts    # TypeORM DataSource (also used by migration CLI)
      jwt.config.ts         # NestJS registered config namespace "jwt"
    utils/
      hash.util.ts          # bcryptjs helpers
```

### Auth

`JwtAuthGuard` is registered globally as `APP_GUARD` in `AppModule`. All routes require a valid JWT by default. Decorate a handler or controller with `@Public()` to skip authentication (used on `/auth/login` and `/auth/register`).

### Keys module

`KeyEntity` stores one row per `KeyType` (`meta`, `amocrm`). The `key` column is masked to `********XXXX` in responses via `@Transform`. `MarketingService` calls `KeysService.findByType()` and throws `BadRequestException` if the required key is not yet configured.

### amoCRM key format

The amoCRM key stored in the DB is `<subdomain>:<accessToken>` (colon-separated). `AmoCrmService.parseKey()` splits on the first colon.

### Marketing aggregation flow

- `GET /marketing/accounts` — lists Facebook ad accounts for the stored Meta key.
- `GET /marketing/accounts/:accountId/campaigns` — fetches Facebook campaigns (last 30 days insights), fetches amoCRM closed deals (status 142, last 30 days), and maps deals to campaigns by:
  1. `utm_campaign` custom field value (matches FB campaign id)
  2. Fallback: parses a FB lead id from the deal name (`№<id>`) and calls Graph API (`v20.0`) to resolve its campaign

The response includes both raw FB metrics (`spendUsd`, `reach`, `views`, `clicks`, `cpm`, `frequency`, video watch metrics) and derived metrics (`spendUzs` = USD × 12 000 used for ROAS internally, `roas`, `cpl`, `cac`, `hookRate`, `holdRate`, `linkCtr`, `visitRate`, `leadRate`, `leadsCount`, `overallLeadsCount`).

amoCRM pagination caps at 100 pages × 250 items per page. FB lead-to-campaign resolution is done with `Promise.allSettled` — individual failures are silently skipped.

### Database

`synchronize: true` is set in `database.source.ts` — schema changes are applied automatically on startup in all environments. Migrations exist as scripts but are not the primary sync mechanism currently.

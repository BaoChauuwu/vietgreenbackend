# VietGreenX Backend

NestJS REST API for the VietGreenX green agriculture platform — managing traceability, certifications, an agriculture social network, and e-commerce.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11, TypeScript 5 |
| Database | PostgreSQL 16 (TypeORM, multi-schema) |
| Cache / Queue | Redis 7, BullMQ |
| Auth | JWT (access + refresh token, version-based revocation) |
| Storage | AWS S3 |
| Email | Nodemailer |
| Monitoring | Sentry |
| Docs | Swagger / OpenAPI |

## Prerequisites

- Node.js 22+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

## Quick Start (Docker)

```bash
# 1. Clone repo
git clone <repo-url>
cd vietgreenx-backend

# 2. Copy env
cp .env .env.local
# Edit .env.local with your configuration

# 3. Start the full stack
docker compose up -d

# App runs at   http://localhost:9000
# Swagger UI at http://localhost:9000/api/docs
```

## Manual Setup (Local)

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure env
cp .env .env.local

# 3. Run migrations
npm run migration:run

# 4. (Optional) Seed sample data
npm run seed:run

# 5. Start the dev server
npm run start:dev
```

## Environment Variables

See [`.env`](.env) for the full list. Required variables:

| Variable | Description |
|---|---|
| `AUTH_JWT_SECRET` | JWT signing secret (use a strong random string in production) |
| `AUTH_JWT_TOKEN_EXPIRES_IN` | Access token lifetime, e.g. `15m`, `1h` |
| `DATABASE_HOST` | PostgreSQL host |
| `DATABASE_USERNAME` | PostgreSQL username |
| `DATABASE_PASSWORD` | PostgreSQL password |
| `DATABASE_NAME` | Database name |
| `REDIS_HOST` | Redis host |
| `SENTRY_DSN` | Sentry DSN (leave empty in dev) |
| `BACKEND_DOMAIN` | Backend domain, e.g. `https://api.vietgreenx.vn` |
| `FRONTEND_DOMAIN` | Frontend domain, e.g. `https://vietgreenx.vn` |

> **Docker Compose**: When running with docker compose, set `DATABASE_HOST=postgres` and `REDIS_HOST=redis`.

## Scripts

```bash
# Development
npm run start:dev          # Hot reload
npm run start:debug        # Debug mode

# Build & Production
npm run build
npm run start:prod

# Database
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert the last migration
npm run migration:generate -- --name=MigrationName  # Generate a new migration
npm run seed:run           # Seed sample data

# Code quality
npm run lint               # ESLint
npm run format             # Prettier

# Tests
npm run test               # Unit tests
npm run test:cov           # Unit tests + coverage report
npm run test:e2e           # E2E tests
```

## Project Structure

```
src/
├── common/                 # Shared guards, filters, interceptors, decorators
│   ├── guards/             # AuthGuard (admin), RolesGuard
│   ├── filters/            # HttpExceptionFilter (Sentry integration)
│   ├── interceptors/       # Transform, Logging, ActivityLog, AuditLog
│   └── errors/             # Custom error classes
├── config/                 # ConfigService validation (class-validator)
├── database/
│   ├── migrations/         # 20 migration files (PostgreSQL multi-schema)
│   ├── seeds/              # Dev seed data
│   └── typeorm/
│       ├── entities/       # 48 TypeORM entities
│       └── repositories/   # Repository layer with BaseRepository
├── job/                    # Scheduled jobs (BullMQ)
│   ├── account-purge.job.ts        # Remove deactivated accounts
│   └── certification-expiry.job.ts # Update expired certification status
├── modules/
│   ├── admin/              # Admin panel APIs
│   └── app/                # App APIs (mobile/web)
│       ├── app-auth/       # Auth flow: register, login, OTP, refresh, logout
│       ├── feed/           # News feed (discovery + following mode)
│       ├── qr-quota/       # QR code quota management per billing cycle
│       └── ...             # Organizations, posts, comments, reactions, ...
└── services/
    ├── otp/                # OTP service (phone + email, rate limiting via Redis Lua)
    ├── redis/              # RedisService (atomic Lua scripts)
    └── email/              # Email service (Nodemailer)
```

## Authentication

The project uses **JWT dual-token** (access + refresh):

- **Access token**: short-lived (default 7d), contains `{ sub, role, v }` — `v` is the version field used to revoke tokens after a password change
- **Refresh token**: long-lived (30d), stored as a SHA-256 hash in the DB (`user_sessions`)
- **Session revocation**: changing password atomically increments `version + 1`, invalidating all previously issued tokens

## API Documentation

Swagger UI is available at `/api/docs` when the server is running.

## Tests

```bash
npm run test:cov
```

| Test suite | Coverage |
|---|---|
| `OtpService` | ~70% |
| `AppAuthService` | ~76% |
| `AdminAuthService` | ~96% |
| `FeedService` | ~86% |
| `QrQuotaService` | ~80% |
| `AppAuthGuard` | ~100% |
| `AuthGuard` (admin) | ~100% |

## Database Schema

The database uses **PostgreSQL multi-schema**:

| Schema | Description |
|---|---|
| `identity` | Users, profiles, organizations, sessions |
| `content` | Posts, hashtags, media |
| `engagement` | Reactions, comments, shares |
| `social_graph` | Follows, blocks |
| `messaging` | Conversations, messages |
| `agriculture` | Products, batches, QR, certifications, orders |
| `analytics` | Activity logs (partitioned by quarter) |
| `moderation` | Reports, audit logs |
| `notification` | Notifications |
| `system` | App versions, feature flags |

## Contributing

1. Branch from `develop`: `git checkout -b feature/feature-name`
2. Follow conventional commits: `feat:`, `fix:`, `chore:`
3. Open a PR into `develop` — CI will run lint + typecheck + tests automatically
4. Merge into `main` when ready to release

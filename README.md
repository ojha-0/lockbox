# Lockbox Verify API (PERN + Next.js)

Lockbox is positioned as an API-first identity verification platform, similar to Persona-style KYC workflows.
External software products can integrate directly with the verification API instead of building in-house KYC infrastructure.

Integration model:
- Your software authenticates as a verifier organization
- Your backend calls verification endpoints with a citizen national ID and purpose
- API returns policy-filtered fields, consent-aware decisions, and auditable outcomes

This repository is now documented as a complete PERN-stack system:
- PostgreSQL: core identity, policy, and audit data
- Express + Node.js: API, auth, and business rules
- React via Next.js: citizen and verifier web apps

## 1. Product Goal
Lockbox is a digital identity verification platform for secure, auditable KYC and role-based data sharing.

Core capabilities:
- Citizen authentication with national ID
- Verifier organization authentication by business type
- Policy-based field-level access (bank, pharmacy, age verification)
- Immutable audit trail for each access decision
- Suspicious-activity flagging for brute-force and abuse patterns

## 2. Repository Layout
Current repository folders:

```text
backend/                 # Express API (Node.js)
citizen-app/             # Next.js app for citizens
database/                # PostgreSQL schema and migrations
  schema.sql
  migrate.sql
  migrate_drugs.sql
  migrate_photos.sql
  migrate_suspicious.sql
deployment/              # Deployment runbooks
verifier-scanner/        # Next.js app for verifiers/scanners
```

Note: In the current workspace snapshot, app folders are empty. This README defines the exact target architecture and setup for implementing them as full PERN services.

## 3. Target Architecture (Exact PERN)

```text
[Citizen Next.js App] ----\
                           >--- [Express API on Node.js] --- [PostgreSQL]
[Verifier Next.js App] ---/
```

Data flow:
1. Frontend authenticates against Express API.
2. Express validates credentials, issues JWT, enforces role + policy checks.
3. Express reads/writes PostgreSQL and records all verification actions into audit tables.
4. Frontend renders only permitted data fields returned by API.

## 4. Database (PostgreSQL)
Your source-of-truth SQL files are already present under database:

- `database/schema.sql`: full schema and seed data
- `database/migrate.sql`: baseline migration for Supabase SQL editor workflow
- `database/migrate_drugs.sql`: pharmacy allowed-drugs permissions
- `database/migrate_photos.sql`: user photo updates
- `database/migrate_suspicious.sql`: suspicious activity simulation data

Main tables already modeled:
- `users`
- `citizen_profiles`
- `verifier_organizations`
- `permission_policies`
- `audit_trail`
- `admin_users`
- `suspicious_activity`
- `verification_logs`

## 5. Backend Service Contract (Express + Node.js)
Expected backend responsibilities:
- Auth: citizen login, verifier login, admin login
- Verification: evaluate liveness/identity result and data policy
- Policy engine: map `business_type -> allowed_fields`
- Audit logging: store decision details on every request
- Suspicious detection: threshold checks and alert insertions

Recommended API namespace:
- `/api/v1/auth/*`
- `/api/v1/citizens/*`
- `/api/v1/verifications/*`
- `/api/v1/admin/*`
- `/api/v1/health`

Recommended minimal endpoints:
- `POST /api/v1/auth/citizen/login`
- `POST /api/v1/auth/verifier/login`
- `POST /api/v1/verifications/execute`
- `GET /api/v1/citizens/me/audit-trail`
- `GET /api/v1/admin/suspicious-activity`
- `GET /api/v1/health`

## 6. Frontend Apps (React with Next.js)
### citizen-app (Next.js)
- Citizen login and session handling
- Face verification/liveness flow UI
- Consent and data-sharing prompt
- Personal audit trail timeline

### verifier-scanner (Next.js)
- Verifier org login
- QR/token scan workflow
- Purpose + business context submission
- Allowed-field response display only

## 7. Environment Variables
Create separate `.env` files per service.

Backend (`backend/.env`):
```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>?sslmode=require
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<long-random-secret>
REFRESH_TOKEN_EXPIRES_IN=7d
HMAC_SECRET=<long-random-secret>
CORS_ORIGIN_CITIZEN=https://<citizen-domain>
CORS_ORIGIN_VERIFIER=https://<verifier-domain>
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
```

Citizen app (`citizen-app/.env.local`):
```env
NEXT_PUBLIC_API_BASE=https://<api-domain>
NEXT_PUBLIC_APP_ENV=production
```

Verifier app (`verifier-scanner/.env.local`):
```env
NEXT_PUBLIC_API_BASE=https://<api-domain>
NEXT_PUBLIC_APP_ENV=production
```

## 8. Local Development Setup
If folders are empty, scaffold first:

```bash
# from repo root
mkdir backend citizen-app verifier-scanner

# backend
cd backend
npm init -y
npm install express cors helmet morgan dotenv pg bcrypt jsonwebtoken zod express-rate-limit
npm install -D nodemon typescript ts-node @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken

# citizen app
cd ../
npx create-next-app@latest citizen-app --typescript --eslint --app

# verifier app
npx create-next-app@latest verifier-scanner --typescript --eslint --app
```

Database setup:
1. Provision PostgreSQL (Supabase/Neon/RDS).
2. Run `database/schema.sql`.
3. Run optional migration scripts in this order:
- `database/migrate.sql` (if needed for your baseline)
- `database/migrate_drugs.sql`
- `database/migrate_photos.sql`
- `database/migrate_suspicious.sql`

Run services locally:
```bash
# backend
cd backend
npm run dev

# citizen app
cd ../citizen-app
npm run dev

# verifier app
cd ../verifier-scanner
npm run dev
```

## 9. Security and Compliance Checklist
- Hash all passwords with bcrypt (`cost >= 10`)
- Sign JWTs with separate access/refresh secrets
- Enforce strict CORS for known frontend origins
- Use HTTPS-only cookies for refresh tokens
- Apply rate limiting on auth and verification routes
- Log every verification decision to `audit_trail`
- Avoid returning unrestricted PII in API responses
- Encrypt DB connections (`sslmode=require`)

## 10. Testing Checklist
- Citizen login success/failure
- Verifier login success/failure
- Policy enforcement by `business_type`
- Audit row created on every verification attempt
- Suspicious activity row generated on threshold breach
- Cross-origin requests blocked for unknown origins

## 11. Deployment
Full production deployment guide is in:
- `deployment/README.md`

It contains exact steps for PostgreSQL setup, backend deployment, Next.js deployment, environment variables, smoke tests, and rollback.

## 12. Current Status and Next Action
Current repository status:
- Database design: ready
- Documentation: ready
- Runtime services (backend/citizen/verifier): to be implemented in folders

Recommended next action:
1. Scaffold the three runtime services using section 8.
2. Implement API endpoints from section 5.
3. Deploy using `deployment/README.md`.

## 13. Dual Postgres Sync Mode (Supabase Primary + Local Fallback)

This project supports a dual-database mode for resilience:
- Primary: Supabase Postgres (`DATABASE_URL`)
- Fallback: Local Postgres (`LOCAL_DATABASE_URL`)

Behavior:
1. Reads and writes use Supabase when reachable.
2. If Supabase is unreachable, writes continue on local Postgres.
3. Offline writes are stored in `db_sync_outbox` locally.
4. When Supabase becomes reachable again, the app replays queued outbox writes to Supabase.

Required environment variables:

```env
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<pooler-host>:6543/postgres
LOCAL_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_SYNC_INTERVAL_MS=15000
```

Operational endpoints:
- `GET /api/v1/health/db` → routing + outbox stats
- `POST /api/v1/health/db/sync` → trigger immediate sync attempt


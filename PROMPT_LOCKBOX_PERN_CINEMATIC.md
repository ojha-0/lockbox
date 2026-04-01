# Lockbox Master Build Prompt (PERN + Next.js + Cinematic UI)

Use this exact prompt with a coding-capable AI model to generate or refactor the project into a production-ready, super-animated, fully integrated PERN website.

---

You are a senior full-stack architect and UI motion engineer.
Build a production-grade Lockbox platform with a cinematic, premium, highly responsive UI and complete PERN integration.

## 1) Project Context and Non-Negotiables

- Product: Lockbox digital identity verification and consent platform.
- Stack:
  - Frontend: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Framer Motion, Zustand.
  - Backend: Node.js + Express + TypeScript.
  - Database: PostgreSQL (Supabase-compatible).
- Existing workspace already contains:
  - Frontend routes under app/.
  - Backend under api/src/.
  - DB SQL under scripts/schema.sql and scripts/seed.sql.
- Do not produce mock-only demos for primary flows. Real API integration must be the default.
- Keep UI premium, cinematic, and smooth, but performance-safe.

## 2) Product Roles and Flows

Implement complete flows for:

1. Citizen
- Register/login (phone-first auth, one phone per NID uniqueness).
- Upload identity documents.
- View own documents and statuses.
- View audit trail of access.
- Manage consent and revoke access.
- Submit privacy rights requests (revoke/delete).

2. Verifier Organization
- Register/login by organization/business type.
- Scan/verify citizen identity.
- Request and view only policy-allowed fields.
- See verification history.

3. Admin/Policy Oversight (minimum API support)
- Suspicious activity visibility.
- Basic policy and audit observability endpoints.

## 3) System Design Requirements

Use this architecture:

- Next.js frontend (app/) calls Express API (api/src/) via /api/v1 routes.
- Express handles auth, validation, policy enforcement, audit logging.
- PostgreSQL stores users, citizen profiles, verifier organizations, policies, documents, audit trails, suspicious events, privacy requests.

Required backend modules:

- api/src/routes/auth.ts
- api/src/routes/documents.ts
- api/src/routes/privacy-requests.ts
- api/src/routes/verifications.ts
- api/src/routes/audit.ts
- api/src/middleware/auth.ts
- api/src/middleware/validate.ts
- api/src/middleware/rateLimiter.ts
- api/src/services/policyEngine.ts
- api/src/db/queries/*

Use Zod validation for all request payloads.

## 4) API Contract (Implement and Wire)

Implement these endpoints (or refactor to this final contract):

Auth:
- POST /api/v1/auth/citizen/register
- POST /api/v1/auth/citizen/login
- POST /api/v1/auth/verifier/register
- POST /api/v1/auth/verifier/login
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout

Citizen:
- GET /api/v1/citizens/me
- GET /api/v1/citizens/me/audit-trail

Documents:
- POST /api/v1/documents/upload
- GET /api/v1/documents/my
- GET /api/v1/documents/:id
- PATCH /api/v1/documents/:id/status (verifier/admin guarded)

Verifications:
- POST /api/v1/verifications/execute
- GET /api/v1/verifications/history

Consent:
- GET /api/v1/consents/my
- PATCH /api/v1/consents/:id/toggle
- POST /api/v1/consents/revoke-all

Privacy rights:
- POST /api/v1/privacy-requests/revoke
- POST /api/v1/privacy-requests/delete
- GET /api/v1/privacy-requests/my

Observability:
- GET /api/v1/health
- GET /api/v1/admin/suspicious-activity (admin role)

## 5) Security and Reliability Constraints

Implement all:

- bcrypt password hashing (cost >= 10).
- JWT access and refresh tokens with separate secrets.
- HTTP-only secure refresh cookie (prod) + CSRF-safe flow.
- Strict role-based middleware (citizen/verifier/admin).
- Rate limiting on auth and verification routes.
- CORS allowlist for frontend origins.
- Sanitized error responses (no stack leaks in prod).
- Mandatory audit row creation for every verification decision and sensitive access.
- Suspicious activity logging for failed login bursts and abusive request patterns.

## 6) Database and Query Layer

Use PostgreSQL with typed query helpers.

Must include or verify tables:
- users
- citizen_profiles
- verifier_organizations
- documents
- permission_policies
- audit_trail
- suspicious_activity
- privacy_requests
- verification_logs

Add indexes for:
- users(phone_number) unique
- citizen_profiles(national_id) unique
- documents(citizen_id, created_at)
- audit_trail(citizen_id, created_at)
- suspicious_activity(created_at)

## 7) Frontend Experience Requirements (Cinematic + Efficient)

Build a premium visual language with strong depth and smooth motion.

Design direction:
- Rich layered backgrounds (gradient + subtle texture/grid).
- Distinct typography hierarchy (no default plain look).
- Strong card elevation system and polished spacing rhythm.
- Branded color tokens; avoid generic purple defaults.

Animation requirements:
- Framer Motion page transitions with meaningful direction.
- Staggered reveals for lists/cards/forms.
- Micro-interactions on hover/tap/focus.
- Scroll-based cinematic sections (subtle parallax only).
- Loading skeletons and smooth state transitions.
- Respect prefers-reduced-motion.

Performance constraints:
- Animate transform/opacity only.
- Avoid expensive layout thrashing.
- Lazy-load heavy non-critical blocks.
- Keep interaction latency low.

Accessibility constraints:
- Visible focus states.
- 44px minimum touch targets.
- Labels for all form controls.
- Semantic headings and aria labels for icon-only actions.
- Color contrast AA minimum.

## 8) Frontend Integration Rules

- Replace any mock-only data in core citizen/verifier pages with API-driven state.
- Keep graceful empty states when API returns no records.
- Centralize API calls in lib/api.ts with typed interfaces in lib/types/api.ts.
- Use Zustand auth store for session state and token refresh handling.
- Handle expired token refresh transparently.
- Surface API errors with clear user-friendly feedback.

## 9) File-Level Deliverables

Deliver complete, compile-ready code changes for:

Frontend:
- app/(auth)/citizen/login/page.tsx
- app/(auth)/citizen/register/page.tsx
- app/(auth)/verifier/login/page.tsx
- app/(auth)/verifier/register/page.tsx
- app/citizen/layout.tsx
- app/citizen/dashboard/page.tsx
- app/citizen/upload-documents/page.tsx
- app/citizen/my-documents/page.tsx
- app/citizen/audit-trail/page.tsx
- app/citizen/consent/page.tsx
- app/citizen/privacy/page.tsx
- app/verifier/layout.tsx
- app/verifier/scan/page.tsx
- app/verifier/results/page.tsx
- app/verifier/history/page.tsx
- app/globals.css
- lib/api.ts
- lib/store/authStore.ts
- lib/types/api.ts

Backend:
- api/src/app.ts
- api/src/server.ts
- api/src/routes/*.ts
- api/src/middleware/*.ts
- api/src/services/*.ts
- api/src/db/pool.ts
- api/src/db/queries/*.ts
- api/src/types/index.ts

Database:
- scripts/schema.sql (idempotent-safe improvements)
- scripts/seed.sql (realistic dev seed, no fake critical business logic)

## 10) Quality Gates (Must Pass)

1. Build and type checks
- Next.js production build succeeds.
- API TypeScript compile succeeds.
- No runtime import/path errors.

2. Runtime checks
- API boots on configured PORT and connects to DB.
- Health endpoint returns 200.
- Auth/register/login/refresh flow works for both roles.

3. Functional checks
- Citizen document upload/list/audit/consent/privacy flows execute end-to-end.
- Verifier scan/verification/history works with policy-based field filtering.
- Audit entries are actually written on sensitive actions.

4. UX checks
- Smooth animation at 60fps target on modern devices.
- Mobile and desktop layouts both usable and visually polished.
- Reduced-motion mode behaves correctly.

## 11) Implementation Output Format

When you implement, provide:

1. Architecture summary (what you changed).
2. Exact file changes grouped by frontend/backend/database.
3. Environment variables required.
4. Commands to run:
- npm install
- npm run api:dev
- npm run dev
- npm run build
5. Verification checklist with expected outputs.
6. Any deferred items and why.

## 12) Important Behavioral Guardrails

- Do not strip existing business logic unless replacing with a superior integrated version.
- Do not break current routes.
- Do not leave TODO-only placeholders for core flows.
- Prefer small reusable components and service functions over monolithic files.
- Keep code clean, typed, and production-oriented.

Now implement the full solution end-to-end.

# Implementation Plan: Web App Skeleton (Modular House MVP)

**Branch**: `001-web-app-skeleton` | **Date**: 2025-11-18 | **Spec**: `specs/001-web-app-skeleton/spec.md`
**Input**: Feature specification from `/specs/001-web-app-skeleton/spec.md`

## Summary

Deliver a production-ready MVP skeleton for Modular House consisting of a React + TypeScript SPA (Vite) and an Express.js + TypeScript REST API backed by PostgreSQL. Focus areas: unified enquiry/quote form (P1), lightweight admin for content (P2), accessible browsing with gallery/lightbox (P3). Emails sent via SMTP (Nodemailer); content served via read-only APIs; admin protects CRUD with email/password auth. Monorepo with pnpm and shared config ensures consistency across apps.

## Technical Context

**Language/Version**: Node.js 24.11.1 LTS, TypeScript latest stable; React latest stable; Express 5.x stable; PostgreSQL 18.x.  
**Primary Dependencies**: Vite, React Router, React Hook Form + Zod, Axios, `@radix-ui/react-dialog` (lightbox/dialog), `express`, `cors`, `helmet`, `compression`, `express-rate-limit`, `zod`, `pino` + `pino-http`, `nodemailer`.  
**Storage**: PostgreSQL 18.x (DigitalOcean).
**Testing**: Vitest across repo; `@testing-library/react` for UI; API tests with Vitest + Supertest; contract checks against OpenAPI; optional Playwright smoke for P1 user flow.  
**Target Platform**: DO droplets (Ubuntu 24.04 LTS): static frontend + API (Nginx reverse proxy + PM2), dedicated PostgreSQL droplet; Dev on Windows/macOS/Linux with Docker for local DB.  
**Project Type**: Web application (monorepo with `/apps/web` and `/apps/api`, shared `/packages`).  
**Performance Goals**: API p95 <300ms; Frontend LCP <2.5s on 4G profile; initial HTML per page ≤100KB; gallery images lazy-load; ≤10 blocking resources.  
**Constraints**: 
- Security: TLS everywhere, secrets via env only, no secrets in logs.
- Privacy: Consent required for submissions; data retention 24 months enforced via purge job.
- Reliability: Health endpoint, structured JSON logs, baseline metrics; email retries (single retry on 5xx) and outcome logging.
- Accessibility: WCAG 2.1 AA, keyboard focus management, alt text enforcement.
- Rate limiting: 10 submissions/ip/hour for `/submissions/*`.
**Scale/Scope**: MVP traffic (low to moderate). Editor workflows for Pages/Gallery/FAQ; submission volume in hundreds to low-thousands; allows horizontal scale later.

## Constitution Check

1. Security & Privacy
   - Threat model: Public read APIs; authenticated admin CRUD; sensitive PII in submissions (names, email, phone, address, Eircode, consent). Attack vectors: spam/abuse, auth brute force, injection, email leakage.
   - Controls: Argon2id password hashing; session via short-lived JWT (Authorization header, no cookies) with refresh opt-out for MVP; input validation (Zod) at boundaries; strict CORS; rate limits on submission endpoints; secrets only via env; TLS termination at Nginx; audit logs for admin actions; data retention purge for submissions (24 months).
   - Data classification: Submissions = PII Sensitive; Content = Public; User = Confidential.

2. Reliability & Observability
   - Endpoints: `GET /health` (API); Nginx upstream health; DB readiness check on startup.
   - Logs: Pino JSON fields: `time, level, msg, req.id, req.method, req.url, res.statusCode, latency_ms, user.id?` (admin), `corr_id` propagated.
   - Metrics: request count, error rate, p95 latency (by route group), email send success/failure counts, rate-limit hits. Export via log sampling initially; Prometheus endpoint scheduled as follow-up.

3. Test Discipline
   - Strategy: Unit tests for services/validators; integration tests for `/submissions/enquiry` and content GETs; contract tests against OpenAPI; admin auth and CSV export integration tests.
   - Coverage Targets: ≥70% overall; 100% branch for auth, validation, and data retention logic.

4. Performance & Efficiency
   - Budgets: API p95 <300ms; HTML ≤100KB; lazy-load images; ≤10 blocking resources; emails <60s for 95%.
   - Measurement: Autocannon for API smoke; Lighthouse CI for frontend; log-derived latency metrics.

5. Accessibility & Inclusive UX
   - Plan: Semantic HTML; visible focus states across nav/form/lightbox; dialog/lightbox via Radix Dialog with proper `aria-*`, Escape/close button handling; enforce alt text on gallery items via admin validation; keyboard navigation verified.

Gate Evaluation: All gates documented with concrete approaches—PASS. Re-check after design artifacts are generated.

Post-design Re-check: PASS. Artifacts produced: `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`.

## Project Structure

### Documentation (this feature)

```text
specs/001-web-app-skeleton/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
modular-house/
  package.json
  pnpm-workspace.yaml
  .editorconfig
  .gitignore
  .env.example
  /apps
    /web        # Vite + React + TS (frontend)
    /api        # Express + TS (backend)
  /packages
    /ui         # shared dumb UI components
    /config     # shared tsconfig, eslint, prettier configs
  /infra
    docker-compose.yml   # local dev (api + db + mailhog)
    nginx/               # prod/staging reverse-proxy configs
    scripts/             # deploy, backup, migrate
```

**Structure Decision**: Monorepo using pnpm with two deployables (`apps/web`, `apps/api`) and two shared packages (`packages/ui`, `packages/config`), plus `infra` for local and prod ops. This supports shared typing/config and clear separation of concerns while keeping MVP complexity low.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | Current plan keeps minimal surfaces for MVP |

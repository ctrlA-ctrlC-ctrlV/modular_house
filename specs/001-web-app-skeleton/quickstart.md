# Quickstart – Modular House Monorepo (MVP)

This guide sets up local development for the web app skeleton.

## Prerequisites
- Node.js 24.11.1 LTS (use nvm or fnm)
- pnpm (v9+): `npm i -g pnpm`
- Docker Desktop (for Postgres + MailHog)

## Repository Layout
```
modular-house/
  package.json
  pnpm-workspace.yaml
  /apps
    /web    # Vite + React + TS
    /api    # Express + TS
  /packages
    /ui
    /config
  /infra
    docker-compose.yml
    nginx/
    scripts/
```

## Environment Setup

1) Verify File Structure
Check if these critical files exist:
```shell
ls apps/api/package.json
ls apps/api/.env.example  
ls apps/api/prisma/schema.prisma
ls apps/web/package.json
ls infra/docker-compose.yml
ls pnpm-workspace.yaml
```

2) Set up environmnet variables
Edit `apps/api/.env.example` with your local creds:
```
NODE_ENV=development
PORT=8080
CORS_ORIGIN=http://localhost:5173

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/modular_house

# Email Configuration
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_SECURE=false
MAIL_USER=
MAIL_PASS=
MAIL_FROM_NAME=Modular House
MAIL_FROM_EMAIL=info@modular.house
MAIL_INTERNAL_TO=sales@modular.house

# Security
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=24h
PASSWORD_SALT_ROUNDS=12

# Features
CUSTOMER_CONFIRM_ENABLED=true
```

3) Test dependencies
```shell
# Install all dependencies
pnpm -w i

# Check if builds work
pnpm -C apps/api build
pnpm -C apps/web build
```

4) Start infrastructure (Postgres + MailHog)
```shell
# Start Docker services
docker compose -f infra/docker-compose.yml up -d

# Verify services are running
docker compose -f infra/docker-compose.yml ps
```

5) Prepare database (Prisma)
```shell
# Check if Prisma is configured and run migrations
pnpm -C apps/api db:generate
pnpm -C apps/api db:migrate --name init
```

4) Run API and Web (two terminals)
```shell
# 1. Try to install dependencies
pnpm -w i

# 2. Check if API can start (will fail if missing config/deps)
pnpm -C apps\api dev

# 3. Check if web can start
pnpm -C apps\web dev
```

- Web: http://localhost:5173
- API: http://localhost:8080 (health at `/health`)
- MailHog UI: http://localhost:8025

## Testing
```powershell
pnpm -w test
pnpm -C apps\api test
pnpm -C apps\web test
```

## API Contract
OpenAPI spec: `specs/001-web-app-skeleton/contracts/openapi.yaml`

## Notes
- Rate limit: 10 submissions/hour/IP on `/submissions/*`.
- Email: one retry on transient SMTP; outcomes logged.
- Customer confirmation: Set `CUSTOMER_CONFIRM_ENABLED=true` to send automated confirmation emails to customers after enquiry submission. When disabled (`false`), only internal notification emails are sent to staff. Customer emails are sent to the email address provided in the enquiry form.
- Accessibility: verify keyboard traversal, focus states, and lightbox close via Escape & X button.

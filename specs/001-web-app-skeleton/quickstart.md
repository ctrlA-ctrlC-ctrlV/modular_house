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

1) Copy envs
```powershell
Copy-Item .env.example .env -ErrorAction SilentlyContinue
Copy-Item apps\api\.env.example apps\api\.env -ErrorAction SilentlyContinue
```
Edit `apps/api/.env` with your local creds:
```
NODE_ENV=development
PORT=8080
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/modular_house
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USER=
MAIL_PASS=
MAIL_FROM="Modular House <info@example.com>"
MAIL_TO_INTERNAL="sales@example.com"
```

2) Start infrastructure (Postgres + MailHog)
```powershell
pnpm -w i
docker compose -f infra\docker-compose.yml up -d
```

3) Prepare database (Prisma)
```powershell
pnpm -C apps\api prisma migrate dev --name init
```

4) Run API and Web (two terminals)
```powershell
pnpm -C apps\api dev
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
- Accessibility: verify keyboard traversal, focus states, and lightbox close via Escape & X button.

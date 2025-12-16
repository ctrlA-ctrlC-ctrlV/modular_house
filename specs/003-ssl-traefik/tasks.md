# Tasks: SSL with Traefik

**Input**: User request for SSL/Traefik.
**Prerequisites**: plan.md

## Phase 1: Configuration

 - [X] T001 Update `docker-compose.prod.yml` to include Traefik service
    - Add `traefik` service with v3.6 image.
    - Configure command args for Entrypoints (80, 443) and Docker provider.
    - Configure Let's Encrypt resolver (HTTP challenge).
    - Mount volume for `acme.json`.
    - Map ports 80 and 443.

 - [X] T002 Update `web` service in `docker-compose.prod.yml`
    - Remove `ports: "80:80"`.
    - Add labels for Traefik:
        - `traefik.enable=true`
        - `traefik.http.routers.web.rule=Host(\`${DOMAIN_NAME}\`)` (or similar)
        - `traefik.http.routers.web.entrypoints=websecure`
        - `traefik.http.routers.web.tls.certresolver=myresolver`

 - [X] T003 Update `api` service in `docker-compose.prod.yml`
    - Remove `ports: "3000:3000"`.
    - Add labels for Traefik:
        - `traefik.enable=true`
        - `traefik.http.routers.api.rule=Host(\`${DOMAIN_NAME}\`) && PathPrefix(\`/api\`)`
        - `traefik.http.routers.api.entrypoints=websecure`
        - `traefik.http.routers.api.tls.certresolver=myresolver`

 - [X] T004 Update `cd.yml` or deployment scripts
    - Ensure `ACME_EMAIL` and `DOMAIN_NAME` are available as env vars.
    - (Optional) Add `acme.json` permission fix if needed.

## Phase 2: Verification

 - [X] T005 Verify configuration
    - Run `docker compose -f docker-compose.prod.yml config` to validate syntax.

 - [X] T006 Support `www` subdomain
    - Update `web` service labels to include `Host(\`www.${DOMAIN_NAME}\`)`.
    - Update `api` service labels to include `Host(\`www.${DOMAIN_NAME}\`)`.

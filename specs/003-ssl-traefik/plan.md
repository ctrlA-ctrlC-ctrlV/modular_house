# Implementation Plan: SSL with Traefik

## Technical Stack

- **Reverse Proxy**: Traefik v3.6
- **Container Orchestration**: Docker Compose
- **SSL Provider**: Let's Encrypt (HTTP Challenge)

## Architecture

- **Traefik Service**:
    - Entrypoints: `web` (80), `websecure` (443).
    - Provider: Docker.
    - Certificate Resolver: `myresolver` (using ACME HTTP challenge).
    - Global Redirection: HTTP -> HTTPS.
- **Web Service**:
    - Remove direct port exposure.
    - Add Traefik labels to route `/` to this service.
- **API Service**:
    - Remove direct port exposure.
    - Add Traefik labels to route `/api` to this service.

## File Structure Changes

- `docker-compose.prod.yml`: Add `traefik` service, update `web` and `api`.
- `.gitignore`: Ensure `acme.json` is ignored (if local).

## Configuration Details

- **Traefik Command**:
    - `--api.insecure=false` (disable dashboard or secure it)
    - `--providers.docker=true`
    - `--providers.docker.exposedbydefault=false`
    - `--entrypoints.web.address=:80`
    - `--entrypoints.websecure.address=:443`
    - `--certificatesresolvers.myresolver.acme.httpchallenge=true`
    - `--certificatesresolvers.myresolver.acme.httpchallenge.entrypoint=web`
    - `--certificatesresolvers.myresolver.acme.email=${ACME_EMAIL}` (Need to ask user or use a placeholder)
    - `--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json`

## Verification Plan

1.  Deploy with `docker compose up -d`.
2.  Check Traefik logs for certificate generation.
3.  Verify HTTPS access.

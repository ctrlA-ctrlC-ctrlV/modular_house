# modular_house Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-18

## Active Technologies
- TypeScript 5.x (Vite 6, React 18); Node.js (API) + Frontend: React, React Router, Vite; Testing: Vitest + RTL; Styling via imported template CSS/SCSS (002-template-skeleton-integration)
- PostgreSQL via Prisma (API); not impacted by this feature (002-template-skeleton-integration)
- TypeScript 5.y, Node 20+ + `vite-plugin-sitemap` (New), `react-helmet-async` (Existing), `react-router-dom` (Existing). (005-seo-maximization)
- N/A (Static generation). (005-seo-maximization)

- Node.js 24.11.1 LTS, TypeScript latest stable; React latest stable; Express 4.x stable; PostgreSQL 18.x. + Vite, React Router, React Hook Form + Zod, Axios, `@radix-ui/react-dialog` (lightbox/dialog), `express`, `cors`, `helmet`, `compression`, `express-rate-limit`, `zod`, `pino` + `pino-http`, `nodemailer`, Prisma ORM. (001-web-app-skeleton)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

Node.js 24.11.1 LTS, TypeScript latest stable; React latest stable; Express 4.x stable; PostgreSQL 18.x.: Follow standard conventions

## Recent Changes
- 005-seo-maximization: Added TypeScript 5.y, Node 20+ + `vite-plugin-sitemap` (New), `react-helmet-async` (Existing), `react-router-dom` (Existing).
- 002-template-skeleton-integration: Added TypeScript 5.x (Vite 6, React 18); Node.js (API) + Frontend: React, React Router, Vite; Testing: Vitest + RTL; Styling via imported template CSS/SCSS

- 001-web-app-skeleton: Added Node.js 24.11.1 LTS, TypeScript latest stable; React latest stable; Express 4.x stable; PostgreSQL 18.x. + Vite, React Router, React Hook Form + Zod, Axios, `@radix-ui/react-dialog` (lightbox/dialog), `express`, `cors`, `helmet`, `compression`, `express-rate-limit`, `zod`, `pino` + `pino-http`, `nodemailer`, Prisma ORM.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

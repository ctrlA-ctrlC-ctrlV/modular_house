# The Change Log of Branch 013-panel-phase-2
Note: keep the most latest entry on top

> ## [YYYY-MM-DDTHH:mm:ss.sss+00:00] - [git commit hash] - [commit title] (one line summary, only include section true to the commit)
> ### Added 
> - 
> 
> ### Changed
> - 
> 
> ### Fixed
> - 
> 
> ### Removed
> - 
> 
> ### Security
> - 
> ---

## [2026-07-15T13:13:37.735+01:00] — feat(api): T003 add AnalyticsSourceGroup + analytics tables (schema.prisma)

### Added
- `apps/api/prisma/schema.prisma` — appended the `AnalyticsSourceGroup` enum
  (DIRECT/SEARCH/SOCIAL/REFERRAL/CAMPAIGN with lowercase `@map` values) and two new models,
  exactly per data-model.md §1–§3:
  - `AnalyticsEvent` (table `analytics_events`): `id BigInt @id autoincrement`, `occurredAt`
    (`@db.Timestamptz(6)`), `path VarChar(512)`, `visitorId`/`sessionId Uuid`, `sourceGroup`
    enum, `referrerHost VarChar(255)?`, `utmSource`/`utmMedium`/`utmCampaign VarChar(100)?`,
    `createdAt`; indexes `[occurredAt]`, `[visitorId, occurredAt]`, `[sessionId, occurredAt]`.
  - `AnalyticsVisitor` (table `analytics_visitors`): `visitorId Uuid @id`, `firstSeenAt`,
    `lastSeenAt` (both `@db.Timestamptz(6)`).
- No IP / User-Agent / full-referrer-URL / geo / device / user-FK columns (privacy floor
  plan §2.7 R2 / M7, asserted later by T-B8).

### Notes
- `prisma validate` passes; `prisma generate` regenerated the client with the new types and
  `pnpm --filter @modular-house/api typecheck` exits 0 (existing source still compiles).
- `git diff` is purely additive (56 insertions, 0 deletions) — no existing model touched.
- Schema decision: the enum has no `@@map` on its type, matching data-model.md §1 exactly
  (§5 rollback refers to it by its Prisma name `AnalyticsSourceGroup`). This intentionally
  diverges from the existing `GalleryCategory`/`PublishStatus` snake_case `@@map` convention,
  per the binding source (data-model.md); stored enum values are the lowercase `@map` labels.
- No migration applied here (T004 generates `add_analytics_events`); no source consumes the
  new models yet (ingest service arrives in T042).

---

## [2026-07-15T13:05:09.178+01:00] — build(api): T002 pin isbot (apps/api/package.json, pnpm-lock.yaml)

### Added
- `apps/api/package.json` — `isbot` pinned at exact `5.2.1` (no range operator), placed
  alphabetically after `helmet`. No peer dependencies; ESM/CJS dual entry.
- `pnpm-lock.yaml` — updated by `pnpm install` to resolve `isbot@5.2.1`. This file is also staged
  by T001 (2/4); run blocks strictly in order (see pending-commits.md WARNING).

### Notes
- Phase 0 setup task (no test). `isbot` resolves from `apps/api` via
  `require.resolve('isbot', { paths: ['apps/api'] })` and its ESM entry loads: the named export
  `isbot` is a `function` returning `true` for a Googlebot UA and `false` for a Chrome UA.
- **API note for T038/T042:** isbot v5 has **no default export** — import the named function:
  `import { isbot } from 'isbot'` (also exports `isBot`, `createIsbot`, `isbotMatches`, `list`).
- No source imports `isbot` yet (ingest service arrives in T042).

---

## [2026-07-15T12:50:56.350+01:00] — build(web): T001 pin @radix-ui/react-select + @radix-ui/react-tabs (apps/web/package.json, pnpm-lock.yaml)

### Added
- `apps/web/package.json` — `@radix-ui/react-select` pinned at exact `2.3.3` and
  `@radix-ui/react-tabs` pinned at exact `1.1.17` (no range operator), placed alphabetically among
  the existing `@radix-ui/*` dependencies. Both peer-support React 18 (`^18.0`), matching the
  project's React 18.3.1 baseline.
- `pnpm-lock.yaml` — updated by `pnpm install`; the two new packages and their transitive
  dependencies resolved cleanly (16 packages added, 1 removed).

### Notes
- Phase 0 setup task (no test). `pnpm install` exits clean; both packages resolve from `apps/web`
  via `require.resolve('@radix-ui/react-select'|'@radix-ui/react-tabs', { paths: ['apps/web'] })`.
- No source imports the new packages yet — the `select`/`tabs` ports arrive in T011/T013.
- No other dependency changes.

---

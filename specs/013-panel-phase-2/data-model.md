# Data Model: Admin Panel — Phase 2: Cookies & Performance Visualisation

**Branch**: `013-panel-phase-2` | **Date**: 2026-07-14 | **Plan**: [plan.md](plan.md)

Persistence is required for the measurement pipeline only. **No existing table is modified.**
Assertion IDs (K/M/S/V/Q/R) reference [plan.md §2](plan.md).

---

## 1. New enum

```prisma
enum AnalyticsSourceGroup {
  DIRECT   @map("direct")
  SEARCH   @map("search")
  SOCIAL   @map("social")
  REFERRAL @map("referral")
  CAMPAIGN @map("campaign")
}
```

Classification precedence and hostname lists live in `trafficSource.ts` (S1/S2); the enum is the
closed set of groups (Q6). Adding a future group = new enum value + list entry (additive migration).

## 2. New model: `AnalyticsEvent`

One row per stored page view (M-series assertions). Append-only; no updates, no deletes
(plan §2.7 R1).

```prisma
model AnalyticsEvent {
  id           BigInt               @id @default(autoincrement())
  /// Server-clock time the event was received (never client time).
  occurredAt   DateTime             @map("occurred_at") @db.Timestamptz(6)
  /// Public page path, starts with "/", max 512 chars (M2). Never an /admin path (M5).
  path         String               @db.VarChar(512)
  /// Anonymous visitor identifier from the mh_vid cookie, or a one-off UUID (M3).
  visitorId    String               @map("visitor_id") @db.Uuid
  /// Anonymous session identifier from the mh_sid cookie, or a one-off UUID (M3).
  sessionId    String               @map("session_id") @db.Uuid
  /// Source classification computed at ingest (S1-S3).
  sourceGroup  AnalyticsSourceGroup @map("source_group")
  /// Referrer HOSTNAME only - full URLs and query strings are never stored (S5).
  referrerHost String?              @map("referrer_host") @db.VarChar(255)
  /// Standard campaign tags, truncated to 100 chars (M2).
  utmSource    String?              @map("utm_source") @db.VarChar(100)
  utmMedium    String?              @map("utm_medium") @db.VarChar(100)
  utmCampaign  String?              @map("utm_campaign") @db.VarChar(100)
  createdAt    DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)

  @@index([occurredAt])
  @@index([visitorId, occurredAt])
  @@index([sessionId, occurredAt])
  @@map("analytics_events")
}
```

**Deliberately absent columns** (R2/M7 privacy floor, asserted by test T-B8): IP address,
User-Agent, full referrer URL, geo, device, and any user/customer foreign key. `visitorId` has
**no relation** to `User` — visitors are anonymous by construction.

**Index rationale**:

- `[occurredAt]` — every range query and the realtime window filter on time first.
- `[visitorId, occurredAt]` — unique-visitor counts and first-event-in-range lookup (V2/V3).
- `[sessionId, occurredAt]` — session counts, pages-per-session, first-event-of-session source
  attribution (V4/S4).
- Top-pages grouping rides the `[occurredAt]` scan at current volume (research R7: no premature
  indexes;
  `[occurredAt, path]` is the documented first extension if Q8 budgets tighten).

## 3. New model: `AnalyticsVisitor`

One row per visitor identifier; server-authoritative first-seen (research R2).

```prisma
model AnalyticsVisitor {
  /// Same value as the mh_vid cookie (or the one-off UUID for cookieless events).
  visitorId   String   @id @map("visitor_id") @db.Uuid
  /// Authoritative for new-vs-returning classification (V3); never updated after insert.
  firstSeenAt DateTime @map("first_seen_at") @db.Timestamptz(6)
  /// Updated on every ingest; supports future retention/cleanup decisions.
  lastSeenAt  DateTime @map("last_seen_at") @db.Timestamptz(6)

  @@map("analytics_visitors")
}
```

**Write pattern (per ingest)**: `upsert` — insert `{firstSeenAt: now, lastSeenAt: now}` on new id,
update `lastSeenAt` only on conflict. The upsert is the concurrency guard for the
two-simultaneous-first-events race (E-CONCURRENCY): exactly one row survives, both events store.

**Returning classification (V3)**: visitor is returning within a range iff
`date(firstSeenAt AT TIME ZONE 'Europe/London')` < `date(first event in range AT TIME ZONE
'Europe/London')`. Computed in SQL (research R6).

## 4. Non-persisted entities

| Entity | Where it lives | Why not a table |
|--------|----------------|-----------------|
| Cookie Register Entry | `apps/web/src/content/cookieRegister.ts` (typed readonly array: `name`, `purpose`, `category: "strictly-necessary" \| "performance"`, `duration`, `setBy`) | Register changes only when cookie-setting code changes; source control is the single source of truth, reviewed in the same diff (research R9, FR-025/FR-027) |
| Acknowledgment | `mh_cookie_ack` browser cookie only (K4) | Per-browser state; server never needs it |
| Session | Derived: `mh_sid` cookie lifetime = the 30-minute window (K3/V1); grouping via `sessionId` column | No session table needed; recomputable from events |
| Search/social hostname lists | Exported constants in `trafficSource.ts` (S2) | Extend-by-append code change; no runtime editing surface in scope |

## 5. Migration direction

- **Forward**: single additive migration `add_analytics_events` creating the enum + two tables +
  three indexes. No existing table, column, or row is touched. Seed data: none for production;
  the test seed gains analytics fixtures (CI seed updated per DoD-8).
- **Rollback**: drop `analytics_events`, `analytics_visitors`, enum `AnalyticsSourceGroup`.
  Nothing else to unwind; public site and admin panel degrade to "empty dashboard", not breakage.
- **Versioning**: additive schema change → MINOR bump per the constitution's semantic-versioning
  constraint.

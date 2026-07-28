#!/usr/bin/env tsx
/**
 * Performance benchmark for the analytics endpoints (plan §2.3 M9, §2.6 Q8,
 * DoD-7, constitution IV).
 *
 * Measures `POST /api/analytics/events` p95 latency (M9: budget < 50 ms for
 * a single insert + upsert) over a warm run against the app's real Express
 * handler, driven in-process via `supertest` (no network hop — the same
 * technique the integration suites already use). Run this AFTER
 * `seed-analytics-perf.ts` (T119) has populated the analytics tables with
 * its ~32-month synthetic dataset, so the measured latency reflects
 * production-scale index/table costs, not an empty-table best case.
 *
 * Rate-limit bypass: the ingest route enforces 120 events/minute/IP (M6).
 * A meaningful p95 sample needs far more requests than that budget allows
 * from a single IP within a minute, so every request here carries a
 * distinct synthetic `X-Forwarded-For` value — the rate limiter's
 * `keyGenerator` buckets by that header, so each request lands in its own,
 * never-throttled bucket. This is a deliberate, documented bypass of a
 * request-shaping concern orthogonal to what this benchmark measures
 * (handler latency), not a workaround for anything the M9 budget itself
 * needs to account for.
 *
 * `benchOverview()` (T121, Q8) additionally measures
 * `GET /api/admin/analytics/overview` p95 for a <= 92-day span (budget
 * < 300 ms) and a 490-day span (budget < 1000 ms, the documented
 * constitution-IV exception for long ranges) — both windows are anchored to
 * the real, live "today" (Europe/London), matching the Q1 route's own
 * "to <= today" validation, which always checks against the real wall clock
 * (this is a live script, not a test with an injected clock).
 *
 * Usage (point DATABASE_URL at the perf-seeded database — `config/env.ts`
 * loads plain `.env` by default, not `.env.test`; LOG_LEVEL=silent keeps
 * pino's per-request access log out of the way of this script's own output):
 *   DATABASE_URL=postgresql://... LOG_LEVEL=silent \
 *     pnpm --filter @modular-house/api exec tsx scripts/bench-analytics.ts
 */
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import app from '../src/app.js';
import { LoginCodeService } from '../src/services/loginCode.js';

/** Untimed requests run first so the measured phase excludes JIT/connection-pool warm-up cost. */
const WARMUP_REQUESTS = 20;
/** Sample size for the measured phase — large enough for a stable p95. */
const MEASURED_REQUESTS = 300;
/** Plan §2.3 M9: ingest handler p95 latency budget. */
const INGEST_P95_BUDGET_MS = 50;

/** Smaller sample sizes for the overview benchmark — each request is a heavier aggregation query. */
const OVERVIEW_WARMUP_REQUESTS = 5;
const OVERVIEW_MEASURED_REQUESTS = 20;
/** Plan §2.6 Q8: overview p95 budgets by span length. */
const OVERVIEW_SHORT_SPAN_P95_BUDGET_MS = 300;
const OVERVIEW_LONG_SPAN_P95_BUDGET_MS = 1000;
/** Q8's two benchmarked span lengths, in inclusive calendar days. */
const OVERVIEW_SHORT_SPAN_DAYS = 92;
const OVERVIEW_LONG_SPAN_DAYS = 490;

/** p50/p95/max latency summary, in milliseconds. */
interface Percentiles {
  p50: number;
  p95: number;
  max: number;
}

/**
 * Computes the p50/p95/max of a latency sample. The percentile index uses
 * the common "nearest-rank" method (`ceil(p/100 * n) - 1`), clamped to the
 * sample's bounds — adequate precision for a benchmark script, not a
 * statistics library.
 */
function computePercentiles(latenciesMs: number[]): Percentiles {
  const sorted = [...latenciesMs].sort((a, b) => a - b);
  const percentileAt = (p: number): number => {
    const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
    return sorted[Math.max(0, index)] ?? 0;
  };
  return {
    p50: percentileAt(50),
    p95: percentileAt(95),
    max: sorted[sorted.length - 1] ?? 0,
  };
}

/**
 * Sends one ingest request with a unique synthetic source IP (see the file
 * header's rate-limit-bypass note) and returns its wall-clock latency in
 * milliseconds. No `mh_vid`/`mh_sid` cookies are sent, matching the
 * cookieless-visitor path (M3) — the handler still performs exactly one
 * `AnalyticsVisitor` upsert + one `AnalyticsEvent` insert (M9's "single
 * insert + upsert"), identical cost to the cookied path.
 */
async function sendIngestEvent(index: number): Promise<number> {
  const syntheticIp = `10.${(index >> 16) & 255}.${(index >> 8) & 255}.${index & 255}`;
  const start = performance.now();
  await request(app)
    .post('/api/analytics/events')
    .set('X-Forwarded-For', syntheticIp)
    .send({ path: '/bench-analytics' });
  return performance.now() - start;
}

/** Runs the untimed warm-up phase, then the measured phase, returning ingest latency percentiles. */
async function benchIngest(): Promise<Percentiles> {
  console.log(`Warming up ingest (${WARMUP_REQUESTS} requests, untimed)...`);
  for (let i = 0; i < WARMUP_REQUESTS; i++) {
    await sendIngestEvent(i);
  }

  console.log(`Measuring ingest (${MEASURED_REQUESTS} requests)...`);
  const latencies: number[] = [];
  for (let i = 0; i < MEASURED_REQUESTS; i++) {
    latencies.push(await sendIngestEvent(WARMUP_REQUESTS + i));
  }

  return computePercentiles(latencies);
}

// ---------------------------------------------------------------------------
// Overview benchmark (T121, Q8)
// ---------------------------------------------------------------------------

/**
 * Resolve the current Europe/London calendar day as a `YYYY-MM-DD` string —
 * the same technique `RangeDialog.tsx`'s `londonToday` uses client-side and
 * the admin route uses server-side (`londonCalendarDay`), so this script's
 * "today" always agrees with what the route itself will accept as the Q1
 * upper boundary.
 */
function londonToday(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
}

/** Subtracts `days` UTC-midnight days from a `YYYY-MM-DD` string, returning the same form. */
function subtractDays(dateStr: string, days: number): string {
  const ms = new Date(`${dateStr}T00:00:00.000Z`).getTime() - days * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Creates a fresh `admin`-role test user and completes the login-code /
 * verify-2fa flow to obtain a bearer access token — mirrors
 * `analytics-overview.test.ts`'s `createAuthenticatedSession()` helper
 * exactly (the admin analytics endpoints sit behind the Phase 1 email-OTP
 * flow, not a password grant, so minting a code directly via
 * `LoginCodeService` is the practical way to authenticate a script without
 * depending on real email delivery). The created user row is not cleaned up
 * — the same accepted convention the mirrored test helper follows (no table
 * truncation between runs); restoring `db:seed`'s fixtures afterward does
 * not touch this row either, so it is a harmless, permanent artifact of
 * running this benchmark, exactly as it is for the test suite.
 */
async function authenticateAdmin(prisma: PrismaClient): Promise<string> {
  const role = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (!role) {
    throw new Error('admin role not found — run `pnpm db:seed` before benchmarking overview');
  }

  const email = `bench-analytics-${randomUUID()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: 'unused-password-auth-bypassed-via-otp',
      roleId: role.id,
      isActive: true,
      failedLoginAttempts: 0,
    },
  });

  const loginCodeService = new LoginCodeService(prisma);
  const { challengeId, code } = await loginCodeService.issue(user.id);

  const res = await request(app).post('/admin/auth/verify-2fa').send({ challengeId, code });
  if (res.status !== 200) {
    throw new Error(`verify-2fa failed: ${res.status}`);
  }
  return res.body.accessToken as string;
}

/**
 * Sends one authenticated overview request for `[from, to]` (both
 * `YYYY-MM-DD`, Q1 calendar-day form) and returns its latency in
 * milliseconds.
 */
async function sendOverviewRequest(accessToken: string, from: string, to: string): Promise<number> {
  const start = performance.now();
  await request(app)
    .get('/api/admin/analytics/overview')
    .query({ from, to })
    .set('Authorization', `Bearer ${accessToken}`);
  return performance.now() - start;
}

/** Runs the untimed warm-up phase, then the measured phase, for one `[from, to]` span. */
async function benchOverviewSpan(
  accessToken: string,
  label: string,
  from: string,
  to: string,
): Promise<Percentiles> {
  console.log(`Warming up overview ${label} (${OVERVIEW_WARMUP_REQUESTS} requests, untimed)...`);
  for (let i = 0; i < OVERVIEW_WARMUP_REQUESTS; i++) {
    await sendOverviewRequest(accessToken, from, to);
  }

  console.log(`Measuring overview ${label} (${OVERVIEW_MEASURED_REQUESTS} requests)...`);
  const latencies: number[] = [];
  for (let i = 0; i < OVERVIEW_MEASURED_REQUESTS; i++) {
    latencies.push(await sendOverviewRequest(accessToken, from, to));
  }

  return computePercentiles(latencies);
}

/** Benchmarks both Q8 spans (<= 92 days, 490 days), both ending "today" (Europe/London). */
async function benchOverview(): Promise<{ shortSpan: Percentiles; longSpan: Percentiles }> {
  const prisma = new PrismaClient();
  const accessToken = await authenticateAdmin(prisma);
  await prisma.$disconnect();

  const today = londonToday(new Date());
  const shortFrom = subtractDays(today, OVERVIEW_SHORT_SPAN_DAYS - 1);
  const longFrom = subtractDays(today, OVERVIEW_LONG_SPAN_DAYS - 1);

  const shortSpan = await benchOverviewSpan(accessToken, `${OVERVIEW_SHORT_SPAN_DAYS}-day`, shortFrom, today);
  const longSpan = await benchOverviewSpan(accessToken, `${OVERVIEW_LONG_SPAN_DAYS}-day`, longFrom, today);

  return { shortSpan, longSpan };
}

async function main(): Promise<void> {
  const ingest = await benchIngest();
  console.log(
    `Ingest: p50=${ingest.p50.toFixed(2)}ms p95=${ingest.p95.toFixed(2)}ms max=${ingest.max.toFixed(2)}ms`,
  );
  const ingestPass = ingest.p95 < INGEST_P95_BUDGET_MS;
  console.log(`Ingest p95 budget (M9, < ${INGEST_P95_BUDGET_MS}ms): ${ingestPass ? 'PASS' : 'FAIL'}`);

  const { shortSpan, longSpan } = await benchOverview();
  console.log(
    `Overview ${OVERVIEW_SHORT_SPAN_DAYS}-day: p50=${shortSpan.p50.toFixed(2)}ms ` +
      `p95=${shortSpan.p95.toFixed(2)}ms max=${shortSpan.max.toFixed(2)}ms`,
  );
  const shortSpanPass = shortSpan.p95 < OVERVIEW_SHORT_SPAN_P95_BUDGET_MS;
  console.log(
    `Overview ${OVERVIEW_SHORT_SPAN_DAYS}-day p95 budget (Q8, < ${OVERVIEW_SHORT_SPAN_P95_BUDGET_MS}ms): ` +
      `${shortSpanPass ? 'PASS' : 'FAIL'}`,
  );

  console.log(
    `Overview ${OVERVIEW_LONG_SPAN_DAYS}-day: p50=${longSpan.p50.toFixed(2)}ms ` +
      `p95=${longSpan.p95.toFixed(2)}ms max=${longSpan.max.toFixed(2)}ms`,
  );
  const longSpanPass = longSpan.p95 < OVERVIEW_LONG_SPAN_P95_BUDGET_MS;
  console.log(
    `Overview ${OVERVIEW_LONG_SPAN_DAYS}-day p95 budget (Q8, < ${OVERVIEW_LONG_SPAN_P95_BUDGET_MS}ms): ` +
      `${longSpanPass ? 'PASS' : 'FAIL'}`,
  );

  if (!ingestPass || !shortSpanPass || !longSpanPass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('bench-analytics failed:', error);
  process.exitCode = 1;
});

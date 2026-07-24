/**
 * Analytics ingest service (Phase 2, plan §2.3 M-series, research R2/R3).
 *
 * Validates a public page-view beacon payload, drops known bot traffic (M4,
 * T095), reads the anonymous visitor/session identifiers from the `mh_vid` /
 * `mh_sid` request cookies (generating one-off UUIDs when absent — M3),
 * classifies the traffic source via `trafficSource.classify`, reduces the
 * referrer to its bare hostname (S5), and persists exactly one
 * `AnalyticsEvent` row plus an `AnalyticsVisitor` upsert — storing NO
 * personal data (M7/R2: no IP, no User-Agent, no full referrer URL).
 *
 * Pass 2 shipped the happy path only. Pass 3 (plan §5.3) hardens it against
 * the E-INGEST boundary cases in task order: bot exclusion (M4, T095) landed
 * first; `/admin` path exclusion (M5) and path canonicalization (M10, T096,
 * this change) land next; rate limiting (M6) follows in T097. The 4 KB body
 * cap is enforced at the route layer (`routes/analytics.ts`, T093), not here.
 *
 * Exports:
 *   - `ingestEventSchema` — the Zod schema for the beacon payload (M2 shape,
 *     unknown keys rejected via `.strict()`).
 *   - `IngestEventInput` — the validated payload type.
 *   - `IngestCookies` — the subset of request cookies the ingest reads.
 *   - `IngestResult` — the outcome the route translates into an HTTP status.
 *   - `ingestAnalyticsEvent` — the entry-point function.
 *
 * Clock: the service accepts an optional `clock: () => Date` parameter
 * (default `() => new Date()`) so unit tests can inject a deterministic time
 * for `occurredAt` / `firstSeenAt` / `lastSeenAt` (constitution III). The
 * integration suite (T039/T040/T041) instead fakes `Date` globally via
 * `vi.useFakeTimers({ toFake: ['Date'] })`, so the default clock reads the
 * faked system time — both paths yield deterministic timestamps.
 */
import { PrismaClient, type AnalyticsSourceGroup } from '@prisma/client';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { isbot } from 'isbot';
import { classify, extractReferrerHost } from './trafficSource.js';
import { logger } from '../middleware/logger.js';

// ---------------------------------------------------------------------------
// Module-level Prisma client (mirrors services/submissions.ts)
// ---------------------------------------------------------------------------
// A single shared client is the repository convention; the test DB is
// selected by DATABASE_URL in the test environment, so the same module works
// against both the dev and port-5434 test databases.
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Payload schema — M2 shape, unknown keys rejected (T092 hardening pass)
// ---------------------------------------------------------------------------

/**
 * Zod schema for the public ingest payload (plan §2.3 M2, research R3).
 *
 * Fields:
 *   - `path`        — required, the public page pathname; must start with
 *                     `/`, length 1–512 (M2). Canonicalization (M10) is a
 *                     Pass 3 concern applied at the service layer, not here.
 *   - `referrer`    — optional, `document.referrer` (full URL); only its
 *                     hostname is ever stored (S5). Max 2048 chars (M2).
 *   - `utmSource` / `utmMedium` / `utmCampaign` — optional campaign tags,
 *                     max 100 chars each (M2). Over-length payloads are
 *                     rejected, never truncated.
 *   - `adClick`     — optional boolean set by the beacon when the landing URL
 *                     carried a known ad click-ID parameter; forces CAMPAIGN
 *                     (S1). The click-ID value itself never appears in the
 *                     payload (FR-015).
 *
 * `.strict()` rejects unknown keys so a forged or malformed payload cannot
 * smuggle extra fields through validation (M2: "Unknown fields rejected").
 *
 * Every bound above rejects out-of-range input outright — `.max()` fails
 * validation rather than truncating, so an over-length field can never be
 * silently shortened and stored (M2). `tests/unit/analyticsIngestValidation
 * .test.ts` (T091) exercises both sides of every bound at its exact pinned
 * threshold; this schema required no changes to satisfy any of them (T092).
 * The 4 KB total request-body cap is enforced separately at the route layer
 * (`routes/analytics.ts`, T093) — it is a transport-size concern, not a
 * per-field shape concern, and stays outside this schema.
 */
export const ingestEventSchema = z
  .object({
    path: z
      .string()
      .min(1, 'path is required')
      .max(512, 'path must be at most 512 characters')
      .regex(/^\//, 'path must start with /'),
    referrer: z.string().max(2048, 'referrer must be at most 2048 characters').optional(),
    utmSource: z.string().max(100, 'utmSource must be at most 100 characters').optional(),
    utmMedium: z.string().max(100, 'utmMedium must be at most 100 characters').optional(),
    utmCampaign: z.string().max(100, 'utmCampaign must be at most 100 characters').optional(),
    adClick: z.boolean().optional(),
  })
  .strict();

/** The validated payload type the route hands to the service. */
export type IngestEventInput = z.infer<typeof ingestEventSchema>;

// ---------------------------------------------------------------------------
// Path canonicalization (M10)
// ---------------------------------------------------------------------------

/**
 * Reduce a raw `path` value to its canonical storage form (plan §2.3 M10).
 *
 * Applies, in order: strip any query string / fragment (pathname only),
 * lowercase (case-insensitive page identity), collapse duplicate slashes,
 * then strip a single trailing slash — except the root `/`, which is kept
 * as-is. The result is what every metric groups by, so `/Page/` and `/page`
 * are guaranteed to count as the same page.
 *
 * Schema validation (M2) only guarantees the raw value starts with `/` and
 * is 1–512 characters; it does not guarantee the value is already
 * canonical, so this normalization always runs regardless of what the
 * client sent.
 */
function canonicalizePath(path: string): string {
  const withoutQueryOrFragment = path.split(/[?#]/)[0];
  const lowercased = withoutQueryOrFragment.toLowerCase();
  const collapsedSlashes = lowercased.replace(/\/{2,}/g, '/');

  if (collapsedSlashes.length > 1 && collapsedSlashes.endsWith('/')) {
    return collapsedSlashes.slice(0, -1);
  }

  return collapsedSlashes;
}

/**
 * The subset of request cookies the ingest reads (plan §2.1 K1/K2/K3, M3).
 * Both are optional — when a cookie is absent the server generates a one-off
 * UUID for that event so cookieless visitors still count as new (M3).
 */
export interface IngestCookies {
  mh_vid?: string;
  mh_sid?: string;
}

/**
 * The outcome of an ingest. `dropped` covers every Pass 3 exclusion reason
 * (bot traffic — M4, T095; `/admin` paths — M5, T096) the route still maps
 * to 204 so callers cannot distinguish a drop from a store (M1).
 */
export type IngestResult =
  | { status: 'stored' }
  | { status: 'dropped'; reason: 'bot' | 'admin-path' };

// ---------------------------------------------------------------------------
// ingestAnalyticsEvent — validate, exclude, then store
// ---------------------------------------------------------------------------

/**
 * Validate-then-store one page-view event, dropping known bot traffic and
 * `/admin` paths before any persistence, and canonicalizing the stored path.
 *
 * Steps (research R2/R3/R4, data-model.md §3):
 *   1. Evaluate `isbot(userAgent)` (M4); a match short-circuits before any
 *      identity resolution or persistence — nothing is written, and the UA
 *      string itself is never persisted or logged (M7).
 *   2. Canonicalize `payload.path` (M10: pathname-only, lowercased,
 *      duplicate slashes collapsed, trailing slash stripped except root).
 *   3. Drop the event if the canonical path is exactly `/admin` or starts
 *      with `/admin/` (M5) — defense in depth; the client never sends these
 *      paths itself. Other `/admin`-prefixed public words (e.g.
 *      `/administration`) do not match and are stored normally.
 *   4. Resolve `visitorId` / `sessionId` from the `mh_vid` / `mh_sid` cookies,
 *      generating one-off UUIDs for any that are absent (M3).
 *   5. Classify the traffic source via `trafficSource.classify` with S1
 *      precedence (CAMPAIGN > SEARCH > SOCIAL > REFERRAL > DIRECT).
 *   6. Reduce the referrer to its bare hostname via
 *      `trafficSource.extractReferrerHost` (S5: never a scheme, path, query,
 *      or fragment).
 *   7. Upsert `AnalyticsVisitor`: insert `{firstSeenAt: now, lastSeenAt: now}`
 *      on a new id, update only `lastSeenAt` on conflict (data-model §3 write
 *      pattern; the upsert is the E-CONCURRENCY race guard).
 *   8. Insert one `AnalyticsEvent` row with the server-clock `occurredAt`,
 *      the canonical `path`, the classified `sourceGroup`, the hostname-only
 *      `referrerHost`, and the campaign tags.
 *   9. Emit a Pino counter for the outcome — no PII in logs (M7: no IP, no
 *      UA, no full referrer URL; only the non-personal `sourceGroup`/`path`,
 *      or the drop reason, are logged).
 *
 * @param payload    - the Zod-validated beacon body.
 * @param cookies    - the `mh_vid` / `mh_sid` request cookies (optional).
 * @param userAgent  - the request's `User-Agent` header, consulted
 *                      transiently for the M4 bot check only (never
 *                      persisted or logged — M7).
 * @param clock      - injectable clock for deterministic `occurredAt`
 *                      (default `() => new Date()`).
 * @returns `{ status: 'stored' }` or `{ status: 'dropped', reason }`;
 *          throws on Prisma errors so the route's error middleware can map
 *          them to a 5xx (never a 4xx the beacon would surface).
 */
export async function ingestAnalyticsEvent(
  payload: IngestEventInput,
  cookies: IngestCookies,
  userAgent?: string,
  clock: () => Date = () => new Date(),
): Promise<IngestResult> {
  // M4: bot traffic is dropped before any identity resolution or storage.
  // `userAgent` is read only for this in-memory check — it is never assigned
  // to a variable that outlives this branch, never persisted to either
  // analytics table, and never included in the log line below (M7: no
  // User-Agent string at rest, not even in logs).
  if (isbot(userAgent)) {
    logger.info({ analyticsIngest: 'dropped', reason: 'bot' }, 'analytics event dropped');
    return { status: 'dropped', reason: 'bot' };
  }

  // M10: canonicalize the path before any further checks or storage, so the
  // M5 admin-path comparison below and the eventually-stored value both use
  // the same normalized form (`/Page/` and `/page` are the same page).
  const path = canonicalizePath(payload.path);

  // M5: exact `/admin` or any `/admin/*` path is dropped — admin routes are
  // never public pages. Other `/admin`-prefixed words (e.g. `/administration`)
  // do not satisfy the equality or `/`-suffixed prefix check and are stored.
  if (path === '/admin' || path.startsWith('/admin/')) {
    logger.info({ analyticsIngest: 'dropped', reason: 'admin-path' }, 'analytics event dropped');
    return { status: 'dropped', reason: 'admin-path' };
  }

  const now = clock();

  // M3: read identity from cookies; generate one-off UUIDs when absent so a
  // cookieless visitor still counts as new. The generated id is used only for
  // this event — the client is responsible for setting the cookies going
  // forward (research R2: cookies are client-set under SSG).
  const visitorId = cookies.mh_vid || randomUUID();
  const sessionId = cookies.mh_sid || randomUUID();

  // S1–S3: classify the traffic source from the referrer + campaign signals.
  const sourceGroup: AnalyticsSourceGroup = classify(
    payload.referrer,
    payload.utmSource,
    payload.adClick,
  );

  // S5: store the referrer hostname only — never the full URL, never query
  // strings. `extractReferrerHost` returns null for empty / unparsable
  // referrers (S3 DIRECT inputs).
  const referrerHost = extractReferrerHost(payload.referrer);

  // AnalyticsVisitor upsert (data-model §3). `firstSeenAt` is authoritative
  // and never overwritten after insert; `lastSeenAt` advances on every
  // ingest. The upsert is the concurrency guard for two simultaneous first
  // events for the same id (E-CONCURRENCY): exactly one row survives.
  await prisma.analyticsVisitor.upsert({
    where: { visitorId },
    update: { lastSeenAt: now },
    create: {
      visitorId,
      firstSeenAt: now,
      lastSeenAt: now,
    },
  });

  // AnalyticsEvent insert — append-only (R1: no update, no delete path
  // exists). `occurredAt` is the server clock (M2: never client time); `path`
  // is the M10-canonicalized value computed above, not the raw payload.
  await prisma.analyticsEvent.create({
    data: {
      occurredAt: now,
      path,
      visitorId,
      sessionId,
      sourceGroup,
      referrerHost,
      utmSource: payload.utmSource,
      utmMedium: payload.utmMedium,
      utmCampaign: payload.utmCampaign,
    },
  });

  // Pino counter for the stored event. Only non-personal fields are logged
  // (M7/R2): `sourceGroup` and `path` (a public URL path, not PII). IP,
  // User-Agent, and the full referrer URL never appear in log output.
  logger.info(
    {
      analyticsIngest: 'stored',
      sourceGroup,
      path,
    },
    'analytics event stored',
  );

  return { status: 'stored' };
}

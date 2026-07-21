/**
 * Analytics ingest service (Phase 2, plan §2.3 M-series, research R2/R3).
 *
 * Validates a public page-view beacon payload, reads the anonymous
 * visitor/session identifiers from the `mh_vid` / `mh_sid` request cookies
 * (generating one-off UUIDs when absent — M3), classifies the traffic source
 * via `trafficSource.classify`, reduces the referrer to its bare hostname
 * (S5), and persists exactly one `AnalyticsEvent` row plus an
 * `AnalyticsVisitor` upsert — storing NO personal data (M7/R2: no IP, no
 * User-Agent, no full referrer URL).
 *
 * This is the **happy-path** implementation (Pass 2). The boundary-hardening
 * concerns — bot User-Agent exclusion (M4), `/admin` path exclusion (M5),
 * rate limiting (M6), path canonicalization (M10), and the 4 KB body cap —
 * are Pass 3 work (plan §5.3) and are deliberately absent here so the happy
 * path is minimal and the boundary tests (E-INGEST) can drive their addition
 * red-first.
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
// Payload schema — M2 happy-path shape, unknown keys rejected
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
 * The outcome of an ingest. The happy path always stores; Pass 3 will extend
 * this union with `dropped` variants (bot / admin path) that the route still
 * maps to 204 so callers cannot distinguish drop from store (M1/M4/M5).
 */
export type IngestResult = { status: 'stored' };

// ---------------------------------------------------------------------------
// ingestAnalyticsEvent — the happy-path entry point
// ---------------------------------------------------------------------------

/**
 * Validate-then-store one page-view event (happy path, Pass 2).
 *
 * Steps (research R2/R3, data-model.md §3):
 *   1. Resolve `visitorId` / `sessionId` from the `mh_vid` / `mh_sid` cookies,
 *      generating one-off UUIDs for any that are absent (M3).
 *   2. Classify the traffic source via `trafficSource.classify` with S1
 *      precedence (CAMPAIGN > SEARCH > SOCIAL > REFERRAL > DIRECT).
 *   3. Reduce the referrer to its bare hostname via
 *      `trafficSource.extractReferrerHost` (S5: never a scheme, path, query,
 *      or fragment).
 *   4. Upsert `AnalyticsVisitor`: insert `{firstSeenAt: now, lastSeenAt: now}`
 *      on a new id, update only `lastSeenAt` on conflict (data-model §3 write
 *      pattern; the upsert is the E-CONCURRENCY race guard).
 *   5. Insert one `AnalyticsEvent` row with the server-clock `occurredAt`,
 *      the classified `sourceGroup`, the hostname-only `referrerHost`, and the
 *      campaign tags.
 *   6. Emit a Pino counter for the stored event — no PII in logs (M7: no IP,
 *      no UA, no full referrer URL; only the non-personal `sourceGroup` and
 *      `path` are logged).
 *
 * @param payload  - the Zod-validated beacon body.
 * @param cookies  - the `mh_vid` / `mh_sid` request cookies (optional).
 * @param clock    - injectable clock for deterministic `occurredAt` (default
 *                   `() => new Date()`).
 * @returns `{ status: 'stored' }` on success; throws on Prisma errors so the
 *          route's error middleware can map them to a 5xx (never a 4xx the
 *          beacon would surface).
 */
export async function ingestAnalyticsEvent(
  payload: IngestEventInput,
  cookies: IngestCookies,
  clock: () => Date = () => new Date(),
): Promise<IngestResult> {
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
  // exists). `occurredAt` is the server clock (M2: never client time).
  await prisma.analyticsEvent.create({
    data: {
      occurredAt: now,
      path: payload.path,
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
      path: payload.path,
    },
    'analytics event stored',
  );

  return { status: 'stored' };
}

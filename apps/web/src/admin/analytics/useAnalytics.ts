/**
 * Analytics data hooks (Pass 2 data wiring, plan §2.5 V6, research R7, FR-017/FR-020).
 *
 * Two hooks, both typed to the `contracts/analytics.openapi.yaml` response
 * shapes and both fronted by the shared admin `apiClient` (Bearer token +
 * silent refresh, T-B7 auth gate):
 *
 * - `useOverview(range)` — fetches `GET /api/admin/analytics/overview` keyed
 *   on the validated `{from, to}` range; refetches whenever those values
 *   change (US3-3, T-F8).
 * - `useRealtime()` — fetches `GET /api/admin/analytics/realtime` once on
 *   mount, then polls every 30 s (V6, satisfying SC-006's 60 s ceiling) via
 *   `setInterval`, not a websocket (plan §5.2 guardrail: "no realtime
 *   websockets (polling only)").
 *
 * Both hooks surface `loading`/`error`/`data` to their consumer and never
 * throw: a rejected fetch or a non-2xx response is caught and converted into
 * the `error` field, matching the Analytics page's lack of an error boundary
 * (T075).
 */
import { useEffect, useState } from 'react';

import { apiClient } from '../auth/apiClient.js';
import type { OverviewResponse, RealtimeResponse } from './fixtures.js';
import type { RangeParams } from './rangePresets.js';

/** Polling interval for the realtime snapshot (V6: "every 30 s"). */
const REALTIME_POLL_INTERVAL_MS = 30_000;

/** Base path for the admin analytics endpoints (mounted at `/api/admin/analytics` in `app.ts`). */
const ADMIN_ANALYTICS_BASE = '/api/admin/analytics';

/** Shape returned by both data hooks — one in-flight/settled fetch's state. */
export interface AnalyticsFetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Convert a non-ok `Response` (or a caught exception) into a plain `Error`.
 * Centralizes the "never throw to the caller" contract shared by both hooks.
 */
async function toRequestError(response: Response): Promise<Error> {
  return new Error(
    `Analytics request to ${response.url || '(unknown url)'} failed with status ${response.status}`,
  );
}

/**
 * Fetch the range-scoped overview payload (KPIs, deltas, timeseries, top
 * pages, sources) for `range`, refetching whenever `range.from`/`range.to`
 * change (Q1/Q2, T-F8).
 */
export function useOverview(range: RangeParams): AnalyticsFetchState<OverviewResponse> {
  const [state, setState] = useState<AnalyticsFetchState<OverviewResponse>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true, error: null }));

    async function fetchOverview(): Promise<void> {
      try {
        const params = new URLSearchParams({ from: range.from, to: range.to });
        const response = await apiClient.fetch(`${ADMIN_ANALYTICS_BASE}/overview?${params.toString()}`);

        if (!response.ok) {
          throw await toRequestError(response);
        }

        const data = (await response.json()) as OverviewResponse;
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (caught) {
        if (!cancelled) {
          const error = caught instanceof Error ? caught : new Error('Unknown overview fetch error');
          setState({ data: null, loading: false, error });
        }
      }
    }

    fetchOverview();

    return () => {
      cancelled = true;
    };
    // Keyed on the range's primitive values (Q1), not object identity, so a
    // freshly-constructed but equal-valued range does not trigger a refetch.
  }, [range.from, range.to]);

  return state;
}

/**
 * Fetch the realtime active-visitors/top-pages snapshot immediately on
 * mount, then poll every 30 s (V6) for the lifetime of the mounted
 * component. The interval is cleared on unmount.
 */
export function useRealtime(): AnalyticsFetchState<RealtimeResponse> {
  const [state, setState] = useState<AnalyticsFetchState<RealtimeResponse>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchRealtime(): Promise<void> {
      try {
        const response = await apiClient.fetch(`${ADMIN_ANALYTICS_BASE}/realtime`);

        if (!response.ok) {
          throw await toRequestError(response);
        }

        const data = (await response.json()) as RealtimeResponse;
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (caught) {
        if (!cancelled) {
          const error = caught instanceof Error ? caught : new Error('Unknown realtime fetch error');
          setState({ data: null, loading: false, error });
        }
      }
    }

    fetchRealtime();
    const intervalId = setInterval(fetchRealtime, REALTIME_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return state;
}

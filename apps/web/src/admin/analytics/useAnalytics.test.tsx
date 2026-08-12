/**
 * T072 — useAnalytics data-hook tests (Pass 2 data wiring, V6, FR-017/FR-020, SC-006).
 *
 * Pins the contract for the two data hooks `useAnalytics.ts` (T073) will
 * export: `useOverview(range)` (fetched with the given `from`/`to`,
 * refetched when the range changes) and `useRealtime()` (fetched
 * immediately, polled every 30 s per V6/SC-006's 60 s ceiling). Both hooks
 * must surface loading/error/empty states to their consumer without
 * throwing — the Analytics page (T075) has no error boundary of its own.
 *
 * `apiClient` is mocked at the module boundary (not global `fetch`) so these
 * tests exercise only the hooks' own fetch/poll/state logic, not the
 * Bearer-token silent-refresh machinery `apiClient.fetch` already owns and
 * already has its own coverage (`session.test.tsx`).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

import { apiClient } from '../auth/apiClient.js';
import { useOverview, useRealtime } from './useAnalytics.js';
import {
  overviewPopulated,
  overviewEmpty,
  realtimePopulated,
  realtimeEmpty,
} from './fixtures.js';

vi.mock('../auth/apiClient.js', () => ({
  apiClient: { fetch: vi.fn() },
}));

const mockFetch = vi.mocked(apiClient.fetch);

/** Minimal `Response`-shaped resolution for the hooks' own `ok`/`status`/`json()` usage. */
function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: () => Promise.resolve(body) } as Response;
}

describe('useOverview (T072, FR-017/FR-020)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches the overview endpoint with the given from/to', async () => {
    mockFetch.mockResolvedValue(jsonResponse(overviewPopulated));
    const { result } = renderHook(() =>
      useOverview({ from: '2026-04-15', to: '2026-07-15' }),
    );

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(overviewPopulated);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0] ?? [];
    expect(url).toContain('/api/admin/analytics/overview');
    expect(url).toContain('from=2026-04-15');
    expect(url).toContain('to=2026-07-15');
  });

  it('refetches with the new from/to when the range changes', async () => {
    mockFetch.mockResolvedValue(jsonResponse(overviewPopulated));
    const { result, rerender } = renderHook(
      ({ range }) => useOverview(range),
      { initialProps: { range: { from: '2026-04-15', to: '2026-07-15' } } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetch).toHaveBeenCalledTimes(1);

    mockFetch.mockResolvedValue(jsonResponse(overviewEmpty));
    rerender({ range: { from: '2026-07-01', to: '2026-07-15' } });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.data).toEqual(overviewEmpty));
    const [secondUrl] = mockFetch.mock.calls[1] ?? [];
    expect(secondUrl).toContain('from=2026-07-01');
    expect(secondUrl).toContain('to=2026-07-15');
  });

  it('does not refetch when rerendered with an equal-valued range', async () => {
    mockFetch.mockResolvedValue(jsonResponse(overviewPopulated));
    const { result, rerender } = renderHook(
      ({ range }) => useOverview(range),
      { initialProps: { range: { from: '2026-04-15', to: '2026-07-15' } } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // A fresh object with the same from/to values must not trigger a refetch
    // (the effect keys on the primitive from/to values, not object identity).
    rerender({ range: { from: '2026-04-15', to: '2026-07-15' } });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('surfaces an empty overview response without throwing', async () => {
    mockFetch.mockResolvedValue(jsonResponse(overviewEmpty));
    const { result } = renderHook(() =>
      useOverview({ from: '2026-07-15', to: '2026-07-15' }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(overviewEmpty);
    expect(result.current.error).toBeNull();
  });

  it('surfaces a rejected fetch as an error, never a thrown exception', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() =>
      useOverview({ from: '2026-04-15', to: '2026-07-15' }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.data).toBeNull();
  });

  it('surfaces a non-ok response as an error', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ error: { message: 'from and to query parameters are required' } }, false, 400),
    );
    const { result } = renderHook(() =>
      useOverview({ from: '2026-04-15', to: '2026-07-15' }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.data).toBeNull();
  });
});

describe('useRealtime (T072, V6, SC-006)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches immediately on mount and polls every 30s thereafter', async () => {
    mockFetch.mockResolvedValue(jsonResponse(realtimePopulated));
    const { result } = renderHook(() => useRealtime());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(realtimePopulated);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // No poll fires early — only on the 30s boundary (V6).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(29_000);
    });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('surfaces an empty realtime response without throwing', async () => {
    mockFetch.mockResolvedValue(jsonResponse(realtimeEmpty));
    const { result } = renderHook(() => useRealtime());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.data).toEqual(realtimeEmpty);
    expect(result.current.error).toBeNull();
  });

  it('surfaces a rejected poll as an error, never a thrown exception', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useRealtime());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.loading).toBe(false);
  });
});

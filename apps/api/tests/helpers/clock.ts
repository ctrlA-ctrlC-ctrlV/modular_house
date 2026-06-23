/**
 * Injected clock helper for deterministic time in OTP / reset / lockout / idle tests.
 *
 * Every service that has TTL or expiry logic accepts a `clock: () => Date` parameter
 * instead of calling `new Date()` directly.  Tests create an AdvanceableClock via
 * `createClock()` and pass `clock.now` into the service, then advance the clock to
 * cross a boundary without waiting for real wall-clock time (research R11).
 *
 * Usage:
 *   const clock = createClock();
 *   const svc = new LoginCodeService(prisma, clock.now);
 *   clock.advance(10 * 60 * 1000 + 1); // advance past the 10-minute OTP TTL
 */

export interface AdvanceableClock {
  /** Returns the current fake date. */
  now: () => Date;
  /** Advance the fake clock by `ms` milliseconds. */
  advance: (ms: number) => void;
  /** Jump the fake clock to an absolute date. */
  setNow: (date: Date) => void;
}

/**
 * Create an advanceable clock starting at `initial` (defaults to a fixed
 * epoch so tests are deterministic even without an explicit start time).
 */
export function createClock(initial?: Date): AdvanceableClock {
  // Fixed default epoch so test output is reproducible when no start is given.
  let current: Date = initial ? new Date(initial) : new Date('2025-01-01T00:00:00.000Z');

  return {
    now(): Date {
      return new Date(current);
    },
    advance(ms: number): void {
      current = new Date(current.getTime() + ms);
    },
    setNow(date: Date): void {
      current = new Date(date);
    },
  };
}

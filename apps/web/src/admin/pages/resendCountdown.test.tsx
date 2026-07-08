// T116 — Resend countdown UI test (F1, FR-042).
//
// Asserts the resend/try-again controls disable and show a seconds countdown
// after a request, then re-enable when the 60s cooldown elapses.  This is the
// "Done when" gate for T116.  Uses vitest fake timers to drive the countdown
// deterministically without waiting for real wall-clock time.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TwoFactor } from './TwoFactor.js';
import { ForgotPassword } from './ForgotPassword.js';

// Wrapper that renders a component inside a MemoryRouter (the pages use <Link>)
// and the admin-root scoping div, matching the preAuth.test.tsx pattern.
function renderInAdminRoot(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <div data-admin className="admin-root">
        {ui}
      </div>
    </MemoryRouter>,
  );
}

describe('Resend countdown UI (T116, F1/FR-042)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('TwoFactor page', () => {
    it('disables the resend button with a countdown after a resend click, then re-enables', () => {
      const onResend = vi.fn();
      renderInAdminRoot(<TwoFactor challengeId="chal-1" onResend={onResend} />);

      const resend = screen.getByRole('button', { name: /resend code/i });

      // Before click: enabled, no countdown text.
      expect(resend).toBeEnabled();
      expect(resend).toHaveTextContent('Resend code');

      // Click resend → the callback fires and the 60s countdown begins.
      act(() => {
        fireEvent.click(resend);
      });
      expect(onResend).toHaveBeenCalledWith('chal-1');
      expect(resend).toBeDisabled();
      expect(resend).toHaveTextContent('Resend code (60s)');

      // Advance 30s → countdown at 30s, still disabled.
      act(() => {
        vi.advanceTimersByTime(30_000);
      });
      expect(resend).toBeDisabled();
      expect(resend).toHaveTextContent('Resend code (30s)');

      // Advance the remaining 30s → cooldown elapses, button re-enabled.
      act(() => {
        vi.advanceTimersByTime(30_000);
      });
      expect(resend).toBeEnabled();
      expect(resend).toHaveTextContent('Resend code');
    });
  });

  describe('ForgotPassword page', () => {
    it('disables the try-again control with a countdown when the confirmation state shows, then re-enables', () => {
      renderInAdminRoot(<ForgotPassword isSubmitted={true} onSubmit={vi.fn()} />);

      const tryAgain = screen.getByRole('button', { name: /try again/i });

      // The cooldown starts at 60s when isSubmitted flips true (confirmation
      // state visible).  The control must be disabled with a countdown.
      expect(tryAgain).toBeDisabled();
      expect(tryAgain).toHaveTextContent('try again (60s)');

      // Advance 60s → cooldown elapses, control re-enabled, countdown gone.
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(tryAgain).toBeEnabled();
      expect(tryAgain).toHaveTextContent('try again');
    });
  });
});

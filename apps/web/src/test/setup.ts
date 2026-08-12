import { beforeAll, afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';
import '@testing-library/jest-dom';

// Raise the default `waitFor`/`findBy*` timeout from Testing Library's 1000ms
// default (review finding on T153, 2026-08-12): `apps/web/src/admin/pages/
// Analytics` is lazily loaded (React.lazy + Suspense) as of T153, so tests
// that navigate into it — e.g. `preAuthWiring.test.tsx`'s post-2FA
// assertion, `AppShell.test.tsx`'s sidebar-navigation test — must wait for
// the dynamic import to resolve before its heading appears. That resolution
// is comfortably under 1000ms in isolation, but v8 coverage instrumentation
// (`pnpm test:coverage`, the exact command CI's `test-web` job runs) adds
// enough per-file overhead across the full suite to occasionally push it
// past the default, producing an intermittent 1-2 test flake even with
// `vitest.config.ts`'s `fileParallelism: false` (which only serializes
// *files*, not the instrumentation cost within one). 5000ms leaves ample
// headroom for that overhead while still failing fast on a genuinely broken
// assertion.
configure({ asyncUtilTimeout: 5000 });

// Set test environment variables
beforeAll(() => {
  // Mock environment variables for tests
  import.meta.env.VITE_API_BASE_URL = 'http://localhost:8080';
  import.meta.env.VITE_GA_TRACKING_ID = '';
  import.meta.env.DEV = false;
  import.meta.env.PROD = false;
  import.meta.env.MODE = 'test';
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver for tests that might use it
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class MockIntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver for tests that might use it
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class MockResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
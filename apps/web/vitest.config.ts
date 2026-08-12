import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@modular-house/ui/style.css': path.resolve(__dirname, './src/test/empty.css'),
      '@modular-house/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
      '@': path.resolve(__dirname, './src'),
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'scripts/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: ['node_modules', 'dist'],
    // Disabled at the config level rather than left to a CLI flag (review
    // finding on T153, 2026-08-12): `apps/web/src/admin/pages/Analytics` is
    // lazily loaded (React.lazy + Suspense) as of T153, so its route now
    // resolves at least one microtask later than a synchronous render —
    // under full file-parallelism, multi-worker CPU contention can push that
    // resolution past the default ~1000ms `waitFor`/`findBy*` timeout used
    // by `preAuthWiring.test.tsx` and `AppShell.test.tsx`, producing an
    // intermittent 1-2 test flake. `pnpm --filter @modular-house/web
    // test:run -- --no-file-parallelism` does NOT fix this: pnpm forwards
    // its `--` separator verbatim into the script's argv, so vitest's CLI
    // parser treats the forwarded `--` as ITS OWN "start of raw args"
    // marker, and `--no-file-parallelism` arrives as a positional
    // (file-filter) argument instead of a flag — silently ignored. CI's own
    // `test-web` job invokes plain `pnpm test:coverage` with no parallelism
    // flag at all (`.github/workflows/ci.yml`), so it was equally exposed.
    // Setting the default here, mirroring the equivalent fix already applied
    // in `apps/api/vitest.config.ts` for the same pnpm/vitest interaction
    // (there for a different root cause — shared-database cross-file races
    // — but the identical CLI-flag futility), fixes both local runs and CI
    // uniformly at the single point of truth instead of depending on every
    // caller to pass a flag that never actually reaches vitest.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/**/*.d.ts',
        'src/types/**', // Exclude types
        'src/main.tsx', // Entry point
        'src/vite-env.d.ts',
        'src/forms/**', // Exclude forms until tests are implemented
      ],
      thresholds: {
        global: {
          branches: 15,
          functions: 15,
          lines: 20,
          statements: 20,
        },
        // Critical modules require 100% branch coverage
        'src/lib/apiClient.ts': {
          branches: 60,
          functions: 100,
        },
      },
    },
    // Test timeout
    testTimeout: 10000,
    // Hook timeout
    hookTimeout: 10000,
  },
});
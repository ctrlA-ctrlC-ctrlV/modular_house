import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: ['./src/test/globalSetup.ts'],
    setupFiles: ['./src/test/setup.ts'],
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'prisma/migrations'],
    // Every integration suite shares one real Postgres test database (no
    // per-file schema/transaction sandboxing), so concurrently running test
    // files can observe each other's committed-but-not-yet-cleaned-up rows
    // under READ COMMITTED isolation — a cross-file race documented since
    // T058/T068 and traced to its root cause at this corrective session: the
    // project's own documented "safe" invocation
    // (`vitest run -- --no-file-parallelism`, reached via `pnpm ... -- ...`)
    // never actually disabled parallelism, because pnpm forwards its `--`
    // separator verbatim into the script's argv; vitest's CLI parser then
    // treats that forwarded `--` as ITS OWN "start of raw args" marker, so
    // `--no-file-parallelism` arrives as a positional (file-filter) argument
    // instead of a flag and is silently ignored. CI's own workflow invokes
    // `pnpm test:coverage` with no parallelism flag at all, so it was equally
    // affected. Setting the default here — rather than depending on every
    // caller to pass the flag (and pass it in a form pnpm forwards intact) —
    // fixes both local runs and CI uniformly at the single point of truth.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.{test,spec}.ts',
        'src/test/**',
        'src/seed/**', // Shared seed data, exercised by globalSetup (uninstrumented)
        'src/**/*.d.ts',
        'src/server.ts', // Entry point, covered by integration tests
      ],
      thresholds: {
        global: {
          branches: 30,
          functions: 30,
          lines: 30,
          statements: 30,
        },
        // Critical modules require 100% branch coverage
        'src/middleware/auth.ts': {
          branches: 100,
        },
        'src/middleware/validate.ts': {
          branches: 30,
        },
        'src/services/auth.ts': {
          branches: 100,
        },
        'src/config/env.ts': {
          branches: 40,
        },
      },
    },
    // Test timeout
    testTimeout: 10000,
    // Hook timeout
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
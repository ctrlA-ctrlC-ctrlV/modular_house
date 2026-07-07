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
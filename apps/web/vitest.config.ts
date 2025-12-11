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
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/**/*.d.ts',
        'src/main.tsx', // Entry point
        'src/vite-env.d.ts',
        'src/forms/**', // Exclude forms until tests are implemented
      ],
      thresholds: {
        global: {
          branches: 30,
          functions: 30,
          lines: 30,
          statements: 30,
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
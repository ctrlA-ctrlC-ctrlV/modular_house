import { beforeAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

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
/**
 * App.tsx admin route code-splitting regression test
 * =============================================================================
 *
 * PURPOSE:
 * Guards DoD-5/SC-003 (public-site bundle size parity with the pre-Phase-2
 * baseline). Of the six authenticated `/admin/*` page components, only
 * `Analytics` — directly and via its `admin/analytics/*` and
 * `admin/ui/{chart,select,tabs}` dependents — pulls in admin-only
 * dependencies (`recharts`, `@radix-ui/react-select`, `@radix-ui/react-tabs`)
 * confirmed (by grepping the admin tree for those three package names) to be
 * the entire source of the Phase 2 growth in the public entry chunk. A
 * static top-level `import` of `Analytics` would force the bundler to place
 * that whole dependency tree in the same chunk as the public entry point,
 * inflating the bundle every visitor downloads regardless of whether they
 * ever reach `/admin`.
 *
 * SCOPE DEVIATION (session decision, 2026-08-12): T153's task text names all
 * six admin pages for lazy-loading. `Login`/`TwoFactor`/`ForgotPassword`/
 * `ResetPassword` are exercised by the Phase 1 `admin/pages/
 * preAuthWiring.test.tsx` suite, which asserts on rendered form content
 * synchronously, immediately after `render()`; lazy-loading those pages
 * defers their mount by at least one microtask (unavoidable — `import()`
 * always returns a Promise, even for an already-cached module), which broke
 * 10/10 of that suite's tests. Phase 1 auth suites are explicitly out of
 * scope to modify, so — with sign-off — this guard, and T153's
 * implementation, were narrowed to `Analytics` only, which captures the
 * bundle-size win without that tradeoff. `Settings` also stays static: it is
 * lightweight (react-hook-form + zod + shared UI primitives) and contributes
 * negligibly to bundle size.
 *
 * STRATEGY:
 * Reads `App.tsx`'s own raw source text at build time via Vite's `?raw`
 * import query (`import.meta.glob`), the same source-text-assertion
 * technique used by `admin/__tests__/no-legacy.test.tsx` to check for the
 * *absence* of a pattern rather than rendered behaviour. A regular
 * expression matches a top-level static *value* `import ... from
 * './admin/pages/Analytics'` declaration; after `Analytics` is converted to
 * `React.lazy(() => import(...))` (T153), the module specifier still appears
 * in the source but only inside a dynamic `import()` call expression, never
 * as the target of a static value import, so the pattern stops matching.
 *
 * Refs: specs/013-panel-phase-2/tasks.md T152/T153, DoD-5, SC-003.
 *
 * =============================================================================
 */

import { describe, it, expect } from 'vitest';

// Raw contents of App.tsx, keyed by its module path. `import.meta.glob` with
// the `?raw` query returns the file's text as authored, unparsed by the
// TypeScript/JSX transform, which is what makes a textual import-statement
// assertion possible.
const appModules = import.meta.glob('/src/App.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const appSource = appModules['/src/App.tsx'];

describe('App.tsx admin route code-splitting (T152/DoD-5/SC-003)', () => {
  it('locates App.tsx source for inspection', () => {
    expect(appSource).toBeTypeOf('string');
    expect(appSource.length).toBeGreaterThan(0);
  });

  it('does not statically value-import Analytics from its ./admin/pages module at top level', () => {
    // Matches a line beginning with `import` (but not `import type`),
    // containing `from`, and terminating in the quoted module specifier for
    // the Analytics page — i.e. exactly the shape of App.tsx's pre-T153
    // top-level import (`import { Analytics } from './admin/pages/Analytics'`).
    // A `React.lazy(() => import('./admin/pages/Analytics'))` call
    // expression does not begin a line with `import`, so it does not match.
    const staticImportPattern = /^import\s+(?!type\s)[^;\n]*from\s+['"]\.\/admin\/pages\/Analytics['"]/m;
    expect(staticImportPattern.test(appSource)).toBe(false);
  });
});

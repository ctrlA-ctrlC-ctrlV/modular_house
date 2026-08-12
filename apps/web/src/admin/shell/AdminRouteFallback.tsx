// AdminRouteFallback — Suspense fallback for the lazily-loaded Analytics
// dashboard route (T154, DoD-5). Deliberately theme-neutral: styled with
// Tailwind's fixed gray-scale utilities rather than the admin OKLCH design
// tokens (`--muted-foreground`, `--background`, etc.), since those custom
// properties resolve only within the `.admin-root` scope and this fallback
// must render correctly even if it appears before that scope is active.

/**
 * Minimal loading indicator shown while the Analytics route chunk
 * downloads. A small animated spinner, centred in the available space,
 * with an `sr-only` label so the loading state is announced to assistive
 * technology without adding visible text noise for sighted users during
 * what is expected to be a brief flash.
 */
function AdminRouteFallback() {
  return (
    <div
      data-testid="admin-route-fallback"
      className="flex min-h-svh items-center justify-center"
    >
      <div
        aria-hidden="true"
        className="size-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
      />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export { AdminRouteFallback };

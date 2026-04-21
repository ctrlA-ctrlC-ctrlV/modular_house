# 011 — Sales / Discount Functionality

**Status:** Planning
**Owner:** PM / Web Team
**Last updated:** 2026-04-21

---

## 1. Background & Goal

The Modular House website currently has no notion of "sale", "discount", or "campaign". All prices displayed across the Garden Room marketing page,
configurator, and reusable UI components are single absolute values.

We want to introduce lightweight, opt-in sales/discount functionality that can be switched on for promotional campaigns (e.g. Spring Sale, Black Friday)
and switched off again with a single change. Scope is deliberately limited to the Garden Room product line for this first iteration; the primitives will be
designed so House Extensions can adopt the same pattern later without redesign.

Three workstreams are in scope:

1. **Site-wide Sale Banner** below the header.
2. **Price data model update** in `garden-room-data` to carry both `originalPrice` and `salePrice`.
3. **Strikethrough price presentation** in `ProductRangeGrid`, `ProductShowcase`, and `ProductConfigurator` — opt-in via props.

Non-goals (this iteration):

- No admin UI / CMS for managing sales (config lives in code).
- No coupon codes, per-user discounts, or cart/checkout integration.
- No backend API or database schema changes.
- No House Extension rollout under *this* campaign — House Extensions will be campaigned separately with their own copy, dates, and pricing data (see §7.1). Primitives built here (banner, strikethrough props) must not preclude that.

---

## 2. Success Criteria

- Marketing can enable a named sale + end date/time with a **single file edit** (flip a flag + update copy), and disable it by flipping the same flag.
- The **Sale Banner** and the **strikethrough price display** are controlled by *independent* switches. Either can be on while the other is off:
  - Banner visibility: `PROMO_CONFIG.enabled`.
  - Strikethrough visibility: the `showOriginalPrice` prop on each consuming component, decided per-page.
  - Turning the banner off does **not** hide strikethroughs, and vice versa.
- Every strikethrough-capable component can show or hide the original price **independently per consumer page** via props.
- The banner shows a **live countdown timer** to the sale end date/time (see §4.3). When the countdown reaches zero the banner auto-hides on the client without requiring a deploy.
- Existing prices shown in the app remain untouched (they are already the sale prices per the project brief).
- No regressions in Lighthouse performance or accessibility scores for the Garden Room and Configurator pages.
- Works with SSR (the app uses `entry-server.tsx`) — no hydration mismatches (countdown renders a stable placeholder on the server and hydrates to live values on the client).

---

## 3. Current State (as-is reference)

Relevant files surveyed:

- [apps/web/src/components/TemplateLayout.tsx](apps/web/src/components/TemplateLayout.tsx) — hosts `<Header>` via `HeaderProvider` / `HeaderContext`.
- [packages/ui/src/components/Header/Header.tsx](packages/ui/src/components/Header/Header.tsx) — shared header component.
- [packages/ui/src/components/InfoBanner/InfoBanner.tsx](packages/ui/src/components/InfoBanner/InfoBanner.tsx) — existing informational banner pattern (reference only; not reused as-is for the promo strip).
- [apps/web/src/data/configurator-products.ts](apps/web/src/data/configurator-products.ts) — single source of truth for products (`HydratedProduct.basePriceCentsInclVat`, cents inclusive of 23% VAT).
- [apps/web/src/types/garden-room.ts](apps/web/src/types/garden-room.ts) — type definitions (`Product`, `HydratedProduct`).
- [apps/web/src/data/garden-room-data.ts](apps/web/src/data/garden-room-data.ts) — projections into `PRODUCT_SHOWCASE_PRODUCTS`, `GARDEN_ROOM_PRODUCTS`, `GARDEN_ROOM_QUICK_VIEW`; already has `formatEurCents(cents)` helper.
- [packages/ui/src/components/ProductRangeGrid/ProductRangeGrid.tsx](packages/ui/src/components/ProductRangeGrid/ProductRangeGrid.tsx) — `ProductCard.price?: string`.
- [packages/ui/src/components/ProductShowcase/ProductShowcase.tsx](packages/ui/src/components/ProductShowcase/ProductShowcase.tsx) — `ProductShowcaseProduct.price: string`.
- [apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx](apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx) and [apps/web/src/components/ProductConfigurator/utils.ts](apps/web/src/components/ProductConfigurator/utils.ts) — `formatPriceCents`, live total = `basePriceCentsInclVat + sum(addonPriceDeltaCents)`.

Observations:

- Prices flow one-way: `HydratedProduct.basePriceCentsInclVat` → formatted strings projected in `garden-room-data.ts`. The UI library components accept pre-formatted `string` prices today.
- Header already has a context-based config system; we can extend it with a promo-banner slot without touching pages one-by-one.

---

## 4. Workstream 1 — Sale Banner

### 4.1 Scope

A thin promotional strip rendered **directly beneath the site header**, visible on every page while an active campaign is running. The banner is **purely informational** — no CTA link, no dismiss button. Content:

- Eyebrow / tag: optional short label (e.g. "Limited Time").
- Sale name: e.g. "Spring Sale".
- Live **countdown timer** to the sale end (days / hours / minutes / seconds). See §4.3 for behaviour.
- No CTA link (v1).
- No dismiss / close button (v1) — banner is controlled centrally via `PROMO_CONFIG.enabled`.

### 4.2 Single on/off switch

All banner state lives in one config file, shipped with the build:

- New file: `apps/web/src/data/promo-config.ts`
- Exports a single `PROMO_CONFIG: PromoConfig` constant.

```ts
export interface PromoConfig {
  /** Master switch for the banner only. When false, the banner does not render. Does NOT affect strikethrough price display. */
  readonly enabled: boolean;
  /** Human-readable sale name, e.g. "Spring Sale 2026". */
  readonly name: string;
  /**
   * ISO 8601 date-time (e.g. "2026-05-31T23:59:59+01:00") marking the
   * moment the sale ends. The banner's countdown targets this instant
   * and auto-hides once the remaining time reaches zero.
   */
  readonly endsAt: string;
  /** Optional short label rendered before the name (e.g. "Limited time"). */
  readonly eyebrow?: string;
}
```

Enabling a campaign = set `enabled: true` and update `name` / `endsAt`.
Disabling = set `enabled: false`. No component code changes required.

Note: this switch governs **banner visibility only**. Strikethrough price display is controlled independently by the `showOriginalPrice` prop on each consuming component (§6).

### 4.3 Component

New shared component: `packages/ui/src/components/PromoBanner/`

- Files: `PromoBanner.tsx`, `PromoBanner.css`, `PromoBanner.stories.tsx`, plus a small `useCountdown.ts` hook colocated in the folder.
- Props:
  ```ts
  export interface PromoBannerProps {
    name: string;
    /** ISO 8601 date-time the sale ends. Drives the live countdown. */
    endsAt: string;
    eyebrow?: string;
    variant?: 'dark' | 'light';   // match Header variants
    className?: string;
  }
  ```
- Renders a single-line banner (wrapping on mobile) with:
  - Left: `eyebrow` · `name`.
  - Right: live countdown — `DD : HH : MM : SS` on desktop, collapsed to `DD d HH h MM m` on narrow viewports. Each segment is labelled for screen readers (e.g. `<span aria-label="12 days">12</span>`).
- Countdown behaviour (`useCountdown`):
  - Computes remaining ms = `new Date(endsAt).getTime() - Date.now()`.
  - SSR: renders a static snapshot (e.g. `-- : -- : -- : --`) to avoid hydration mismatch; hook swaps to live values on first client effect.
  - Ticks every 1 s via `setInterval`, cleared on unmount. Uses a single interval shared across the page (component-local is fine in v1; only one banner mounts).
  - When remaining ms ≤ 0, the hook returns `null` and the banner renders nothing (effectively auto-disabling the banner past the end instant without a deploy).
  - Reduced-motion users still see the countdown; we're updating text, not animating it.
- BEM class naming: `.promo-banner`, `.promo-banner__eyebrow`, `.promo-banner__name`, `.promo-banner__countdown`, `.promo-banner__countdown-segment`, `.promo-banner__countdown-value`, `.promo-banner__countdown-label`.
- Accessibility: wrapped in `<aside role="region" aria-label="Sale announcement">`. The countdown is wrapped in an element with `aria-live="off"` to avoid a screen-reader announcement every second; a single `aria-label` summarises the remaining time.
- No focus trap, no CTA, no dismiss — it's purely informational.
- Honours dark/light variant to pair visually with the header beneath which it sits.

### 4.4 Integration point

Mount in [TemplateLayout.tsx](apps/web/src/components/TemplateLayout.tsx) inside `#template__header-wrapper`, **immediately after `<Header />`** so it sits directly beneath the header and participates in the same stacking context:

```tsx
<Header variant={config.variant} positionOver={config.positionOver} />
{PROMO_CONFIG.enabled && (
  <PromoBanner
    name={PROMO_CONFIG.name}
    endsAt={PROMO_CONFIG.endsAt}
    eyebrow={PROMO_CONFIG.eyebrow}
    variant={config.variant}
  />
)}
```

Notes:

- When the header uses `positionOver` (overlay hero), the banner must still sit visually below the header on scroll. Simplest approach: render the banner in normal document flow at the top of `<main>` on overlay pages, or keep it in the wrapper but with `position: relative` and `z-index` below the header. Decision deferred to implementation; acceptance criterion is "banner always visible directly below header content regardless of page variant". 
- The flag read happens at module scope → no runtime perf cost when disabled (tree rendered as `false`).

### 4.5 Testing

- Unit: PromoBanner renders name + countdown segments given a future `endsAt`; renders nothing when `endsAt` is in the past.
- Unit: `useCountdown` — mock `Date.now()` and a fake timer; verify tick updates, zero-crossing returns `null`, cleanup clears the interval.
- SSR: snapshot includes the placeholder dashes, not live numbers, so hydration is stable.
- Integration: with `PROMO_CONFIG.enabled=false`, banner is not in the DOM; strikethrough prices are unaffected.
- Visual: Storybook stories for dark + light variants, and for a near-expiry state (e.g. `endsAt` 30 s in the future) to observe zero-crossing.

---

## 5. Workstream 2 — Price data update (`garden-room-data`)

### 5.1 Scope

Extend the product data model so each product can carry both an original (pre-sale) price and the current sale price. The **current prices already in the app are the sale prices** — we only add the `originalPrice` field.

### 5.2 Type changes

[apps/web/src/types/garden-room.ts](apps/web/src/types/garden-room.ts) — extend the `Product` interface:

```ts
// existing:
readonly basePriceCentsInclVat: number;

// new (both optional at the type level to allow per-product control):
/**
 * Pre-sale "original" base price in euro cents inclusive of VAT.
 * When present, this value is typically rendered as a strikethrough
 * alongside basePriceCentsInclVat (the current sale price). When
 * absent, no discount is advertised for this product.
 */
readonly originalBasePriceCentsInclVat?: number;
```

Rationale for keeping `basePriceCentsInclVat` as the **sale (current)** price:

- Zero-change semantics for every consumer that already reads base price.
- Pricing engines (configurator totals, addons) continue to sum against the *actually charged* price, which is the sale price.
- Disabling a sale = simply remove the `originalBasePriceCentsInclVat` field (or set it equal) → strikethroughs vanish naturally.

### 5.3 Seed data update

[apps/web/src/data/configurator-products.ts](apps/web/src/data/configurator-products.ts) — add `originalBasePriceCentsInclVat` on each product (values in cents, inclusive of VAT, matching the existing convention):

| Slug            | Existing `basePriceCentsInclVat` (sale, cents) | New `originalBasePriceCentsInclVat` (cents) |
| --------------- | ---------------------------------------------- | ------------------------------------------- |
| `compact-15`    | *existing value (≈ 2 950 000)*                 | `4_000_000`   (€40,000)                     |
| `studio-25`     | *existing value*                               | `5_800_000`   (€58,000) — "Box" layout      |
| `studio-25` (*) | —                                              | `6_588_800` / `6_665_400` for En Suite / Bedroom layouts — see §5.3.1 |
| `living-35`     | *existing value*                               | `8_122_100`   (€81,221)                     |
| `grand-45`      | *existing value*                               | `10_698_100`  (€106,981) — 9 m × 5 m        |

#### 5.3.1 Studio 25 — layout-dependent originals

The 25 m² product has three original prices depending on layout (Box / En Suite / Bedroom). Two implementation options:

- **Option A (recommended):** add an optional `originalPriceCentsInclVatByLayoutId?: Readonly<Record<string, number>>` on `Product` / `LayoutOption`. The configurator resolves the original price for the currently selected layout the same way it already resolves the effective base price via `layoutOptionId`. For non-Studio products, this field is omitted and `originalBasePriceCentsInclVat` is used.
- **Option B (fallback):** set `originalBasePriceCentsInclVat` to the "Box" value on `studio-25` and accept that the strikethrough on the range grid / showcase shows the Box original only. Configurator can still override via prop (see §6). Simpler but less accurate in the configurator.

**Decision: Option A is adopted.** A per-layout original-price map is added to `studio-25` and the configurator resolves the original price via the active `layoutOptionId`. Option B is documented only as a rejected alternative.

### 5.4 Projection updates

[apps/web/src/data/garden-room-data.ts](apps/web/src/data/garden-room-data.ts) —

- Add a new helper right beside `formatEurCents`:
  ```ts
  function formatEurCentsOrUndefined(cents: number | undefined): string | undefined {
    return cents === undefined ? undefined : formatEurCents(cents);
  }
  ```
- In `PRODUCT_SHOWCASE_PRODUCTS` mapping, pass through an `originalPrice: formatEurCentsOrUndefined(p.originalBasePriceCentsInclVat)`.
- In `GARDEN_ROOM_PRODUCTS` (`ProductCard[]`), pass through `originalPrice` to match the new `ProductCard.originalPrice?: string`
  field (see §6.1).
- `GARDEN_ROOM_QUICK_VIEW` is out of scope for v1 (modal already overloaded) but should not break — simply don't add a strikethrough
  there yet.

### 5.5 Backwards compatibility

- All new type fields are optional. Existing fixtures, tests, and any unrelated products (e.g. future House Extension data) continue to compile and render unchanged.
- The configurator's running total (`basePriceCentsInclVat + addons`) continues to produce the **sale** total — this is the correct final price to display and to submit via `apiClient.submitEnquiry`.

### 5.6 Testing

- Unit: `configurator-products.ts` snapshot for Studio 25 layout originals.
- Unit: `garden-room-data.ts` projections — original price is formatted with euro sign and thousands separator, and `undefined` propagates when no original is set.

---

## 6. Workstream 3 — Strikethrough price display

### 6.1 Shared principles

- Feature is **opt-in per component instance** via props, and is **fully independent of the Sale Banner state**. A page can render strikethroughs without the banner being enabled, and the banner can be enabled without any strikethroughs.
- Each consumer chooses independently whether the strikethrough is enabled and which original price value to display.
- The **data contract is a pre-formatted string** (same as the current `price` prop on these components) — matches the existing library style.
- **Price label rule:**
  - When `showOriginalPrice === false` (or the component instance has no `originalPrice` to show), the price is prefixed with the label **"Turnkey price from"**, followed by the single price value. This applies across `ProductRangeGrid`, `ProductShowcase`, and `ProductConfigurator`.
  - When `showOriginalPrice === true` and an `originalPrice` is available, the label is omitted (or replaced with a short accessibility-only prefix; see below). The struck-through original sits next to the highlighted sale price.
- Accessibility:
  - Original price is marked up as `<s>` (semantic) with a visually-hidden prefix `"Original price: "` for screen readers.
  - Sale price is announced with a visually-hidden prefix `"Sale price: "` when the strikethrough sibling is present.
  - When `showOriginalPrice` is false, the visible "Turnkey price from" label doubles as the screen-reader prefix (no extra hidden nodes).

### 6.2 `ProductRangeGrid`

Files: [packages/ui/src/components/ProductRangeGrid/ProductRangeGrid.tsx](packages/ui/src/components/ProductRangeGrid/ProductRangeGrid.tsx)

- Extend `ProductCard`:
  ```ts
  /** Optional original (pre-sale) formatted price, e.g. "€40,000". */
  originalPrice?: string;
  ```
- Extend component props:
  ```ts
  /**
   * When true, cards whose ProductCard has a defined `originalPrice`
   * render it as a strikethrough next to the sale price. When false
   * or omitted, originalPrice is ignored. Default: false.
   */
  showOriginalPrice?: boolean;
  ```
- Render:
  - If `showOriginalPrice && card.originalPrice && card.price`:
    `<span class="product-range-card__price-old"><s>{originalPrice}</s></span> <span class="product-range-card__price">{price}</span>` (no "Turnkey price from" label).
  - Else (showOriginalPrice is false or no originalPrice): render `<span class="product-range-card__price-label">Turnkey price from</span> <span class="product-range-card__price">{price}</span>`.
  - Add a `.product-range-card--on-sale` modifier on the article when strikethrough is active so downstream CSS can, e.g., tint the price.

Consumer update: [apps/web/src/routes/GardenRoom.tsx](apps/web/src/routes/GardenRoom.tsx) passes `showOriginalPrice` independently of `PROMO_CONFIG.enabled`. For v1 the Garden Room page opts in explicitly (e.g. a local `SHOW_SALE_PRICES = true` constant or a separate `PROMO_CONFIG.showStrikethroughs` flag) so strikethroughs can be toggled without touching the banner.

### 6.3 `ProductShowcase`

Files: [packages/ui/src/components/ProductShowcase/ProductShowcase.tsx](packages/ui/src/components/ProductShowcase/ProductShowcase.tsx)

- Extend `ProductShowcaseProduct`:
  ```ts
  /** Optional original (pre-sale) formatted price, e.g. "€40,000". */
  originalPrice?: string;
  ```
- Extend `ProductShowcaseProps`:
  ```ts
  showOriginalPrice?: boolean;
  ```
- Render the original price above or next to the existing `price` text on the product-row background. Styling decisions:
  - Original: smaller, struck through, reduced opacity.
  - Sale (current): keep the existing prominent treatment; consider a subtle accent colour when `showOriginalPrice && originalPrice` is present.
- When `showOriginalPrice` is false, prefix the price with the visible label **"Turnkey price from"** in the same row slot.
- Note: the Garden Room page currently has `ProductShowcase` commented out. Wire the prop anyway; this guarantees other pages (or when it's re-enabled) pick the feature up without another change.

### 6.4 `ProductConfigurator`

Files:
- [apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx](apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx)
- [apps/web/src/components/ProductConfigurator/SummaryNavBar.tsx](apps/web/src/components/ProductConfigurator/SummaryNavBar.tsx)
- [apps/web/src/components/ProductConfigurator/StickySubHeader.tsx](apps/web/src/components/ProductConfigurator/StickySubHeader.tsx)
- [apps/web/src/components/ProductConfigurator/utils.ts](apps/web/src/components/ProductConfigurator/utils.ts) (`formatPriceCents`)

The configurator displays a **live total** (base + addons). The strikethrough semantics here are:

- **"Original" total** = `originalBasePriceCentsInclVat` (resolved per layout for Studio 25) + selected addon price deltas.
- **"Sale" total** = current live total (existing behaviour).

This means the delta between original and sale is carried on the base price only; addon deltas are the same pre- and post-sale. This matches the brief: only the **base** prices in the table above are the sale subject.

Prop surface:

- Extend `ProductConfiguratorPageProps`:
  ```ts
  interface ProductConfiguratorPageProps {
    product: ConfiguratorProduct;
    /**
     * When true and the product carries an original base price,
     * display a strikethrough "original total" next to the live total
     * in the sticky sub-header and summary. Default: false.
     */
    showOriginalPrice?: boolean;
  }
  ```
- Mirror the prop on `StickySubHeader` and `SummaryNavBar`. Those components receive both `totalPriceCents` and a new optional `originalTotalPriceCents?: number`; they format both via `formatPriceCents` and render the strikethrough only when both are
  present and `showOriginalPrice` is true. 
- Compute `originalTotalPriceCents` inside `useConfiguratorState` (same place the live total is computed) using the resolved original base price plus the same addon sum. For `studio-25`, the resolver reads `originalPriceCentsInclVatByLayoutId[selections.layoutOptionId]` and falls back to `product.originalBasePriceCentsInclVat` if absent (Option A from §5.3.1).
- When `showOriginalPrice` is false, the price readouts in `StickySubHeader` and `SummaryNavBar` are prefixed with the visible label **"Turnkey price from"**. When true, the label is omitted and the struck-through original sits beside the live total.

Consumer update: [apps/web/src/routes/GardenRoomConfigurator.tsx](apps/web/src/routes/GardenRoomConfigurator.tsx) passes `showOriginalPrice` based on the page's own flag, independent of `PROMO_CONFIG.enabled`.

### 6.5 Styling

- Add token-level styles in each component's CSS file under a single BEM modifier (e.g. `.product-range-card__price-old`, `.product-showcase__price-old`, `.configurator__total--striken`).
- Use existing design tokens from `.docs/design/`; no new colours — prefer a muted neutral for strikethrough and the existing primary
  accent for the sale price.
- Ensure the combined row still fits within the current card heights on mobile (test on 320 px viewport).

### 6.6 Testing

- Unit: each component renders the strike element **only** when `showOriginalPrice && originalPrice/originalTotalPriceCents` is set.
- Accessibility: screen-reader-only prefixes are read; `<s>` element is used; no duplicate announcements.
- Snapshot: Storybook story per component with on/off states.
- Configurator integration: toggling layout on Studio 25 updates both strikethrough and live total correctly (Option A from §5.3.1).

---

## 7. Cross-cutting concerns

### 7.1 Other pages

House Extension page (`HouseExtension.tsx`) also consumes `ProductRangeGrid`/`ProductShowcase`. **House Extensions will be campaigned separately** from Garden Rooms — different promotional copy, different timing, and different price deltas. They are explicitly out of scope for this iteration. Because the strikethrough feature is prop-driven and defaults to off, the House Extension page is unaffected until it opts in as part of its own campaign workstream. When that campaign lands, it will:

- Author its own `house-extension-data` original-price fields following the same type pattern introduced in §5.
- Decide independently whether to reuse `PromoBanner` (re-pointing it at a House-Extension-specific `endsAt` / `name`) or introduce a second banner slot. A future `PromoConfig` can grow to a keyed map (e.g. `{ gardenRoom: {...}, houseExtension: {...} }`) without breaking v1 consumers.

### 7.2 SEO / structured data

- If `originalBasePriceCentsInclVat` is present and the banner is enabled, the Product JSON-LD can optionally emit `priceSpecification` with `priceType: "ListPrice"` alongside the current `offers.price`. **Deferred to a follow-up** — out of scope for v1.
- `<Seo>` meta/description copy is not changed automatically; marketing can update per-campaign if desired.

### 7.3 Analytics

**What this is.** A tiny, one-line hook into the site's existing Google Tag Manager (GTM) `dataLayer` (already wired via `GoogleTag.tsx`). When the `PromoBanner` mounts, it pushes a single structured event identifying the active campaign. Concretely:

```ts
// inside PromoBanner on mount
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: 'promo_banner_view',
  promo_name: PROMO_CONFIG.name,     // e.g. "Spring Sale 2026"
  promo_ends_at: PROMO_CONFIG.endsAt, // ISO timestamp
  page_path: location.pathname,
});
```

No personal data is captured — only the campaign identifier and the page on which the user saw it.

**Why it matters.** Without this event, we can see *that* traffic and enquiries went up during a sale window, but we cannot attribute them to the campaign inside GA4 / GTM. Adding one named event unlocks:

- **Campaign-scoped funnels.** In GA4 we can filter or segment sessions by `promo_name`, then measure the enquiry-form submission rate against the same segment for non-promo sessions. This is the single cleanest way to answer "did the Spring Sale actually move the needle?".
- **Per-campaign comparison.** Once more than one campaign has run (Spring, Black Friday, etc.), `promo_name` becomes a dimension we can slice by — conversion rate, average configurator total, most-viewed product size — letting Marketing iterate on what the next sale should emphasise.
- **Banner-to-enquiry attribution.** Combined with the existing enquiry submit events, we can compute the fraction of converting sessions that saw the banner, a proxy for banner effectiveness separate from the raw price discount.
- **Zero-cost safety net.** Because the event is pushed only when the banner mounts, it is automatically gated by `PROMO_CONFIG.enabled`. Disabling the sale stops the event. No retention concerns beyond the existing GA4 retention.

**Effort.** Roughly 5 lines inside `PromoBanner.tsx` plus a one-time GTM tag configuration by Marketing (create a GA4 event tag triggered on `promo_banner_view`). Marketing sign-off requested before merge, but the implementation cost is negligible and the ROI is high when the next campaign lands.

### 7.4 SSR

- `PROMO_CONFIG` is a static module import → trivially SSR-safe. 
- Banner has no client-only hooks in v1 → no hydration risk.

### 7.5 Security

- No user input; no XSS surface (banner copy is code-authored).
- CTA `href` is validated by eye at code-review time.

---

## 8. Phased delivery

| Phase | Deliverables | Gate |
| ----- | ------------ | ---- |
| P1 — Data | §5 type + seed + projection changes, unit tests | Typecheck green; prices unchanged in UI |
| P2 — Banner | §4 `PromoBanner` component + `promo-config.ts` + TemplateLayout wiring + Storybook | `enabled=false` by default; no UI delta |
| P3 — Components | §6 prop additions (`showOriginalPrice`, `originalPrice`) across the three components with styling and tests | Storybook visual review |
| P4 — Page wiring | Enable on `GardenRoom.tsx` and `GardenRoomConfigurator.tsx` via `PROMO_CONFIG.enabled`; smoke test | Marketing UAT on preview URL |
| P5 — Go / no-go | Flip `enabled: true` in `promo-config.ts`, update `name` / `endDate`, merge, deploy | Prod smoke test |

P1–P3 can be merged without the banner ever rendering in production
(flag off). The visible launch is P4 + P5 only.

---

## 9. Risks & mitigations

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| Strikethrough added where not wanted | Customer confusion | Default prop is `false`; every consumer page makes an explicit opt-in |
| Studio 25 strike price wrong per layout | Misleading pricing | Implement Option A (§5.3.1) — per-layout originals |
| Banner overlaps header on `positionOver` routes | Visual bug | Explicit acceptance test: banner visible below header on Landing + GardenRoom |
| Marketing forgets to update `endsAt` | Stale banner | Countdown auto-hides the banner once `endsAt` is in the past; a dev-only `console.warn` fires in non-production builds when `enabled=true && endsAt < now` |
| Scope creep into backend/coupon/checkout | Delays v1 | Explicit non-goals in §1; reject in review |

---

## 10. Resolved decisions

1. **Studio 25 originals** — **Option A** adopted (layout-aware originals via `originalPriceCentsInclVatByLayoutId`).
2. **Banner content** — **Purely informational**: countdown timer, no CTA link.
3. **Dismiss button** — **Non-dismissible** in v1; controlled centrally via `PROMO_CONFIG.enabled`.
4. **House Extension rollout** — **Explicitly deferred**; House Extensions will run a separate campaign with their own data and timing (see §7.1).
5. **Countdown vs. static date** — **Countdown timer** (days/hours/minutes/seconds), auto-hides at zero.
6. **Banner / strikethrough coupling** — **Independent**. `PROMO_CONFIG.enabled` controls only the banner; `showOriginalPrice` props control strikethroughs per consumer.
7. **Price label when strikethrough is off** — **"Turnkey price from"** is the visible label in all three strikethrough-capable components.

## 10a. Open questions

- **Analytics event** — Marketing to confirm the `promo_banner_view` event name and any additional dimensions they want surfaced (see §7.3).

---

## 11. File-change summary (for reviewer scanning)

New files:

- `apps/web/src/data/promo-config.ts`
- `packages/ui/src/components/PromoBanner/PromoBanner.tsx`
- `packages/ui/src/components/PromoBanner/PromoBanner.css`
- `packages/ui/src/components/PromoBanner/PromoBanner.stories.tsx`
- `packages/ui/src/components/PromoBanner/useCountdown.ts`

Modified files:

- `apps/web/src/types/garden-room.ts` — add `originalBasePriceCentsInclVat` (+ optional per-layout map).
- `apps/web/src/data/configurator-products.ts` — populate original prices for all six rows in the brief.
- `apps/web/src/data/garden-room-data.ts` — project `originalPrice` into `PRODUCT_SHOWCASE_PRODUCTS` and `GARDEN_ROOM_PRODUCTS`.
- `packages/ui/src/index.ts` — export `PromoBanner` and its types.
- `packages/ui/src/components/ProductRangeGrid/ProductRangeGrid.tsx` (+ `.css`) — `originalPrice`, `showOriginalPrice`.
- `packages/ui/src/components/ProductShowcase/ProductShowcase.tsx` (+ `.css`) — `originalPrice`, `showOriginalPrice`.
- `apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx` — `showOriginalPrice` prop + plumbing.
- `apps/web/src/components/ProductConfigurator/useConfiguratorState.ts` — compute `originalTotalPriceCents`.
- `apps/web/src/components/ProductConfigurator/StickySubHeader.tsx` — render strike.
- `apps/web/src/components/ProductConfigurator/SummaryNavBar.tsx` — render strike.
- `apps/web/src/components/TemplateLayout.tsx` — mount `<PromoBanner>` below `<Header>` when `PROMO_CONFIG.enabled`.
- `apps/web/src/routes/GardenRoom.tsx` — pass `showOriginalPrice={PROMO_CONFIG.enabled}` to `ProductRangeGrid` (and `ProductShowcase` if re-enabled).
- `apps/web/src/routes/GardenRoomConfigurator.tsx` — pass `showOriginalPrice={PROMO_CONFIG.enabled}` to `ProductConfiguratorPage`.

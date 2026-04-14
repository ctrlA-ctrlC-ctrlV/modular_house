# About Page — Component Specifications

Each component introduced for the `/about` page has a dedicated specification covering its prop contract, DOM structure, design-token mapping, responsive behaviour, accessibility rules, and a numbered task breakdown.

| # | Component | Template Section | Spec |
|---|-----------|------------------|------|
| 1 | ContentWithImage | Section 2 — Our Story | [content-with-image.md](./content-with-image.md) |
| 2 | ValueCardGrid    | Section 3 — Mission & Values | [value-card-grid.md](./value-card-grid.md) |
| 3 | FeatureChecklist | Section 4 — Why Steel Frame | [feature-checklist.md](./feature-checklist.md) |
| 4 | TeamGrid         | Section 5 — Our Team | [team-grid.md](./team-grid.md) |
| 5 | StatsBar         | Section 6 — Company Stats | [stats-bar.md](./stats-bar.md) |
| 6 | GradientCTA      | Section 7 — Ready to Start | [gradient-cta.md](./gradient-cta.md) |

## Common Shape

Every spec follows the same 10-section template:

1. Purpose
2. Source Files
3. Props Contract
4. DOM Structure
5. Design Token Mapping
6. Responsive Behaviour
7. Interaction & Motion
8. Accessibility Checklist
9. Task Breakdown
10. Done Criteria

## Shared Conventions

- **BEM class names** — every component uses `block__element--modifier`.
- **No Tailwind** in production — the template HTML is prototyping only.
- **No raw hex values** in CSS — use CSS custom properties defined in `apps/web/src/styles/tokens.css`.
- **No `any` type** — every prop has an explicit TypeScript type.
- **No emoji** in source code.
- **Standard DOM events** for interoperability — avoid custom synthetic event shapes.
- **`OptimizedImage`** for every `<img>` — provides AVIF/WebP/fallback chain.
- **`prefers-reduced-motion`** respected on every transition and transform.

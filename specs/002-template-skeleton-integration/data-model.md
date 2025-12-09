# Data Model: Template–Skeleton Integration

Although this phase focuses on styling integration (no backend schema changes), we define conceptual entities to maintain consistency and enable future automation.

## Entities

- TemplateToken
  - Fields: `name` (string), `cssVar` (string), `value` (string), `category` ("color"|"spacing"|"typography"|"misc"), `source` (string: ".template/rebar")
  - Rules: `cssVar` uses `--mh-*` prefix; values mapped 1:1 from template where possible.

- Layout
  - Fields: `name` ("RebarLayout"), `wrapperClass` ("theme-rebar"), `regions` (header, main, footer)
  - Relationships: uses Component `Header`, `Footer`.

- Component
  - Fields: `name`, `selector` (string), `classes` (string[]), `role` ("nav"|"content"|"footer"|"utility")
  - Rules: Class naming follows `c-` (components), `l-` (layout), `u-` (utilities).

- RouteView
  - Fields: `path` (string), `usesLayout` (boolean), `components` (Component[])
  - Rules: All public routes use `RebarLayout`.

- customer
  - id: UUID (pk)
  - customerNumber: string (unique, human-friendly, e.g., C250212345 where first 2 digit is the year, second 2 is the quater, and the last five is the number of quote of the year)
  - firstContactDate: date (defaults to now)
  - customer: { 
    first_name: string, 
    surname?: string, 
    email: string, 
    phone?: string, 
    address?: string, 
    eircode?: string 
    }
  - product: "garden-room"|"house-extension"
  - notes: { 
    createdBy: string (page or admin name), 
    createdAt: timestamp, 
    message: string
    }
  - status: "active"|"deleted"
  - audit: { 
    createdAt: timestamp,
    createdBy: string (page or admin name), 
    updatedAt?: timestamp,
    updatedBy?: string, 	
    }

## Relationships

- Layout 1..* → Component (composition)
- RouteView 1 → Layout (public routes)
- Component * → TemplateToken * (implicit via CSS variables)

## Validation Rules

- All components must use `c-`, `l-`, or `u-` prefixed classes from the template or documented app equivalents.
- All RouteViews in scope must render via `RebarLayout` wrapper.
- CSS variables must be defined in `tokens.css` and referenced in `template.css` or component styles.

## State Transitions

- Not applicable (styling-only integration). Future phases may introduce theme switching.

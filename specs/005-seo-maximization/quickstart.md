# Quickstart: SEO & SSG

## Prerequisites
- Node 20+
- pnpm

## Building for Production (SSG)

The build process is now two steps:
1. Build the Client bundle (normal Vite build)
2. Build the Server bundle (SSR mode)
3. Execute the Prerender script

```bash
# In repo root
pnpm build

# Or specifically in apps/web
cd apps/web
pnpm build:client    # Generates dist/
pnpm build:server    # Generates dist/server/
pnpm prerender       # Generates HTML files in dist/
```

## Developing
The dev environment remains a standard SPA. SSG only happens at build time.
To test SEO generation locally:

```bash
cd apps/web
pnpm run preview
# Then view source of http://localhost:4173 to verify meta tags
```

## Adding a New Page
1. Create the component in `src/routes/NewPage.tsx`
2. Add the route to `src/route-config.ts` (This automatically adds it to App Router, SSG, and Sitemap)

```typescript
// src/route-config.ts
{
  path: '/new-page',
  element: <NewPage />,
  seo: {
    title: 'New Page Title',
    description: 'Description...'
  }
}
```

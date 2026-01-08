import React from 'react';
import Landing from './routes/Landing';
import GardenRoom from './routes/GardenRoom';
import HouseExtension from './routes/HouseExtension';
import Gallery from './routes/Gallery';
import About from './routes/About';
import Contact from './routes/Contact';
import Privacy from './routes/Privacy';
import Terms from './routes/Terms';
import { AppRoute } from './types/seo';
import NotFound from './routes/NotFound';
import { routesMetadata } from './routes-metadata';

/**
 * Component mapping for routes.
 * Keys correspond to the 'path' in routesMetadata.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const componentMap: Record<string, React.ComponentType<any>> = {
  '/': Landing,
  '/garden-room': GardenRoom,
  '/house-extension': HouseExtension,
  '/gallery': Gallery,
  '/about': About,
  '/contact': Contact,
  '/privacy': Privacy,
  '/terms': Terms,
  '*': NotFound,
};

/**
 * Central configuration for all public application routes.
 * Composed by merging static metadata with actual React components.
 * Used by the client-side router and server-side static generation.
 */
export const routes: AppRoute[] = routesMetadata.map((meta) => {
  const Component = componentMap[meta.path];
  
  if (!Component) {
    console.warn(`No component found for path: ${meta.path}`);
  }

  return {
    ...meta,
    component: Component || NotFound,
  };
});

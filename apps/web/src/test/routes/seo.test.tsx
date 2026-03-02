/**
 * seo.test.tsx
 *
 * Integration tests verifying that SEO metadata injected by the Seo component
 * correctly propagates to the document <head> during rendering.
 *
 * These tests validate the integration between the routes-metadata.ts
 * configuration and the Seo component from @modular-house/ui, ensuring that
 * title and meta description tags are correctly emitted for the Landing page.
 *
 * Test strategy:
 * - Render the Landing page wrapped in the same provider hierarchy used at
 *   runtime (HelmetProvider, HeaderProvider, BrowserRouter).
 * - Use the actual Seo component rather than a mock to test real behavior.
 * - Mock only the heavy UI components (Hero, Feature sections, etc.) to
 *   reduce test execution time and isolate the SEO injection logic.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import Landing from '../../routes/Landing';
import { BrowserRouter } from 'react-router-dom';
import { HeaderProvider } from '../../components/HeaderContext';
import { routesMetadata } from '../../routes-metadata';

/**
 * Mock heavy UI components to avoid rendering the full component tree.
 *
 * The Seo component is explicitly preserved (via spread of actual module)
 * because these tests verify its actual behavior — specifically, that it
 * injects the correct meta tags into the document head.
 */
vi.mock('@modular-house/ui', async () => {
  const actual = await vi.importActual('@modular-house/ui');
  return {
    ...actual,
    HeroWithSideText: () => <div data-testid="hero">Hero</div>,
    FeatureSection: () => <div data-testid="features">Features</div>,
    CustomIcons: () => <div data-testid="icons">Icons</div>,
    TwoColumnSplitLayout: () => <div data-testid="split">Split</div>,
    TestimonialGrid: () => <div data-testid="testimonials">Testimonials</div>,
    MiniFAQs: () => <div data-testid="faqs">FAQs</div>,
    ContactFormWithImageBg: () => <div data-testid="contact">Contact</div>,
    MasonryGallery: () => <div data-testid="gallery">Gallery</div>,
  };
});

/**
 * Resolve the homepage route metadata once during test module initialization.
 *
 * This mirrors the lookup performed by TemplateLayout at runtime. The
 * fail-fast guard below ensures the test suite aborts with a clear error
 * message if the route configuration is missing — preventing cryptic
 * undefined-reference failures during test execution.
 */
const homepageRoute = routesMetadata.find(r => r.path === '/');

if (!homepageRoute?.seo) {
  throw new Error(
    'Test fixture error: homepage route or its seo config is missing from routesMetadata. ' +
    'Verify that routes-metadata.ts defines a "/" route with a valid seo property.'
  );
}

// Safe reference after the guard above confirms non-nullity.
const homeSeo = homepageRoute.seo;

/**
 * SEO Integration test suite.
 *
 * Validates that the Seo component, when provided with route metadata,
 * correctly injects essential meta tags into the document <head>. These
 * tests confirm the contract between routes-metadata.ts and the Seo
 * component is honored at runtime.
 */
describe('SEO Integration', () => {
  /**
   * Reset all mocks after each test to prevent state leakage between tests.
   */
  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test case: Document title injection.
   *
   * Verifies that the Seo component appends the siteTitleSuffix to the
   * route's title and applies the result to document.title. This is
   * essential for tab identification and search engine result display.
   */
  it('updates document title on Landing page', async () => {
    // Dynamically import the Seo component to ensure the mock setup is applied.
    const { Seo } = await import('@modular-house/ui');

    render(
      <HelmetProvider>
        <HeaderProvider>
          <BrowserRouter>
            <Seo
              title={homeSeo.title}
              description={homeSeo.description}
              canonicalUrl={homeSeo.canonicalUrl}
              robots={homeSeo.robots}
              siteTitleSuffix=" | Modular House"
            />
            <Landing />
          </BrowserRouter>
        </HeaderProvider>
      </HelmetProvider>
    );

    // Wait for react-helmet-async to process side effects and update the DOM.
    await waitFor(() => {
      expect(document.title).toBe(`${homeSeo.title} | Modular House`);
    });
  });

  /**
   * Test case: Meta description injection.
   *
   * Verifies that the Seo component creates a <meta name="description">
   * element with the content attribute matching the route's description.
   * The meta description is a primary input for search engine snippets.
   */
  it('injects meta description', async () => {
    // Dynamically import the Seo component to ensure the mock setup is applied.
    const { Seo } = await import('@modular-house/ui');

    render(
      <HelmetProvider>
        <HeaderProvider>
          <BrowserRouter>
            <Seo
              title={homeSeo.title}
              description={homeSeo.description}
              canonicalUrl={homeSeo.canonicalUrl}
              robots={homeSeo.robots}
              siteTitleSuffix=" | Modular House"
            />
            <Landing />
          </BrowserRouter>
        </HeaderProvider>
      </HelmetProvider>
    );

    // Wait for react-helmet-async to process side effects and update the DOM.
    await waitFor(() => {
      // Query the DOM for the meta description element.
      const metaDescription = document.querySelector('meta[name="description"]');

      // Assert the element exists in the document.
      expect(metaDescription).toBeInTheDocument();

      // Assert the content attribute matches the configured description.
      expect(metaDescription).toHaveAttribute('content', homeSeo.description);
    });
  });
});

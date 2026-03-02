import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import Landing from '../../routes/Landing';
import { BrowserRouter } from 'react-router-dom';
import { HeaderProvider } from '../../components/HeaderContext';
import { routesMetadata } from '../../routes-metadata';

// Mock UI components to avoid rendering full tree, but keep Seo
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

// Resolve the homepage route metadata once (same lookup TemplateLayout performs).
const homepageRoute = routesMetadata.find(r => r.path === '/');
const homeSeo = homepageRoute!.seo!;

describe('SEO Integration', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('updates document title on Landing page', async () => {
    // Import the Seo component used by TemplateLayout at runtime
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

    await waitFor(() => {
      expect(document.title).toBe(`${homeSeo.title} | Modular House`);
    });
  });

  it('injects meta description', async () => {
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

    await waitFor(() => {
      const metaDescription = document.querySelector('meta[name="description"]');
      expect(metaDescription).toBeInTheDocument();
      expect(metaDescription).toHaveAttribute('content', homeSeo.description);
    });
  });
});

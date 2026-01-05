import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import Landing from '../../routes/Landing';
import { BrowserRouter } from 'react-router-dom';
import { HeaderProvider } from '../../components/HeaderContext';

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

describe('SEO Integration', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('updates document title on Landing page', async () => {
    render(
      <HelmetProvider>
        <HeaderProvider>
          <BrowserRouter>
            <Landing />
          </BrowserRouter>
        </HeaderProvider>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(document.title).toBe('Steel Frame Garden Rooms & House Extensions | Modular House');
    });
  });

  it('injects meta description', async () => {
    render(
      <HelmetProvider>
        <HeaderProvider>
          <BrowserRouter>
            <Landing />
          </BrowserRouter>
        </HeaderProvider>
      </HelmetProvider>
    );

    await waitFor(() => {
      const metaDescription = document.querySelector('meta[name="description"]');
      expect(metaDescription).toBeInTheDocument();
      expect(metaDescription).toHaveAttribute('content', 'Transform your home with precision steel frame garden rooms and extensions. Built in weeks, not months. Superior energy efficiency & turnkey delivery.');
    });
  });
});

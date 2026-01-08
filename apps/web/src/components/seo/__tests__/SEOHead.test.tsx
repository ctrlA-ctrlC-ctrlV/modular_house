import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { describe, it, expect, afterEach } from 'vitest';
import { SEOHead } from '../SEOHead';
import { SEOConfig } from '../../../types/seo';

/**
 * Unit tests for the SEOHead component.
 * Verifies that the correct metadata tags are injected into the document head.
 */
describe('SEOHead Component', () => {
  // Mock SEO configuration for testing
  const mockConfig: SEOConfig = {
    title: 'Test Page Title',
    description: 'This is a test description for the SEOHead component.',
    schema: [
      {
        type: 'WebPage',
        data: {
          name: 'Test Page',
        },
      },
    ],
  };

  /**
   * Helper to render the component wrapped in HelmetProvider.
   * HelmetProvider is required for react-helmet-async to work in tests.
   */
  const renderWithHelmet = (ui: React.ReactElement) => {
    return render(<HelmetProvider>{ui}</HelmetProvider>);
  };

  // Clean up document head after each test to prevent pollution
  afterEach(() => {
    document.title = '';
    
    // Remove description meta tags
    const metas = document.querySelectorAll('meta[name="description"]');
    metas.forEach(meta => meta.remove());

    // Remove JSON-LD scripts
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(script => script.remove());
  });

  it('renders the document title correctly without suffix', async () => {
    renderWithHelmet(<SEOHead config={mockConfig} />);
    
    // react-helmet-async updates the title asynchronously
    await waitFor(() => {
      expect(document.title).toBe(mockConfig.title);
    });
  });

  it('renders the document title correctly with suffix', async () => {
    const titleSuffix = ' | Site Name';
    renderWithHelmet(<SEOHead config={mockConfig} titleSuffix={titleSuffix} />);
    
    await waitFor(() => {
      expect(document.title).toBe(`${mockConfig.title}${titleSuffix}`);
    });
  });

  it('renders the meta description tag correctly', async () => {
    renderWithHelmet(<SEOHead config={mockConfig} />);
    
    await waitFor(() => {
      const metaDescription = document.querySelector('meta[name="description"]');
      expect(metaDescription).not.toBeNull();
      expect(metaDescription?.getAttribute('content')).toBe(mockConfig.description);
    });
  });

  it('renders structured data (JSON-LD) correctly', async () => {
    renderWithHelmet(<SEOHead config={mockConfig} />);
    
    await waitFor(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      expect(scripts.length).toBeGreaterThan(0);
      
      const scriptContent = JSON.parse(scripts[0].innerHTML);
      expect(scriptContent['@context']).toBe('https://schema.org');
      
      const firstSchema = mockConfig.schema?.[0];
      expect(firstSchema).toBeDefined();
      expect(scriptContent['@type']).toBe(firstSchema?.type);
      expect(scriptContent['name']).toBe(firstSchema?.data.name);
    });
  });

  it('does not render null schema if schema is undefined', async () => {
    const configWithoutSchema: SEOConfig = {
      title: 'No Schema',
      description: 'Description without schema',
    };

    renderWithHelmet(<SEOHead config={configWithoutSchema} />);
    
    await waitFor(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      expect(scripts.length).toBe(0);
    });
  });
});

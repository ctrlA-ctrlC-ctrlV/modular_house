import type { Meta, StoryObj } from '@storybook/react';
import { Seo, SeoProps } from './Seo';
import { HelmetProvider } from 'react-helmet-async';

/**
 * Storybook configuration for the Seo component.
 * * Note: This component does not render visible UI elements.
 * Its effects are observable in the document <head>.
 * A HelmetProvider is required in the decorator for the component to function correctly.
 */
const meta: Meta<typeof Seo> = {
  title: 'Components/Seo',
  component: Seo,
  decorators: [
    (Story) => (
      <HelmetProvider>
        <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
          <p>
            <strong>Note:</strong> The SEO component injects tags into the <code>&lt;head&gt;</code>.
            Inspect the document head or use the Storybook "Addons" panel to verify output.
          </p>
          <Story />
        </div>
      </HelmetProvider>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    title: { 
      control: 'text',
      description: 'The page title tag.' 
    },
    description: { 
      control: 'text',
      description: 'The page meta description.' 
    },
    robots: { 
      control: 'select', 
      options: ['index, follow', 'noindex, nofollow', 'noindex, follow'],
      description: 'Directives for search engine crawlers.'
    },
  },
};

export default meta;
type Story = StoryObj<SeoProps>;

/**
 * Default Home Page configuration.
 * Demonstrates standard homepage metadata with Open Graph image.
 */
export const HomePage: Story = {
  args: {
    title: 'Home',
    description: 'Rebar is a leading construction and renovation company delivering quality building solutions.',
    canonicalUrl: 'https://www.rebar-construction.com/',
    openGraph: {
      type: 'website',
      siteName: 'Rebar Construction',
      image: 'https://www.rebar-construction.com/og-home.jpg',
    },
    twitter: {
      cardType: 'summary_large_image',
      site: '@rebar_const',
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Rebar Construction',
      url: 'https://www.rebar-construction.com',
      logo: 'https://www.rebar-construction.com/logo.png',
    },
  },
};

/**
 * Blog Post configuration.
 * Demonstrates use of article-specific Open Graph types and JSON-LD for articles.
 */
export const BlogPost: Story = {
  args: {
    title: 'Top 10 Renovation Tips for 2024',
    description: 'Discover the essential renovation tips for the upcoming year to increase property value.',
    canonicalUrl: 'https://www.rebar-construction.com/blog/renovation-tips-2024',
    robots: 'index, follow',
    openGraph: {
      type: 'article',
      title: 'Top 10 Renovation Tips for 2024',
      description: 'Essential renovation tips to increase property value.',
      image: 'https://www.rebar-construction.com/blog/images/reno-2024.jpg',
    },
    twitter: {
      cardType: 'summary',
      creator: '@author_handle',
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Top 10 Renovation Tips for 2024',
      image: 'https://www.rebar-construction.com/blog/images/reno-2024.jpg',
      author: {
        '@type': 'Person',
        name: 'John Doe',
      },
    },
  },
};

/**
 * No Index configuration.
 * Used for pages like "Thank You", "404", or internal staging pages.
 */
export const HiddenPage: Story = {
  args: {
    title: 'Internal Staging Page',
    description: 'This page should not appear in search results.',
    robots: 'noindex, nofollow',
  },
};
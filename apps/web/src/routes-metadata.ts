import { RouteMetadata } from './types/seo';

/**
 * Metadata for all public application routes.
 * Defines the path and SEO/Sitemap configuration for each page.
 * Separated from route-config.tsx to allow import in Node.js scripts (sitemap generator) without React dependencies.
 */
export const routesMetadata: RouteMetadata[] = [
  {
    path: '/',
    seo: {
      title: 'Modular House Extensions & Garden Rooms',
      description: 'Transform your home with premium modular house extensions and garden rooms. Modern design, sustainable materials, and fast installation.',
    },
    sitemap: {
      priority: 1.0,
      changefreq: 'weekly'
    }
  },
  {
    path: '/garden-room',
    seo: {
      title: 'Garden Rooms & Studios',
      description: 'Custom garden rooms, offices, and studios. Create your perfect outdoor living space with our insulated and durable modular designs.',
    },
    sitemap: {
      priority: 0.9,
      changefreq: 'weekly'
    }
  },
  {
    path: '/house-extension',
    seo: {
      title: 'Modular House Extensions',
      description: 'Expand your living space with a high-quality modular extension. Minimal disruption, cost-effective, and architecturally stunning.',
    },
    sitemap: {
      priority: 0.9,
      changefreq: 'weekly'
    }
  },
  {
    path: '/gallery',
    seo: {
      title: 'Project Gallery',
      description: 'Explore our portfolio of completed garden rooms and house extensions. See our modern designs and quality craftsmanship in action.',
    },
    sitemap: {
      priority: 0.8,
      changefreq: 'monthly'
    }
  },
  {
    path: '/about',
    seo: {
      title: 'About Us',
      description: 'Learn about our mission to revolutionize home expansion with sustainable, modular construction technology.',
    },
    sitemap: {
      priority: 0.7,
      changefreq: 'monthly'
    }
  },
  {
    path: '/contact',
    seo: {
      title: 'Contact Us',
      description: 'Get in touch for a free consultation. Discuss your garden room or extension project with our expert team today.',
    },
    sitemap: {
      priority: 0.8,
      changefreq: 'monthly'
    }
  },
  {
    path: '/privacy',
    seo: {
      title: 'Privacy Policy',
      description: 'Our commitment to protecting your privacy and personal data.',
    },
    sitemap: {
      priority: 0.1,
      changefreq: 'yearly'
    }
  },
  {
    path: '/terms',
    seo: {
      title: 'Terms & Conditions',
      description: 'Terms and conditions for using our website and services.',
    },
    sitemap: {
      priority: 0.1,
      changefreq: 'yearly'
    }
  },
  {
    path: '*', // Catch-all path
    seo: {
      title: 'Page Not Found',
      description: 'The page you are looking for does not exist.',
    },
    sitemap: {
       // Usually excluded from sitemap, but typed here for consistency
       priority: 0,
       changefreq: 'yearly'
    }
  }
];

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
      description: 'Transform your home into modular home. With premium modular house extensions and garden rooms. Modern design, sustainable materials, and fast installation.',
      schema: [
        {
          type: 'Organization',
          data: {
            name: 'Modular House',
            url: 'https://modularhouse.ie',
            logo: 'https://modularhouse.ie/logo_black.png', // Placeholder
            sameAs: [
              'https://www.facebook.com/p/Sdeal-Ltd-61574559341381/',
              'https://www.tiktok.com/@modularhouse.ie'
            ]
          }
        }
      ]
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
      description: 'Bespoke garden rooms, offices, studios, and home gym. Create your perfect outdoor living space with our insulated and durable modular designs.',
      schema: [
        {
          type: 'Product',
          data: {
            name: 'Garden Room',
            description: 'Bespoke garden rooms, offices, studios, and home gym.',
            brand: {
              '@type': 'Brand',
              name: 'Modular House'
            },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'EUR',
              availability: 'https://schema.org/InStock',
              lowPrice: '35000',
              highPrice: '110000'
            }
          }
        }
      ]
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
      schema: [
        {
          type: 'Product', // Using Product as per Task T020, though Service could also apply
          data: {
            name: 'Modular House Extension',
            description: 'Expand your living space with a high-quality modular extension.',
            brand: {
              '@type': 'Brand',
              name: 'Modular House'
            },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'EUR',
              availability: 'https://schema.org/InStock',
              lowPrice: '35000', // Starting price placeholder
              highPrice: '75000'
            }
          }
        }
      ]
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
      description: 'Don\'t be a stranger! Get in touch for a free consultation. Discuss your garden room or extension project with our expert team today.',
      schema: [
        {
          type: 'LocalBusiness',
          data: {
            name: 'Modular House',
            image: 'https://modularhouse.ie/logo.png',
            telephone: '+3530830280000',
            email: 'info@modularhouse.ie',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Unit 8, Finches Business Park',
              addressLocality: 'Dublin 22',
              addressCountry: 'Ireland'
            },
            openingHoursSpecification: [
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday'
                ],
                opens: '09:00',
                closes: '17:00'
              }
            ]
          }
        }
      ]
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

/**
 * routes-metadata.ts
 *
 * Single source of truth for all public route SEO and sitemap configuration.
 *
 * This module is shared across two execution contexts:
 * - Browser bundle: imported by TemplateLayout to inject <head> metadata at
 *   runtime and during SSR prerendering.
 * - Node.js build scripts: imported by the sitemap generator and prerender
 *   script, which read path and sitemap values without touching React.
 *
 * Design rules:
 * - No React imports. No JSX. No DOM references.
 * - All schema data is expressed as plain SchemaDef objects; the TemplateLayout
 *   component is responsible for assembling them into a @graph block.
 * - The BUILD_TIMESTAMP import from prerender.ts is the single authoritative
 *   timestamp for the entire build. All freshness signals — sitemap <lastmod>,
 *   WebPage.dateModified, WebPage.datePublished, og:article:modified_time —
 *   must reference this value so every artifact carries an identical timestamp.
 *
 * Open-Closed Principle: add new routes by appending entries to the
 * routesMetadata array. Existing entries are unaffected by additions.
 */

import { BUILD_TIMESTAMP } from './build-timestamp';
import { generatePageSchema, generateWebSiteSchema } from './utils/schema-generators';
import { RouteMetadata } from './types/seo';

/**
 * Metadata for all public application routes.
 *
 * Each entry provides the route path, SEO configuration (title, description,
 * canonical URL, robots directive, Open Graph, Twitter Card, and JSON-LD
 * schema nodes), and sitemap configuration (priority, changefreq).
 *
 * Routes are ordered by sitemap priority (descending) so the most important
 * pages appear first in iteration order, which improves readability of the
 * generated sitemap.xml.
 */
export const routesMetadata: RouteMetadata[] = [
  // ---------------------------------------------------------------------------
  // Homepage — highest priority; full social + structured data coverage
  // ---------------------------------------------------------------------------
  {
    path: '/',
    seo: {
      title: 'Modular House Extensions & Garden Rooms',
      description: 'Transform your home into modular home. With premium modular house extensions and garden rooms. Modern design, sustainable materials, and fast installation.',
      canonicalUrl: 'https://modularhouse.ie/',

      /**
       * Extended robots directive for high-value pages.
       * max-image-preview:large — allows search engines to display large image
       *   previews in results, improving click-through rate.
       * max-snippet:-1 — no limit on the length of the search result snippet.
       * max-video-preview:-1 — no limit on video preview duration.
       */
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',

      openGraph: {
        type: 'website',
        title: 'Steel Frame Garden Rooms & House Extensions | Modular House',
        description: 'Transform your home into modular home. With premium modular house extensions and garden rooms. Modern design, sustainable materials, and fast installation.',
        image: 'https://modularhouse.ie/resource/landing_hero.png',
        imageWidth: 1200,
        imageHeight: 630,
        imageType: 'image/png',
        url: 'https://modularhouse.ie/',
        siteName: 'Modular House Construction',
        // article:modified_time freshness signal — identical to the build
        // timestamp used in WebPage.dateModified and sitemap <lastmod>.
        article_modified_time: BUILD_TIMESTAMP,
      },

      twitter: {
        cardType: 'summary_large_image',
        site: '@ModularHouse',
        title: 'Steel Frame Garden Rooms & House Extensions',
        image: 'https://modularhouse.ie/resource/landing_hero.png',
        imageAlt: 'Steel frame modular house garden room exterior',
      },

      schema: [
        // ------------------------------------------------------------------
        // Organization schema
        // Merged from the inline organizationSchema in Landing.tsx (which is
        // removed in T016) and the prior routes-metadata.ts entry. The
        // contactPoint and sameAs arrays are combined into a single node.
        // ------------------------------------------------------------------
        {
          type: 'Organization',
          data: {
            name: 'Modular House Construction',
            url: 'https://modularhouse.ie',
            logo: 'https://modularhouse.ie/logo_black.png',
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+3530830280000',
              contactType: 'Customer Service',
            },
            sameAs: [
              'https://www.facebook.com/p/Sdeal-Ltd-61574559341381/',
              'https://www.tiktok.com/@modularhouse.ie',
            ],
          },
        },

        // ------------------------------------------------------------------
        // WebSite schema with SearchAction
        // Emitted on the homepage only. Enables Google's Sitelinks Search Box
        // for branded queries and signals the canonical site identity.
        // ------------------------------------------------------------------
        generateWebSiteSchema(),

        // ------------------------------------------------------------------
        // WebPage + BreadcrumbList schemas
        // Generated for the homepage path. The spread operator flattens the
        // two-element array returned by generatePageSchema into this schema
        // array so the @graph is flat (no nested arrays).
        // ------------------------------------------------------------------
        ...generatePageSchema(
          '/',
          'Modular House Extensions & Garden Rooms',
          'Transform your home into modular home. With premium modular house extensions and garden rooms. Modern design, sustainable materials, and fast installation.',
          BUILD_TIMESTAMP
        ),

        // ------------------------------------------------------------------
        // FAQPage schema
        // The question and answer text below is copied verbatim from the
        // MiniFAQs component props in Landing.tsx. The schema text MUST be
        // identical to the visible page text — paraphrasing invalidates the
        // Google Rich Results eligibility for FAQ rich results.
        // ------------------------------------------------------------------
        {
          type: 'FAQPage',
          data: {
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Why choose Steel Frame over timber or block?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Steel is faster, stronger, and more precise. It builds roughly 30% faster than traditional methods, will never rot, warp, or twist, and offers superior thermal values, keeping your space warm and energy bills low.',
                },
              },
              {
                '@type': 'Question',
                name: 'Do I need planning permission?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Most of our projects are \u201cExempted Developments\u201d and do not require planning permission. This typically applies to Garden Rooms under 25m\u00b2 and single-story rear extensions under 40m\u00b2, provided the roof height does not exceed 2.5m. We will confirm your specific compliance during our initial site survey.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is my build guaranteed?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. We provide a comprehensive 50-year structural warranty on our steel frames. Because steel is inorganic and durable, you can be confident your investment is protected against the elements for decades.',
                },
              },
            ],
          },
        },
      ],
    },
    sitemap: {
      priority: 1.0,
      changefreq: 'weekly',
    },
  },

  // ---------------------------------------------------------------------------
  // Garden Room — primary product page; full social + structured data coverage
  // ---------------------------------------------------------------------------
  {
    path: '/garden-room',
    seo: {
      title: 'Garden Rooms & Studios',
      description: 'Bespoke garden rooms, offices, studios, and home gym. Create your perfect outdoor living space with our insulated and durable modular designs.',
      canonicalUrl: 'https://modularhouse.ie/garden-room',
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',

      openGraph: {
        type: 'website',
        title: 'Garden Rooms & Studios | Modular House',
        description: 'Bespoke garden rooms, offices, studios, and home gym. Create your perfect outdoor living space with our insulated and durable modular designs.',
        image: 'https://modularhouse.ie/resource/garden-room-hero.jpg',
        imageWidth: 1200,
        imageHeight: 630,
        imageType: 'image/jpeg',
        url: 'https://modularhouse.ie/garden-room',
        siteName: 'Modular House Construction',
        article_modified_time: BUILD_TIMESTAMP,
      },

      twitter: {
        cardType: 'summary_large_image',
        site: '@ModularHouse',
        title: 'Garden Rooms & Studios | Modular House',
        image: 'https://modularhouse.ie/resource/garden-room-hero.jpg',
        imageAlt: 'Steel frame garden room exterior',
      },

      schema: [
        // Existing Product schema — retained from the prior routes-metadata.ts entry.
        {
          type: 'Product',
          data: {
            name: 'Garden Room',
            description: 'Bespoke garden rooms, offices, studios, and home gym.',
            brand: {
              '@type': 'Brand',
              name: 'Modular House',
            },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'EUR',
              availability: 'https://schema.org/InStock',
              lowPrice: '35000',
              highPrice: '110000',
            },
          },
        },

        // WebPage + BreadcrumbList schemas for this route.
        ...generatePageSchema(
          '/garden-room',
          'Garden Rooms & Studios',
          'Bespoke garden rooms, offices, studios, and home gym. Create your perfect outdoor living space with our insulated and durable modular designs.',
          BUILD_TIMESTAMP
        ),
      ],
    },
    sitemap: {
      priority: 0.9,
      changefreq: 'weekly',
    },
  },

  // ---------------------------------------------------------------------------
  // House Extension — primary product page; full social + structured data coverage
  // ---------------------------------------------------------------------------
  {
    path: '/house-extension',
    seo: {
      title: 'Modular House Extensions',
      description: 'Expand your living space with a high-quality modular extension. Minimal disruption, cost-effective, and architecturally stunning.',
      canonicalUrl: 'https://modularhouse.ie/house-extension',
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',

      openGraph: {
        type: 'website',
        title: 'House Extensions | Modular House',
        description: 'Expand your living space with a high-quality modular extension. Minimal disruption, cost-effective, and architecturally stunning.',
        image: 'https://modularhouse.ie/resource/house-extension-hero.jpg',
        imageWidth: 1200,
        imageHeight: 630,
        imageType: 'image/jpeg',
        url: 'https://modularhouse.ie/house-extension',
        siteName: 'Modular House Construction',
        article_modified_time: BUILD_TIMESTAMP,
      },

      twitter: {
        cardType: 'summary_large_image',
        site: '@ModularHouse',
        title: 'House Extensions | Modular House',
        image: 'https://modularhouse.ie/resource/house-extension-hero.jpg',
        imageAlt: 'Steel frame house extension exterior',
      },

      schema: [
        // Existing Product schema — retained from the prior routes-metadata.ts entry.
        {
          type: 'Product',
          data: {
            name: 'Modular House Extension',
            description: 'Expand your living space with a high-quality modular extension.',
            brand: {
              '@type': 'Brand',
              name: 'Modular House',
            },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'EUR',
              availability: 'https://schema.org/InStock',
              lowPrice: '35000',
              highPrice: '75000',
            },
          },
        },

        // WebPage + BreadcrumbList schemas for this route.
        ...generatePageSchema(
          '/house-extension',
          'Modular House Extensions',
          'Expand your living space with a high-quality modular extension. Minimal disruption, cost-effective, and architecturally stunning.',
          BUILD_TIMESTAMP
        ),
      ],
    },
    sitemap: {
      priority: 0.9,
      changefreq: 'weekly',
    },
  },

  // ---------------------------------------------------------------------------
  // Gallery — portfolio page; full social coverage; landing hero as OG image fallback
  // ---------------------------------------------------------------------------
  {
    path: '/gallery',
    seo: {
      title: 'Project Gallery',
      description: 'Explore our portfolio of completed garden rooms and house extensions. See our modern designs and quality craftsmanship in action.',
      canonicalUrl: 'https://modularhouse.ie/gallery',
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',

      openGraph: {
        type: 'website',
        title: 'Project Gallery | Modular House',
        description: 'Explore our portfolio of completed garden rooms and house extensions. See our modern designs and quality craftsmanship in action.',
        // The landing hero image is used as a fallback OG image for pages that
        // do not have a dedicated hero asset. It meets the 1200x630 minimum
        // recommended by Facebook and LinkedIn for summary_large_image cards.
        image: 'https://modularhouse.ie/resource/landing_hero.png',
        imageWidth: 1200,
        imageHeight: 630,
        imageType: 'image/png',
        url: 'https://modularhouse.ie/gallery',
        siteName: 'Modular House Construction',
        article_modified_time: BUILD_TIMESTAMP,
      },

      twitter: {
        cardType: 'summary_large_image',
        site: '@ModularHouse',
        title: 'Project Gallery | Modular House',
        image: 'https://modularhouse.ie/resource/landing_hero.png',
        imageAlt: 'Modular house construction gallery',
      },

      schema: [
        // WebPage + BreadcrumbList schemas for this route.
        ...generatePageSchema(
          '/gallery',
          'Project Gallery',
          'Explore our portfolio of completed garden rooms and house extensions. See our modern designs and quality craftsmanship in action.',
          BUILD_TIMESTAMP
        ),
      ],
    },
    sitemap: {
      priority: 0.8,
      changefreq: 'monthly',
    },
  },

  // ---------------------------------------------------------------------------
  // Contact — high-value conversion page; full social + LocalBusiness schema
  // ---------------------------------------------------------------------------
  {
    path: '/contact',
    seo: {
      title: 'Contact Us',
      description: 'Don\'t be a stranger! Get in touch for a free consultation. Discuss your garden room or extension project with our expert team today.',
      canonicalUrl: 'https://modularhouse.ie/contact',
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',

      openGraph: {
        type: 'website',
        title: 'Contact Us | Modular House',
        description: 'Don\'t be a stranger! Get in touch for a free consultation. Discuss your garden room or extension project with our expert team today.',
        image: 'https://modularhouse.ie/resource/landing_hero.png',
        imageWidth: 1200,
        imageHeight: 630,
        imageType: 'image/png',
        url: 'https://modularhouse.ie/contact',
        siteName: 'Modular House Construction',
        article_modified_time: BUILD_TIMESTAMP,
      },

      twitter: {
        cardType: 'summary_large_image',
        site: '@ModularHouse',
        title: 'Contact Us | Modular House',
        image: 'https://modularhouse.ie/resource/landing_hero.png',
        imageAlt: 'Contact Modular House',
      },

      schema: [
        // Existing LocalBusiness schema — retained from the prior routes-metadata.ts entry.
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
              addressCountry: 'Ireland',
            },
            openingHoursSpecification: [
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                ],
                opens: '09:00',
                closes: '17:00',
              },
            ],
          },
        },

        // WebPage + BreadcrumbList schemas for this route.
        ...generatePageSchema(
          '/contact',
          'Contact Us',
          'Don\'t be a stranger! Get in touch for a free consultation. Discuss your garden room or extension project with our expert team today.',
          BUILD_TIMESTAMP
        ),
      ],
    },
    sitemap: {
      priority: 0.8,
      changefreq: 'monthly',
    },
  },

  // ---------------------------------------------------------------------------
  // About — brand page; full social coverage
  // ---------------------------------------------------------------------------
  {
    path: '/about',
    seo: {
      title: 'About Us',
      description: 'Learn about our mission to revolutionize home expansion with sustainable, modular construction technology.',
      canonicalUrl: 'https://modularhouse.ie/about',
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',

      openGraph: {
        type: 'website',
        title: 'About Us | Modular House',
        description: 'Learn about our mission to revolutionize home expansion with sustainable, modular construction technology.',
        image: 'https://modularhouse.ie/resource/landing_hero.png',
        imageWidth: 1200,
        imageHeight: 630,
        imageType: 'image/png',
        url: 'https://modularhouse.ie/about',
        siteName: 'Modular House Construction',
        article_modified_time: BUILD_TIMESTAMP,
      },

      twitter: {
        cardType: 'summary_large_image',
        site: '@ModularHouse',
        title: 'About Us | Modular House',
        image: 'https://modularhouse.ie/resource/landing_hero.png',
        imageAlt: 'Modular House team and office',
      },

      schema: [
        // WebPage + BreadcrumbList schemas for this route.
        ...generatePageSchema(
          '/about',
          'About Us',
          'Learn about our mission to revolutionize home expansion with sustainable, modular construction technology.',
          BUILD_TIMESTAMP
        ),
      ],
    },
    sitemap: {
      priority: 0.7,
      changefreq: 'monthly',
    },
  },

  // ---------------------------------------------------------------------------
  // Privacy Policy — legal page; canonical only; no social or schema enrichment
  // ---------------------------------------------------------------------------
  {
    path: '/privacy',
    seo: {
      title: 'Privacy Policy',
      description: 'Our commitment to protecting your privacy and personal data.',
      canonicalUrl: 'https://modularhouse.ie/privacy',
      // Legal pages use the minimal robots directive — they are indexable but
      // do not benefit from the extended preview directives used on product pages.
      robots: 'index, follow',
      // No openGraph, no twitter, no schema — intentional per spec.
    },
    sitemap: {
      priority: 0.1,
      changefreq: 'yearly',
    },
  },

  // ---------------------------------------------------------------------------
  // Terms & Conditions — legal page; canonical only; no social or schema enrichment
  // ---------------------------------------------------------------------------
  {
    path: '/terms',
    seo: {
      title: 'Terms & Conditions',
      description: 'Terms and conditions for using our website and services.',
      canonicalUrl: 'https://modularhouse.ie/terms',
      robots: 'index, follow',
      // No openGraph, no twitter, no schema — intentional per spec.
    },
    sitemap: {
      priority: 0.1,
      changefreq: 'yearly',
    },
  },

  // ---------------------------------------------------------------------------
  // 404 catch-all — not pre-rendered as a static page; excluded from sitemap
  // ---------------------------------------------------------------------------
  {
    path: '*',
    seo: {
      title: 'Page Not Found',
      description: 'The page you are looking for does not exist.',
    },
    sitemap: {
      // Excluded from sitemap generation — catch-all routes have no defined URL.
      priority: 0,
      changefreq: 'yearly',
    },
  },
];

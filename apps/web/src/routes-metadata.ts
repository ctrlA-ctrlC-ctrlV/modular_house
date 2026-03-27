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
      title: 'Modular Garden Rooms & House Extensions',
      description: 'Transform your home into modular home. With premium modular house extensions and garden rooms. Modern design, sustainable materials, and fast installation.',
      /**
       * Homepage canonical URL without trailing slash.
       * While the root URL traditionally accepts a trailing slash, this
       * project enforces a site-wide no-trailing-slash convention for
       * consistency. Search engines treat both formats equivalently for
       * the domain root, so this choice does not affect SEO.
       */
      canonicalUrl: 'https://modularhouse.ie',

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
        // landing_hero.jpg is the deployed JPEG; the .png variant does not
        // exist in public/resource. Social crawlers (LinkedIn, Twitter/X)
        // fetch this URL directly, so it must resolve to a real file.
        image: 'https://modularhouse.ie/resource/landing_hero.jpg',
        imageWidth: 1200,
        imageHeight: 630,
        imageType: 'image/jpeg',
        // og:url matches the canonical URL format (no trailing slash)
        url: 'https://modularhouse.ie',
        siteName: 'Modular House Construction',
        // article:modified_time freshness signal — identical to the build
        // timestamp used in WebPage.dateModified and sitemap <lastmod>.
        article_modified_time: BUILD_TIMESTAMP,
      },

      twitter: {
        cardType: 'summary_large_image',
        site: '@ModularHouse',
        title: 'Steel Frame Garden Rooms & House Extensions',
        image: 'https://modularhouse.ie/resource/landing_hero.jpg',
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
                  // The quote characters and superscript-2 glyphs below are
                  // intentionally copied verbatim from the Landing.tsx MiniFAQs
                  // description prop. Google's FAQPage validator compares the
                  // schema text against the visible rendered text byte-for-byte;
                  // substituting typographic curly quotes or Unicode escapes for
                  // the source characters would fail that validation check.
                  text: 'Most of our projects are "Exempted Developments" and do not require planning permission. This typically applies to Garden Rooms under 25m² and single-story rear extensions under 40m², provided the roof height does not exceed 2.5m. We will confirm your specific compliance during our initial site survey.',
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
  // SEO-optimised title (under 70 chars) and description (under 160 chars)
  // targeting "garden rooms Ireland" and size-specific long-tail queries.
  // ---------------------------------------------------------------------------
  {
    path: '/garden-room',
    seo: {
      title: 'Garden Rooms Ireland | Steel Frame from 15m\u00B2 to 45m\u00B2',
      description: 'Premium steel-frame garden rooms in 15m\u00B2, 25m\u00B2, 35m\u00B2 & 45m\u00B2 sizes. No planning permission needed up to 25m\u00B2. Built in Dublin. Free quote.',
      canonicalUrl: 'https://modularhouse.ie/garden-room',
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',

      openGraph: {
        type: 'website',
        title: 'Garden Rooms Ireland | Steel Frame from 15m\u00B2 to 45m\u00B2',
        description: 'Premium steel-frame garden rooms in 15m\u00B2, 25m\u00B2, 35m\u00B2 & 45m\u00B2 sizes. No planning permission needed up to 25m\u00B2. Built in Dublin. Free quote.',
        // garden_room_hero.png is the deployed file (underscore separator, .png
        // extension). The hyphenated .jpg variant referenced in the original
        // spec does not exist in public/resource.
        image: 'https://modularhouse.ie/resource/garden_room_hero.png',
        imageWidth: 1200,
        imageHeight: 630,
        imageType: 'image/png',
        url: 'https://modularhouse.ie/garden-room',
        siteName: 'Modular House Construction',
        article_modified_time: BUILD_TIMESTAMP,
      },

      twitter: {
        cardType: 'summary_large_image',
        site: '@ModularHouse',
        title: 'Garden Rooms Ireland | Steel Frame from 15m\u00B2 to 45m\u00B2',
        description: 'Premium steel-frame garden rooms in 15m\u00B2, 25m\u00B2, 35m\u00B2 & 45m\u00B2 sizes. No planning permission needed up to 25m\u00B2. Built in Dublin. Free quote.',
        image: 'https://modularhouse.ie/resource/garden_room_hero.png',
        imageAlt: 'Steel frame garden room exterior',
      },

      schema: [
        // ------------------------------------------------------------------
        // Product Schema with Offer Pricing
        // ------------------------------------------------------------------
        // Each offer represents a distinct garden room size with its
        // corresponding base price. The `price` property is REQUIRED by
        // Google Search Console for Product rich results eligibility.
        //
        // PRICING SOURCE:
        // Base prices are derived from PRODUCT_SHOWCASE_PRODUCTS in
        // data/garden-room-data.ts. Any price update must be synchronised
        // between both files to maintain consistency across the UI and
        // structured data markup.
        //
        // AVAILABILITY VALUES (Schema.org ItemAvailability enumeration):
        //   - InStock    : 15m² and 25m² models (currently available)
        //   - PreOrder   : 35m² and 45m² models (pending legislation)
        //
        // URL STRUCTURE:
        // Each offer URL directs to the contact page with the product
        // query parameter pre-filled, matching the CTA links rendered
        // by the ProductRangeGrid component on the page.
        // ------------------------------------------------------------------
        {
          type: 'Product',
          data: {
            name: 'Garden Room',
            description: 'Premium steel-frame garden rooms in 15m\u00B2, 25m\u00B2, 35m\u00B2 & 45m\u00B2 sizes. No planning permission needed up to 25m\u00B2. Built in Dublin.',
            // IMAGE PROPERTY (REQUIRED)
            // Google Search Console requires an image for Product rich results.
            // This URL matches the Open Graph image used for social sharing.
            image: 'https://modularhouse.ie/resource/garden_room_hero.png',
            brand: {
              '@type': 'Brand',
              name: 'Modular House',
            },
            offers: [
              {
                '@type': 'Offer',
                name: '15m\u00B2 Compact Studio',
                price: '26000',
                priceCurrency: 'EUR',
                availability: 'https://schema.org/InStock',
                url: 'https://modularhouse.ie/contact?product=garden-room-15',
              },
              {
                '@type': 'Offer',
                name: '25m\u00B2 Garden Suite',
                price: '37000',
                priceCurrency: 'EUR',
                availability: 'https://schema.org/InStock',
                url: 'https://modularhouse.ie/contact?product=garden-room-25',
              },
              {
                '@type': 'Offer',
                name: '35m\u00B2 Garden Living',
                price: '65000',
                priceCurrency: 'EUR',
                availability: 'https://schema.org/PreOrder',
                url: 'https://modularhouse.ie/contact?product=garden-room-35&interest=true',
              },
              {
                '@type': 'Offer',
                name: '45m\u00B2 Grand Studio',
                price: '76000',
                priceCurrency: 'EUR',
                availability: 'https://schema.org/PreOrder',
                url: 'https://modularhouse.ie/contact?product=garden-room-45&interest=true',
              },
            ],
          },
        },

        // ------------------------------------------------------------------
        // FAQPage schema
        // ------------------------------------------------------------------
        // The question and answer text below is copied verbatim from the
        // GARDEN_ROOM_FAQS constant in data/garden-room-data.ts. The data
        // is inlined here (rather than imported) because this file is shared
        // across both the browser bundle and Node.js build scripts via
        // tsconfig.node.json, which cannot resolve React-dependent modules.
        //
        // IMPORTANT: The schema text MUST remain byte-identical to the
        // visible page content rendered by the AccordionFAQ component.
        // Google's FAQPage Rich Results validator compares structured data
        // against the on-page text; any divergence invalidates eligibility.
        // When updating FAQ content, change both garden-room-data.ts AND
        // this inlined copy simultaneously.
        // ------------------------------------------------------------------
        {
          type: 'FAQPage',
          data: {
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Do I need planning permission for a garden room?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Under current Irish planning legislation, garden rooms up to 25 square metres are generally exempt from planning permission, provided they comply with conditions such as maximum height (4 m for a pitched roof, 3 m for a flat roof), boundary setbacks, and aggregate floor area limits for exempted structures. Our 15 and 25 square metre models fall within these thresholds. The 35 and 45 square metre sizes are subject to pending legislation that may extend the exemption limit. We handle all planning paperwork on your behalf.',
                },
              },
              {
                '@type': 'Question',
                name: 'How long does it take to build a garden room?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'From order confirmation to handover, a typical Modular House garden room takes 6 to 8 weeks. This includes 1 to 2 weeks of off-site steel frame fabrication, 1 week of foundation preparation, and 4 to 5 weeks of on-site assembly, insulation, and interior finishing. Actual timelines may vary based on site conditions and chosen specification.',
                },
              },
              {
                '@type': 'Question',
                name: 'What sizes of garden rooms do you offer?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'We currently offer four standard sizes: 15 square metres (Compact Studio), 25 square metres (Garden Suite), 35 square metres (Garden Living), and 45 square metres (Grand Studio). Each model can be customised with different layouts, window configurations, and interior finishes to suit your specific needs.',
                },
              },
              {
                '@type': 'Question',
                name: 'How is the garden room insulated and heated?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Every garden room features high-performance PIR insulation panels in the walls, floor, and roof, achieving an A-rated BER (Building Energy Rating). Triple-glazed, thermally broken windows and doors minimise heat loss. Heating options include electric underfloor heating, wall-mounted panel heaters, or connection to your home heating system via an insulated supply pipe.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can I use the garden room as a home office year-round?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Our steel-frame construction combined with A-rated insulation, triple glazing, and integrated heating maintains a comfortable working temperature throughout all four seasons. The structures are designed to the same thermal performance standards as a permanent dwelling, ensuring year-round comfort whether used as a home office, studio, or living space.',
                },
              },
              {
                '@type': 'Question',
                name: 'What is included in the price?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'The quoted price includes the precision-cut steel frame, full PIR insulation, external cladding, internal plasterboard lining, laminate or tile flooring, electrical wiring with LED lighting and sockets, triple-glazed windows and doors, and a 10-year structural warranty. Foundation works, plumbing, and bespoke upgrades (such as underfloor heating or additional power circuits) are quoted separately based on site requirements.',
                },
              },
            ],
          },
        },

        // WebPage + BreadcrumbList schemas for this route.
        ...generatePageSchema(
          '/garden-room',
          'Garden Rooms Ireland | Steel Frame from 15m\u00B2 to 45m\u00B2',
          'Premium steel-frame garden rooms in 15m\u00B2, 25m\u00B2, 35m\u00B2 & 45m\u00B2 sizes. No planning permission needed up to 25m\u00B2. Built in Dublin. Free quote.',
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
        // hosue-extension1.png is the only available house-extension image in
        // public/resource/house-extension/. Note the filename contains a typo
        // ("hosue") — the reference below matches the actual deployed filename
        // exactly. Rename the source file to correct the typo when convenient.
        image: 'https://modularhouse.ie/resource/house-extension/hosue-extension1.png',
        imageWidth: 1200,
        imageHeight: 630,
        imageType: 'image/png',
        url: 'https://modularhouse.ie/house-extension',
        siteName: 'Modular House Construction',
        article_modified_time: BUILD_TIMESTAMP,
      },

      twitter: {
        cardType: 'summary_large_image',
        site: '@ModularHouse',
        title: 'House Extensions | Modular House',
        image: 'https://modularhouse.ie/resource/house-extension/hosue-extension1.png',
        imageAlt: 'Steel frame house extension exterior',
      },

      schema: [
        // ------------------------------------------------------------------
        // Product Schema with AggregateOffer Pricing
        // ------------------------------------------------------------------
        // House extensions use variable pricing based on project scope,
        // so AggregateOffer with lowPrice/highPrice is the appropriate
        // schema type. This differs from the garden-room page which uses
        // individual Offer entries with fixed prices for each size.
        //
        // GOOGLE RICH RESULTS REQUIREMENT:
        // Either `price` or `priceSpecification.price` must be specified
        // within offers. For price ranges, AggregateOffer with lowPrice
        // and highPrice satisfies this requirement.
        //
        // PRICE RANGE:
        // EUR 35,000 to 75,000 reflects typical project costs. Update
        // these values when pricing changes to maintain search result
        // accuracy.
        // ------------------------------------------------------------------
        {
          type: 'Product',
          data: {
            name: 'Modular House Extension',
            description: 'Expand your living space with a high-quality modular extension.',
            // IMAGE PROPERTY (REQUIRED)
            // Google Search Console requires an image for Product rich results.
            // This URL matches the Open Graph image used for social sharing.
            image: 'https://modularhouse.ie/resource/house-extension/hosue-extension1.png',
            brand: {
              '@type': 'Brand',
              name: 'Modular House',
            },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'EUR',
              availability: 'https://schema.org/InStock',
              lowPrice: '35000',
              highPrice: '75000',
              offerCount: 1,
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
        // landing_hero.jpg is used as the fallback OG image for pages that do
        // not have a dedicated hero asset. It meets the 1200x630 minimum size
        // recommended by Facebook and LinkedIn for summary_large_image cards.
        // Note: landing_hero.png does not exist in public/resource; .jpg is the
        // deployed format.
        image: 'https://modularhouse.ie/resource/landing_hero.jpg',
        imageWidth: 1200,
        imageHeight: 630,
        imageType: 'image/jpeg',
        url: 'https://modularhouse.ie/gallery',
        siteName: 'Modular House Construction',
        article_modified_time: BUILD_TIMESTAMP,
      },

      twitter: {
        cardType: 'summary_large_image',
        site: '@ModularHouse',
        title: 'Project Gallery | Modular House',
        image: 'https://modularhouse.ie/resource/landing_hero.jpg',
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
        // landing_hero.jpg is the deployed JPEG; landing_hero.png does not
        // exist in public/resource.
        image: 'https://modularhouse.ie/resource/landing_hero.jpg',
        imageWidth: 1200,
        imageHeight: 630,
        imageType: 'image/jpeg',
        url: 'https://modularhouse.ie/contact',
        siteName: 'Modular House Construction',
        article_modified_time: BUILD_TIMESTAMP,
      },

      twitter: {
        cardType: 'summary_large_image',
        site: '@ModularHouse',
        title: 'Contact Us | Modular House',
        image: 'https://modularhouse.ie/resource/landing_hero.jpg',
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
        // landing_hero.jpg is the deployed JPEG; landing_hero.png does not
        // exist in public/resource.
        image: 'https://modularhouse.ie/resource/landing_hero.jpg',
        imageWidth: 1200,
        imageHeight: 630,
        imageType: 'image/jpeg',
        url: 'https://modularhouse.ie/about',
        siteName: 'Modular House Construction',
        article_modified_time: BUILD_TIMESTAMP,
      },

      twitter: {
        cardType: 'summary_large_image',
        site: '@ModularHouse',
        title: 'About Us | Modular House',
        image: 'https://modularhouse.ie/resource/landing_hero.jpg',
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

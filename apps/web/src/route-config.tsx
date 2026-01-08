import Landing from './routes/Landing';
import GardenRoom from './routes/GardenRoom';
import HouseExtension from './routes/HouseExtension';
import Gallery from './routes/Gallery';
import About from './routes/About';
import Contact from './routes/Contact';
import Privacy from './routes/Privacy';
import Terms from './routes/Terms';
import { AppRoute } from './types/seo';

/**
 * Central configuration for all public application routes.
 * Defines the path, component, and SEO/Sitemap metadata for each page.
 * Used by the client-side router and server-side static generation.
 */
export const routes: AppRoute[] = [
  {
    path: '/',
    component: Landing,
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
    component: GardenRoom,
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
    component: HouseExtension,
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
    component: Gallery,
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
    component: About,
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
    component: Contact,
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
    component: Privacy,
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
    component: Terms,
    seo: {
      title: 'Terms & Conditions',
      description: 'Terms and conditions for using our website and services.',
    },
    sitemap: {
      priority: 0.1,
      changefreq: 'yearly'
    }
  }
];

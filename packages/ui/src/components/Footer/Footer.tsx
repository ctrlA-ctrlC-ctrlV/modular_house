/**
 * Footer Component
 * =============================================================================
 * 
 * PURPOSE:
 * A responsive footer layout implementing a four-column grid design optimized
 * for brand identity, contact information, site navigation, and social media
 * integration. Built following the Open-Closed Principle for extensibility.
 * 
 * FEATURES:
 * - Responsive grid layout (single column mobile, four columns desktop)
 * - Brand identity section with logo and description
 * - Contact information with semantic HTML (address element)
 * - Navigation links using React Router for SPA navigation
 * - Social media icon buttons with accessible labels
 * - Copyright and credits footer bar
 * 
 * DEPENDENCIES:
 * - React Router DOM for client-side navigation
 * - Footer.css for component styling
 * 
 * ACCESSIBILITY:
 * - Semantic HTML elements (footer, address, nav)
 * - ARIA labels on social media links
 * - External links properly marked with rel="noreferrer"
 * 
 * =============================================================================
 */

import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';


/* =============================================================================
   TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Strictly typed interfaces for component props and data structures.
   ============================================================================= */

/**
 * Represents a social media platform link with associated icon.
 * The iconPath property accepts React nodes to support complex SVG structures.
 */
interface SocialLink {
  /** Unique identifier for the social platform */
  id: string;
  /** External URL to the social media profile */
  url: string;
  /** Accessible label for screen readers */
  ariaLabel: string;
  /** SVG path element(s) for the platform icon */
  iconPath: React.ReactNode;
}

/**
 * Represents an internal or external navigation link.
 * Used for building the site navigation section in the footer.
 */
interface NavLink {
  /** Unique identifier for the navigation item */
  id: string;
  /** Display text for the link */
  label: string;
  /** Route path or external URL */
  url: string;
}

/**
 * Props interface for the Footer component.
 * Follows the Open-Closed Principle by allowing style extension via className.
 */
export interface FooterProps {
  /** Optional additional CSS class names for styling overrides */
  className?: string;
}


/* =============================================================================
   STATIC DATA DEFINITIONS
   -----------------------------------------------------------------------------
   Externalized data arrays for social links and navigation items.
   Separation of data from presentation supports maintainability.
   ============================================================================= */

/**
 * Social media platform configurations.
 * Each entry includes the platform identifier, URL, accessibility label,
 * and SVG path data for the icon representation.
 */
const SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'instagram',
    url: 'https://www.instagram.com/',
    ariaLabel: 'Instagram',
    iconPath: (
      <path d="M10.3135 0H4.6875C3.44438 0.000269278 2.25225 0.494216 1.37323 1.37323C0.494216 2.25225 0.000269278 3.44438 0 4.6875L0 10.3125C0.000269278 11.5556 0.494216 12.7477 1.37323 13.6268C2.25225 14.5058 3.44438 14.9997 4.6875 15H10.3125C11.5556 14.9997 12.7477 14.5058 13.6268 13.6268C14.5058 12.7477 14.9997 11.5556 15 10.3125V4.6875C14.9997 3.44456 14.5059 2.25258 13.6271 1.37359C12.7483 0.494604 11.5565 0.000538508 10.3135 0ZM13.5953 10.3135C13.5945 11.1836 13.2485 12.0179 12.6332 12.6332C12.0179 13.2485 11.1836 13.5945 10.3135 13.5953H4.6875C3.81737 13.5945 2.98311 13.2485 2.36784 12.6332C1.75256 12.0179 1.40655 11.1836 1.40574 10.3135V4.6875C1.40682 3.81755 1.75295 2.98355 2.3682 2.36849C2.98344 1.75344 3.81755 1.40756 4.6875 1.40676H10.3125C11.1826 1.40756 12.0169 1.75358 12.6322 2.36885C13.2474 2.98413 13.5935 3.81839 13.5943 4.68852L13.5953 10.3135Z" />
    )
  },
  {
    id: 'tiktok',
    url: 'https://www.tiktok.net/themerex',
    ariaLabel: 'TikTok',
    iconPath: (
      <>
        <path d="M6.16876 4.14643C6.4375 4.02493 6.67902 3.85279 6.87944 3.63991C7.18082 3.26655 7.33371 2.79937 7.30992 2.32457C7.32338 1.83737 7.17445 1.35909 6.88554 0.961638C6.59019 0.629534 6.21868 0.370235 5.80125 0.204874C5.38381 0.0395133 4.93228 -0.0272382 4.48342 0.0100584H0V8.93105H4.17579C4.61538 8.93422 5.05417 8.89404 5.48548 8.81112C5.86437 8.74022 6.2221 8.5871 6.53222 8.36308C6.79516 8.17264 7.01787 7.93434 7.18809 7.6613C7.46535 7.23646 7.60901 6.7416 7.6013 6.23791C7.61567 5.77696 7.49028 5.32213 7.24088 4.93049C6.98166 4.56103 6.60479 4.28543 6.16876 4.14643ZM1.84778 1.56033H3.8641C4.23444 1.55055 4.60406 1.59738 4.95958 1.6991C5.12256 1.76601 5.25905 1.88254 5.34869 2.03133C5.43834 2.18012 5.47635 2.3532 5.45706 2.52479C5.47287 2.67639 5.44618 2.82934 5.37983 2.96727C5.31349 3.1052 5.20998 3.22292 5.08039 3.30786C4.77994 3.46671 4.44101 3.5431 4.09965 3.5289H1.84778V1.56033ZM5.03775 7.22913C4.74018 7.34774 4.41969 7.40152 4.09863 7.38673H1.84778V5.0078H4.12909C4.44552 4.99696 4.761 5.04783 5.05704 5.15747C5.24592 5.23663 5.40452 5.37179 5.51038 5.54381C5.61624 5.71583 5.664 5.916 5.64691 6.11599C5.67134 6.33988 5.62621 6.56577 5.51739 6.76429C5.40857 6.96281 5.24211 7.12478 5.03775 7.22913Z" />
        <path d="M13.5527 0.425781H9.58203V1.53694H13.5527V0.425781Z" />
      </>
    )
  },
  {
    id: 'facebook',
    url: 'https://www.facebook.com/',
    ariaLabel: 'Facebook',
    iconPath: (
      <path d="M4.40924 5.15357V3.27857C4.40946 3.15538 4.43254 3.03345 4.47714 2.91973C4.52174 2.80602 4.58699 2.70277 4.66917 2.61587C4.75135 2.52896 4.84884 2.46012 4.95607 2.41328C5.0633 2.36644 5.17818 2.34251 5.29412 2.34286H6.17563V1.41826e-07H4.41092C4.06345 -0.000117134 3.71938 0.0724976 3.39833 0.213697C3.07728 0.354896 2.78556 0.561913 2.53982 0.822924C2.29409 1.08393 2.09915 1.39382 1.96615 1.73489C1.83316 2.07596 1.76471 2.44153 1.76471 2.81071V5.15357H0V7.5H1.76471V15H4.41009V7.5H6.1748L7.05882 5.15357H4.40924Z" />
    )
  },
  {
    id: 'twitter',
    url: 'https://dribbble.com/ThemeREX',
    ariaLabel: 'Dribbble',
    iconPath: (
      <path d="M7.5 0C6.01664 0 4.56659 0.439867 3.33323 1.26398C2.09986 2.08809 1.13856 3.25943 0.570907 4.62987C0.00324964 6.00032 -0.145275 7.50832 0.144114 8.96317C0.433503 10.418 1.14781 11.7544 2.1967 12.8033C3.2456 13.8522 4.58197 14.5665 6.03682 14.8559C7.49168 15.1453 8.99968 14.9967 10.3701 14.4291C11.7406 13.8614 12.9119 12.9001 13.736 11.6668C14.5601 10.4334 15 8.98336 15 7.5C14.9978 5.51154 14.207 3.60513 12.8009 2.19907C11.3949 0.793017 9.48846 0.00215056 7.5 0ZM7.5 14.0616C6.20204 14.0616 4.93322 13.6767 3.854 12.9556C2.77478 12.2345 1.93364 11.2096 1.43693 10.0104C0.940217 8.81123 0.810255 7.4917 1.06348 6.21868C1.3167 4.94565 1.94173 3.77631 2.85952 2.85851C3.77732 1.94071 4.94667 1.31568 6.2197 1.06246C7.49272 0.809236 8.81225 0.939198 10.0114 1.43591C11.2106 1.93262 12.2355 2.77377 12.9566 3.85298C13.6777 4.9322 14.0626 6.20102 14.0626 7.49898C14.0607 9.23892 13.3687 10.9071 12.1384 12.1374C10.9081 13.3677 9.23994 14.0597 7.5 14.0616Z" />
    )
  }
];

/**
 * Site navigation links configuration.
 * Each entry maps to an internal route handled by React Router.
 */
const NAV_LINKS: NavLink[] = [
  { id: 'home', label: 'Home', url: '/' },
  { id: 'garden-room', label: 'Garden Room', url: '/garden-room' },
  { id: 'house-extension', label: 'House Extension', url: '/house-extension' },
  { id: 'gallery', label: 'Gallery', url: '/gallery' },
  { id: 'about', label: 'About Us', url: '/about' },
  { id: 'contact', label: 'Contact Us', url: '/contact' },
];


/* =============================================================================
   COMPONENT DEFINITION
   ============================================================================= */

/**
 * Footer Component
 * 
 * Renders a responsive four-column footer layout with brand identity,
 * contact information, navigation links, and social media integration.
 * 
 * The component follows the Open-Closed Principle by accepting a className
 * prop for styling extensions without modification of the component itself.
 * 
 * @param props - Component properties conforming to FooterProps interface
 * @returns JSX element representing the complete footer structure
 */
export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  /**
   * Compute current year dynamically for copyright notice.
   * Ensures the copyright year remains accurate without manual updates.
   */
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`footer ${className}`}>
      {/* ===================================================================
          MAIN FOOTER CONTENT: FOUR-COLUMN GRID
          =================================================================== */}
      <div className="footer__container">

        {/* -----------------------------------------------------------------
            COLUMN 1: BRAND IDENTITY
            Contains the company logo and brand description.
            ----------------------------------------------------------------- */}
        <div className="footer__column footer__column--brand">
          <h2 className="footer__logo">Modular House</h2>
          <p className="footer__description">
            Modular House is a premier specialist in steel frame construction, 
            dedicated to transforming homes with precision and speed. We deliver 
            bespoke, energy-efficient garden rooms and house extensions designed 
            for modern living and built to last a lifetime.
          </p>
        </div>

        {/* -----------------------------------------------------------------
            COLUMN 2: CONTACT INFORMATION
            Semantic address element with email, phone, and physical address.
            ----------------------------------------------------------------- */}
        <div className="footer__column">
          <h3 className="footer__heading">Contact</h3>
          <address className="footer__contact-info">
            <p className="footer__contact-item">
              <a href="mailto:info@sdeal.ie">info@sdeal.ie</a>
            </p>
            <p className="footer__contact-item">
              (+353) 0830280000
            </p>
            <p className="footer__contact-item">
              Unit 8,<br />
              Finches Business Park,<br />
              Long Mile road Dublin 12,<br />
              D12 N9YV
            </p>
          </address>
        </div>

        {/* -----------------------------------------------------------------
            COLUMN 3: SITE NAVIGATION LINKS
            Internal links rendered using React Router Link component
            to enable client-side navigation without full page reloads.
            ----------------------------------------------------------------- */}
        <div className="footer__column">
          <h3 className="footer__heading">Links</h3>
          <ul className="footer__nav-list">
            {NAV_LINKS.map((link) => (
              <li key={link.id} className="footer__nav-item">
                <Link to={link.url} className="footer__nav-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* -----------------------------------------------------------------
            COLUMN 4: SOCIAL MEDIA LINKS
            External links to social media platforms with accessible labels.
            Opens in new tab with security-conscious rel attribute.
            ----------------------------------------------------------------- */}
        <div className="footer__column">
          <h3 className="footer__heading">Get in Touch</h3>
          <div className="footer__social-list">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.id}
                href={social.url}
                className="footer__social-link"
                target="_blank"
                rel="noreferrer"
                aria-label={social.ariaLabel}
              >
                <svg
                  className="footer__social-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 15 15"
                >
                  {social.iconPath}
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ===================================================================
          FOOTER BOTTOM BAR: COPYRIGHT AND CREDITS
          Separated from main content with a subtle border divider.
          =================================================================== */}
      <div className="footer__bottom">
        <div className="footer__bottom-container">
          <div className="footer__copyright">
            &copy; {currentYear}. All Rights Reserved.
          </div>
          <div className="footer__credits">
            Built by <strong>Z</strong>
          </div>
        </div>
      </div>
    </footer>
  );
};
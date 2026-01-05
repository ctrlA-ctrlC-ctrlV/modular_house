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
  /** SVG viewBox attribute for proper icon scaling */
  viewBox: string;
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
    viewBox: '0 0 16 16',
    iconPath: (
      <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334" />
    )
  },
  {
    id: 'tiktok',
    url: 'https://www.tiktok.com/',
    ariaLabel: 'TikTok',
    viewBox: '0 0 16 16',
    iconPath: (
      <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z" />
    )
  },
  {
    id: 'facebook',
    url: 'https://www.facebook.com/',
    ariaLabel: 'Facebook',
    viewBox: '0 0 8 15',
    iconPath: (
      <path d="M4.40924 5.15357V3.27857C4.40946 3.15538 4.43254 3.03345 4.47714 2.91973C4.52174 2.80602 4.58699 2.70277 4.66917 2.61587C4.75135 2.52896 4.84884 2.46012 4.95607 2.41328C5.0633 2.36644 5.17818 2.34251 5.29412 2.34286H6.17563V1.41826e-07H4.41092C4.06345 -0.000117134 3.71938 0.0724976 3.39833 0.213697C3.07728 0.354896 2.78556 0.561913 2.53982 0.822924C2.29409 1.08393 2.09915 1.39382 1.96615 1.73489C1.83316 2.07596 1.76471 2.44153 1.76471 2.81071V5.15357H0V7.5H1.76471V15H4.41009V7.5H6.1748L7.05882 5.15357H4.40924Z" />
    )
  },
  {
    id: 'twitter',
    url: 'https://x.com/',
    ariaLabel: 'X (Twitter)',
    viewBox: '0 0 16 16',
    iconPath: (
      <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
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
                  viewBox={social.viewBox}
                  fill="currentColor"
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
            Built by Zhaoxiang Qiu
          </div>
        </div>
      </div>
    </footer>
  );
};
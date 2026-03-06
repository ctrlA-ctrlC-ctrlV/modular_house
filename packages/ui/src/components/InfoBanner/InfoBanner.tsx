/**
 * InfoBanner Component
 * =============================================================================
 * 
 * PURPOSE:
 * An informational banner component designed to display regulatory information,
 * announcements, or status-based content. Ideal for planning permission notices,
 * compliance information, and feature availability indicators.
 * 
 * ARCHITECTURE:
 * This component follows the Open-Closed Principle: it accepts extensible props
 * for content customization while maintaining a closed internal structure.
 * All styling is delegated to the companion CSS file using BEM methodology.
 * 
 * LAYOUT STRUCTURE:
 * - Container: Centered banner with subtle left accent bar
 * - Eyebrow: Optional overline text for section categorization
 * - Heading: Primary serif heading for the banner
 * - Body: Descriptive text explaining the context
 * - Status List: Visual indicators showing status of multiple items
 * - Link: Optional CTA link with animated arrow
 * 
 * ACCESSIBILITY:
 * - Uses semantic heading hierarchy (h2)
 * - ARIA role="region" with aria-label for screen readers
 * - Status indicators use aria-hidden for decorative icons
 * 
 * USAGE:
 * ```tsx
 * <InfoBanner
 *   eyebrow="Regulations"
 *   heading="Do You Need Planning Permission?"
 *   body="Under current law, garden rooms up to 25m² are exempt..."
 *   statusItems={[
 *     { label: "Up to 25m²", status: "active", tag: "Exempt" },
 *     { label: "35m²", status: "pending", tag: "Pending" },
 *   ]}
 *   link={{ href: "https://...", text: "Learn More" }}
 * />
 * ```
 * 
 * =============================================================================
 */

import React from 'react';
import './InfoBanner.css';


/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Strict TypeScript interfaces for component props.
   All optional properties include JSDoc descriptions for IDE support.
   ============================================================================= */

/**
 * Status type for status items.
 * - active: Item is currently in effect (filled indicator)
 * - pending: Item is awaiting approval or future implementation (outlined indicator)
 */
export type StatusType = 'active' | 'pending';

/**
 * Interface definition for a single status item within the status list.
 * Each status item represents a threshold, feature, or requirement.
 */
export interface InfoBannerStatusItem {
  /**
   * The primary label text for the status item.
   * Should be concise (e.g., "Up to 25m²", "35m²").
   */
  label: string;
  
  /**
   * The status type determining visual appearance.
   * - 'active': Filled circle with checkmark
   * - 'pending': Outlined circle with muted checkmark
   */
  status: StatusType;
  
  /**
   * The tag text displayed alongside the label.
   * Should be a short status indicator (e.g., "Exempt", "Pending").
   */
  tag: string;
}

/**
 * Interface definition for the optional link element.
 */
export interface InfoBannerLink {
  /**
   * The URL for the link.
   */
  href: string;
  
  /**
   * The display text for the link.
   */
  text: string;
  
  /**
   * Whether the link opens in a new tab.
   * @default true
   */
  openInNewTab?: boolean;
}

/**
 * Properties interface for the InfoBanner component.
 */
export interface InfoBannerProps {
  /**
   * Optional eyebrow text appearing above the heading.
   * Styled as uppercase, letter-spaced label.
   */
  eyebrow?: string;

  /**
   * The primary heading text for the banner.
   * Displayed in serif font with tight letter-spacing.
   */
  heading: string;

  /**
   * The body text providing context and details.
   * Can be a string or React node for rich content.
   */
  body: React.ReactNode;

  /**
   * Array of status items to display in the status list.
   * Each item shows a visual indicator, label, and tag.
   */
  statusItems?: InfoBannerStatusItem[];

  /**
   * Optional link displayed at the bottom of the banner.
   * Includes animated arrow on hover.
   */
  link?: InfoBannerLink;

  /**
   * Accessible label for the banner region.
   * Used for screen reader navigation.
   * @default "Information banner"
   */
  ariaLabel?: string;

  /**
   * The HTML heading level (2-6) for the banner heading element.
   * Allows consumers to maintain correct heading hierarchy when the
   * banner is nested inside another sectioning element that already
   * establishes its own heading level.
   * @default 2
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;

  /**
   * Additional CSS class names to apply to the banner.
   */
  className?: string;
}


/* =============================================================================
   SECTION 2: ICON COMPONENTS
   -----------------------------------------------------------------------------
   SVG icons used within the component for visual indicators.
   ============================================================================= */

/**
 * Checkmark icon for status indicators.
 */
const CheckIcon: React.FC = () => (
  <svg
    viewBox="0 0 12 12"
    fill="none"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="2.5 6.5 5 9 9.5 3.5" />
  </svg>
);

/**
 * Arrow icon for the link element.
 */
const ArrowIcon: React.FC = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="8" x2="13" y2="8" />
    <polyline points="9.5 4.5 13 8 9.5 11.5" />
  </svg>
);


/* =============================================================================
   SECTION 3: COMPONENT IMPLEMENTATION
   -----------------------------------------------------------------------------
   The main InfoBanner component with full TypeScript support.
   ============================================================================= */

/**
 * InfoBanner Component
 * 
 * An informational banner for displaying regulatory information, status
 * indicators, and contextual announcements with a clean, editorial design.
 * 
 * @param props - Component properties
 * @returns React component
 */
export const InfoBanner: React.FC<InfoBannerProps> = ({
  eyebrow,
  heading,
  body,
  statusItems = [],
  link,
  ariaLabel = 'Information banner',
  headingLevel = 2,
  className = '',
}) => {
  /**
   * Dynamic heading element derived from the headingLevel prop.
   * Allows the consumer to specify the correct heading level for its
   * document outline context without altering the visual styling.
   */
  const HeadingTag = `h${headingLevel}` as keyof Pick<
    JSX.IntrinsicElements,
    'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  >;
  const hasStatusItems = statusItems.length > 0;
  const hasLink = link !== undefined;
  
  return (
    <section
      className={`info-banner ${className}`.trim()}
      role="region"
      aria-label={ariaLabel}
    >
      {/* Eyebrow Label */}
      {eyebrow && (
        <p className="info-banner__eyebrow">{eyebrow}</p>
      )}
      
      {/* Main Heading */}
      <HeadingTag className="info-banner__heading">{heading}</HeadingTag>
      
      {/* Body Text */}
      <div className="info-banner__body">
        {typeof body === 'string' ? <p>{body}</p> : body}
      </div>
      
      {/* Status Items List */}
      {hasStatusItems && (
        <div className="info-banner__status-list" role="list">
          {statusItems.map((item, index) => (
            <div
              className="info-banner__status-item"
              key={index}
              role="listitem"
              aria-label={`${item.label}: ${item.tag}`}
            >
              <span
                className={`info-banner__status-check info-banner__status-check--${item.status}`}
                aria-hidden="true"
              >
                <CheckIcon />
              </span>
              <span className="info-banner__status-label">{item.label}</span>
              <span
                className={`info-banner__status-tag info-banner__status-tag--${item.status}`}
                aria-hidden="true"
              >
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Divider and Link */}
      {hasLink && (
        <>
          <hr className="info-banner__divider" />
          <a
            className="info-banner__link"
            href={link.href}
            target={link.openInNewTab !== false ? '_blank' : undefined}
            rel={link.openInNewTab !== false ? 'noopener noreferrer' : undefined}
            aria-label={
              link.openInNewTab !== false
                ? `${link.text} (opens in new tab)`
                : undefined
            }
          >
            {link.text}
            <ArrowIcon />
          </a>
        </>
      )}
    </section>
  );
};

export default InfoBanner;

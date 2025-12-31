import React, { useState } from 'react';
import './Header.css';

// ==========================================
// Types & Interfaces
// ==========================================

export interface MenuItem {
  label: string;
  href: string;
  submenu?: MenuItem[];
}

export interface SocialLink {
  platform: 'twitter' | 'instagram' | 'facebook' | 'linkedin';
  url: string;
}

/**
 * Header visual variant for different page contexts.
 * - 'dark': White text on dark/transparent background (default, for hero sections)
 * - 'light': Black text on light/white background (for standard pages)
 */
export type HeaderVariant = 'dark' | 'light';

export interface HeaderProps {
  /** Logo image source */
  logoSrc: string;
  /** Logo image source for retina displays (2x) */
  logoSrcRetina?: string;
  /** Logo alt text */
  logoAlt?: string;
  /** Logo link URL */
  logoHref?: string;
  /** Main navigation menu items */
  menuItems: MenuItem[];
  /** Optional: Text for the right-side Call to Action button */
  ctaLabel?: string;
  /** Optional: Link for the right-side Call to Action button */
  ctaHref?: string;
  /** Optional: Social media links (Hidden in desktop based on screenshot, visible in mobile if needed) */
  socialLinks?: SocialLink[];
  /** Toggles transparent background absolute positioning */
  positionOver?: boolean;
  /** Visual variant: 'dark' (white text) or 'light' (black text). Defaults to 'dark'. */
  variant?: HeaderVariant;
}

/**
 * Header Component
 * * A responsive header featuring a logo, multi-level dropdown navigation,
 * and a primary Call-to-Action button.
 * * Layout: [Logo] -- [Navigation] -- [CTA Button]
 */
export const Header: React.FC<HeaderProps> = ({
  logoSrc,
  logoSrcRetina,
  logoAlt = 'Logo',
  logoHref = '/',
  menuItems,
  ctaLabel,
  ctaHref,
  //socialLinks = [],
  positionOver = false,
  variant = 'dark',
}) => {
  // State for mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // State for mobile accordion submenus
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);

  // Toggle handlers
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleSubmenu = (index: number) => {
    setActiveSubmenu(activeSubmenu === index ? null : index);
  };

  // Build class names based on props
  const headerClasses = [
    'header',
    'c-header',
    positionOver ? 'header--position-over' : '',
    variant === 'light' ? 'header--light' : 'header--dark',
  ].filter(Boolean).join(' ');

  return (
    <header className={headerClasses}>
      <div className="header__container">
        
        {/* ==========================================
            Section 1: Logo (Left Aligned)
            ========================================== */}
        <div className="header__logo-wrapper">
          <a href={logoHref} className="header__logo-link">
            <img
              className="header__logo-image"
              src={logoSrc}
              srcSet={logoSrcRetina ? `${logoSrcRetina} 2x` : undefined}
              alt={logoAlt}
            />
          </a>
        </div>

        {/* ==========================================
            Section 2: Desktop Navigation (Centered)
            ========================================== */}
        <nav className="header__nav-desktop c-nav">
          <ul className="header__menu">
            {menuItems.map((item, index) => (
              <li
                key={index}
                className={`header__menu-item ${item.submenu ? 'header__menu-item--has-submenu' : ''}`}
              >
                <a href={item.href} className="header__menu-link">
                  {item.label}
                  {/* Dropdown Chevron Icon */}
                  {item.submenu && (
                    <svg className="header__dropdown-icon" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                      <path d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"></path>
                    </svg>
                  )}
                </a>
                
                {/* Desktop Submenu Dropdown */}
                {item.submenu && (
                  <ul className="header__submenu">
                    {item.submenu.map((subItem, subIndex) => (
                      <li key={subIndex} className="header__submenu-item">
                        <a href={subItem.href} className="header__submenu-link">
                          {subItem.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* ==========================================
            Section 3: Actions / CTA (Right Aligned)
            ========================================== */}
        <div className="header__actions">
          {/* Primary CTA Button */}
          {ctaLabel && (
            <a href={ctaHref || '#'} className="header__cta-btn">
              {ctaLabel}
            </a>
          )}

          {/* Mobile Menu Toggle Button (Visible only on mobile) */}
          <button
            className="header__mobile-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle Menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="header__toggle-icon">
              {mobileMenuOpen ? (
                // Close Icon (X)
                <svg viewBox="0 0 352 512" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path>
                </svg>
              ) : (
                // Hamburger Icon
                <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"></path>
                </svg>
              )}
            </span>
          </button>
        </div>

        {/* ==========================================
            Section 4: Mobile Menu Drawer
            ========================================== */}
        {mobileMenuOpen && (
          <div className="header__mobile-menu">
            <ul className="header__mobile-list">
              {menuItems.map((item, index) => (
                <li key={index} className="header__mobile-item">
                  <div className="header__mobile-link-wrapper">
                    <a href={item.href} className="header__mobile-link">
                      {item.label}
                    </a>
                    {item.submenu && (
                      <button
                        className={`header__submenu-toggle ${activeSubmenu === index ? 'is-active' : ''}`}
                        onClick={() => toggleSubmenu(index)}
                        aria-label={`Toggle ${item.label} submenu`}
                      >
                         <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                          <path fill="currentColor" d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Mobile Submenu Accordion */}
                  {item.submenu && activeSubmenu === index && (
                    <ul className="header__mobile-submenu">
                      {item.submenu.map((subItem, subIndex) => (
                        <li key={subIndex} className="header__mobile-submenu-item">
                          <a href={subItem.href} className="header__mobile-submenu-link">
                            {subItem.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
              
              {/* Mobile version of CTA */}
              {ctaLabel && (
                <li className="header__mobile-item header__mobile-item--cta">
                  <a href={ctaHref || '#'} className="header__mobile-cta-btn">
                    {ctaLabel}
                  </a>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};
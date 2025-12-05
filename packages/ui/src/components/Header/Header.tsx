import React, { useState } from 'react';
import './Header.css';

export interface MenuItem {
  label: string;
  href: string;
  submenu?: MenuItem[];
}

export interface SocialLink {
  platform: 'twitter' | 'instagram' | 'facebook' | 'linkedin';
  url: string;
}

export interface HeaderProps {
  /**
   * Logo image source
   */
  logoSrc: string;
  /**
   * Logo image source for retina displays (2x)
   */
  logoSrcRetina?: string;
  /**
   * Logo alt text
   */
  logoAlt?: string;
  /**
   * Logo link URL
   */
  logoHref?: string;
  /**
   * Main navigation menu items
   */
  menuItems: MenuItem[];
  /**
   * Social media links
   */
  socialLinks?: SocialLink[];
  /**
   * Position over content
   */
  positionOver?: boolean;
}

const SocialIcon: React.FC<{ platform: string }> = ({ platform }) => {
  switch (platform) {
    case 'twitter':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <path d="M9.65665 6.98825L14.5178 1H13.0556L9.00332 6.0094L5.66667 1.00821H1L6.5222 9.27497L1.79332 15H3.25555L7.19889 10.2867L10.3333 14.9836H15L9.65665 6.98002V6.98825ZM3.25555 2.24205H5.06776L12.7522 13.7579H10.94L3.25555 2.24205Z"></path>
        </svg>
      );
    case 'instagram':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15">
          <path d="M10.3135 0H4.6875C3.44438 0.000269278 2.25225 0.494216 1.37323 1.37323C0.494216 2.25225 0.000269278 3.44438 0 4.6875L0 10.3125C0.000269278 11.5556 0.494216 12.7477 1.37323 13.6268C2.25225 14.5058 3.44438 14.9997 4.6875 15H10.3125C11.5556 14.9997 12.7477 14.5058 13.6268 13.6268C14.5058 12.7477 14.9997 11.5556 15 10.3125V4.6875C14.9997 3.44456 14.5059 2.25258 13.6271 1.37359C12.7483 0.494604 11.5565 0.000538508 10.3135 0ZM13.5953 10.3135C13.5945 11.1836 13.2485 12.0179 12.6332 12.6332C12.0179 13.2485 11.1836 13.5945 10.3135 13.5953H4.6875C3.81737 13.5945 2.98311 13.2485 2.36784 12.6332C1.75256 12.0179 1.40655 11.1836 1.40574 10.3135V4.6875C1.40682 3.81755 1.75295 2.98355 2.3682 2.36849C2.98344 1.75344 3.81755 1.40756 4.6875 1.40676H10.3125C11.1826 1.40756 12.0169 1.75358 12.6322 2.36885C13.2474 2.98413 13.5935 3.81839 13.5943 4.68852L13.5953 10.3135Z"></path>
          <path d="M7.50001 3.75C6.75833 3.75 6.0333 3.96993 5.41662 4.38198C4.79994 4.79404 4.31928 5.37971 4.03546 6.06493C3.75163 6.75016 3.67736 7.50416 3.82206 8.23159C3.96675 8.95902 4.3239 9.62721 4.84835 10.1517C5.3728 10.6761 6.04099 11.0333 6.76841 11.178C7.49584 11.3226 8.24985 11.2484 8.93507 10.9646C9.6203 10.6807 10.206 10.2001 10.618 9.58339C11.0301 8.9667 11.25 8.24168 11.25 7.5C11.25 6.50544 10.8549 5.55161 10.1517 4.84835C9.4484 4.14509 8.49457 3.75 7.50001 3.75ZM7.50001 9.84426C7.03635 9.84426 6.58312 9.70678 6.1976 9.44919C5.81209 9.1916 5.51163 8.82546 5.3342 8.3971C5.15677 7.96874 5.11033 7.4974 5.20079 7.04266C5.29124 6.58791 5.51451 6.17021 5.84236 5.84236C6.17021 5.51451 6.58792 5.29124 7.04266 5.20078C7.4974 5.11033 7.96875 5.15676 8.3971 5.33419C8.82546 5.51163 9.1916 5.81209 9.44919 6.1976C9.70678 6.58311 9.84426 7.03635 9.84426 7.5C9.84346 8.12149 9.59621 8.71729 9.15675 9.15674C8.71729 9.5962 8.12149 9.84345 7.50001 9.84426Z"></path>
          <path d="M11.531 3.96821C11.807 3.96821 12.0307 3.74447 12.0307 3.46848C12.0307 3.19249 11.807 2.96875 11.531 2.96875C11.255 2.96875 11.0312 3.19249 11.0312 3.46848C11.0312 3.74447 11.255 3.96821 11.531 3.96821Z"></path>
        </svg>
      );
    default:
      return null;
  }
};

export const Header: React.FC<HeaderProps> = ({
  logoSrc,
  logoSrcRetina,
  logoAlt = 'Logo',
  logoHref = '/',
  menuItems,
  socialLinks = [],
  positionOver = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleSubmenu = (index: number) => {
    setActiveSubmenu(activeSubmenu === index ? null : index);
  };

  return (
    <header className={`header c-header ${positionOver ? 'header--position-over' : ''}`}>
      <div className="header__container">
        {/* Desktop Header */}
        <div className="header__desktop">
          <div className="header__logo">
            <a href={logoHref} className="header__logo-link">
              <img
                className="header__logo-image"
                src={logoSrc}
                srcSet={logoSrcRetina ? `${logoSrcRetina} 2x` : undefined}
                alt={logoAlt}
              />
            </a>
          </div>

          <nav className="header__nav c-nav">
            <button
              className="header__mobile-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle Menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="header__toggle-icon">
                {mobileMenuOpen ? (
                  <svg viewBox="0 0 352 512" xmlns="http://www.w3.org/2000/svg">
                    <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path>
                  </svg>
                ) : (
                  <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"></path>
                  </svg>
                )}
              </span>
              <span className="header__toggle-text">
                {mobileMenuOpen ? 'Close' : 'Menu'}
              </span>
            </button>

            <ul className="header__menu">
              {menuItems.map((item, index) => (
                <li
                  key={index}
                  className={`header__menu-item ${item.submenu ? 'header__menu-item--has-submenu' : ''}`}
                >
                  <a href={item.href} className="header__menu-link">
                    {item.label}
                    {item.submenu && (
                      <svg className="header__dropdown-icon" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                        <path d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"></path>
                      </svg>
                    )}
                  </a>
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

          {socialLinks.length > 0 && (
            <div className="header__social">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  className="header__social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.platform}
                >
                  <SocialIcon platform={link.platform} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="header__mobile-menu">
            <ul className="header__mobile-list">
              {menuItems.map((item, index) => (
                <li key={index} className="header__mobile-item">
                  <a href={item.href} className="header__mobile-link">
                    {item.label}
                  </a>
                  {item.submenu && (
                    <>
                      <button
                        className="header__submenu-toggle"
                        onClick={() => toggleSubmenu(index)}
                        aria-label={`Toggle ${item.label} submenu`}
                      >
                        <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                          <path d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"></path>
                        </svg>
                      </button>
                      {activeSubmenu === index && (
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
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

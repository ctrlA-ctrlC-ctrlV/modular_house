import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Header as UIHeader, MenuItem, HeaderVariant } from '@modular-house/ui'

// ===========================================================================
// Types & Interfaces
// ===========================================================================

/**
 * Props for the integration Header component.
 * Allows page-level control of the header's visual appearance.
 */
export interface HeaderProps {
  /**
   * Visual variant controlling text and logo colors.
   * - 'dark': White text with white logo (for pages with hero/dark backgrounds)
   * - 'light': Black text with black logo (for pages with light/white backgrounds)
   * @default 'dark'
   */
  variant?: HeaderVariant;
  /**
   * Whether the header should be positioned over content (transparent background).
   * Typically used with hero sections.
   * @default true
   */
  positionOver?: boolean;
}

/**
 * Integration Header Component
 * * Bridges the gap between the purely presentational UIHeader (from the component library)
 * and the application's routing logic (react-router-dom).
 */
function Header({ variant = 'dark', positionOver = true }: HeaderProps) {
  const location = useLocation();

  // State for controlling the mobile menu
  // Lifted up from UI library to allow router-based closing
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * Effect to automatically close the mobile menu when the route changes.
   * This ensures a fresh state when navigating to a new page.
   */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // ===========================================================================
  // Configuration
  // ===========================================================================

  /**
   * Main Navigation Items
   * Note: 'Contact' has been removed from here to be used as the CTA button.
   */
  const menuItems: MenuItem[] = [
    { label: 'Home', href: '/' }, // Standard practice is usually Logo = Home, but can be added back if needed
    { label: 'Garden Room', href: '/garden-room' },
    { label: 'House Extension', href: '/house-extension' },
    //{ label: 'Gallery', href: '/gallery' },
    //{ label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' }
  ];

  /**
   * Primary Call-to-Action (CTA) Configuration
   * This renders the highlighted button on the right side of the header.
   */
  /*const ctaConfig = {
    label: 'Contact Us',
    href: '/contact'
  }*/

  /**
   * Logo Configuration
   * Dynamically selects logo based on variant prop.
   * - 'dark' variant: Uses white logo for visibility on dark/image backgrounds
   * - 'light' variant: Uses black logo for visibility on light backgrounds
   */
  const logoSrc = variant === 'light' ? '/logo_black.svg' : '/logo_white.svg';
  const logoSrcRetina = undefined;

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <div>
      <UIHeader
        logoSrc={logoSrc}
        logoSrcRetina={logoSrcRetina}
        logoAlt="Modular House"
        logoHref="/"
        menuItems={menuItems}
        variant={variant}
        positionOver={positionOver}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={setIsMobileMenuOpen}
        // Inject React Router Link component to handle navigation without full page reload
        renderLink={({ href, children, className, onClick }) => (
          <Link to={href} className={className} onClick={onClick}>
            {children}
          </Link>
        )}
      />
    </div>
  )
}

export default Header
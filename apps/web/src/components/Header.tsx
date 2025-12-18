import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
// Assuming 'Header' is the named export from your UI library based on the previous file
import { Header as UIHeader, MenuItem } from '@modular-house/ui'

/**
 * Integration Header Component
 * * Bridges the gap between the purely presentational UIHeader (from the component library)
 * and the application's routing logic (react-router-dom).
 */
function Header() {
  const navigate = useNavigate()
  const headerRef = useRef<HTMLDivElement>(null)

  // ===========================================================================
  // Configuration
  // ===========================================================================

  /**
   * Main Navigation Items
   * Note: 'Contact' has been removed from here to be used as the CTA button.
   */
  const menuItems: MenuItem[] = [
    // { label: 'Home', href: '/' }, // Standard practice is usually Logo = Home, but can be added back if needed
    { label: 'Garden Room', href: '/garden-room' },
    { label: 'House Extension', href: '/house-extension' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' }
  ]

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
   * Using an SVG data URL for the text-based logo.
   * Update: Changed fill to white (%23ffffff) to match the new dark theme.
   */
  //const logoSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="180" height="28" viewBox="0 0 180 28"%3E%3Ctext x="0" y="20" font-family="Outfit" font-size="28" font-weight="SemiBold" fill="%23ffffff"%3EModular House%3C/text%3E%3C/svg%3E'
  const logoSrc = "/logo_white.svg"
  const logoSrcRetina = undefined

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  /**
   * Router Interception Logic
   * * The UI library renders standard HTML <a> tags for accessibility and SEO.
   * This effect listens for clicks within the header, intercepts internal links,
   * prevents the browser refresh, and pushes the route via React Router.
   */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Looks for the closest anchor tag (handles clicks on icons/spans inside links)
      const anchor = target.closest('a')
      
      if (!anchor) return
      
      const href = anchor.getAttribute('href')
      if (!href) return

      // Logic to determine if navigation should be handled by Client Side Routing
      const isInternalLink = href.startsWith('/') && !href.startsWith('//')
      const isSpecialLink = href.startsWith('tel:') || href.startsWith('mailto:')
      const isExternalTarget = anchor.target === '_blank' || anchor.rel?.includes('external')

      if (isInternalLink && !isSpecialLink && !isExternalTarget) {
        e.preventDefault()
        navigate(href)
      }
    }

    const headerElement = headerRef.current
    if (headerElement) {
      headerElement.addEventListener('click', handleClick)
    }

    // Cleanup listener on unmount
    return () => {
      if (headerElement) {
        headerElement.removeEventListener('click', handleClick)
      }
    }
  }, [navigate])

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <div ref={headerRef}>
      <UIHeader
        logoSrc={logoSrc}
        logoSrcRetina={logoSrcRetina}
        logoAlt="Modular House"
        logoHref="/"
        menuItems={menuItems}
        // New props for the refactored layout:
        //ctaLabel={ctaConfig.label}
        //ctaHref={ctaConfig.href}
        // Ensures the header sits on top of hero images (transparent bg)
        positionOver={true} 
      />
    </div>
  )
}

export default Header
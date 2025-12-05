import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header as UIHeader, MenuItem } from '@modular-house/ui'

function Header() {
  const navigate = useNavigate()
  const headerRef = useRef<HTMLDivElement>(null)

  // Menu items configuration
  const menuItems: MenuItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Garden Room', href: '/garden-room' },
    { label: 'House Extension', href: '/house-extension' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ]

  // Social links configuration
  /*const socialLinks = [
    { platform: 'twitter' as const, url: 'https://twitter.com/modularhouse' },
    { platform: 'instagram' as const, url: 'https://instagram.com/modularhouse' },
  ]*/

  // Logo configuration - using SVG data URL for a simple text-based logo
  // Replace with actual logo paths when available
  const logoSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="180" height="28" viewBox="0 0 180 28"%3E%3Ctext x="0" y="20" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="%23333"%3EModular House%3C/text%3E%3C/svg%3E'
  const logoSrcRetina = undefined

  // Intercept link clicks to use React Router navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      
      if (!anchor) return
      
      const href = anchor.getAttribute('href')
      if (!href) return

      // Only handle internal links
      if (href.startsWith('/') && !href.startsWith('//')) {
        // Don't intercept if it's a tel: or mailto: link
        if (href.startsWith('tel:') || href.startsWith('mailto:')) return
        
        // Don't intercept if it's an external link or has target="_blank"
        if (anchor.target === '_blank' || anchor.rel?.includes('external')) return

        e.preventDefault()
        navigate(href)
      }
    }

    const headerElement = headerRef.current
    if (headerElement) {
      headerElement.addEventListener('click', handleClick)
    }

    return () => {
      if (headerElement) {
        headerElement.removeEventListener('click', handleClick)
      }
    }
  }, [navigate])

  return (
    <div ref={headerRef}>
      <UIHeader
        logoSrc={logoSrc}
        logoSrcRetina={logoSrcRetina}
        logoAlt="Modular House"
        logoHref="/"
        menuItems={menuItems}
        positionOver={true}
      />
    </div>
  )
}

export default Header
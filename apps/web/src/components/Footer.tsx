import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Footer as UIFooter, TrueFooter as UITrueFooter } from '@modular-house/ui'

function Footer() {
  const navigate = useNavigate()
  const footerRef = useRef<HTMLDivElement>(null)

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

    const footerElement = footerRef.current
    if (footerElement) {
      footerElement.addEventListener('click', handleClick)
    }

    return () => {
      if (footerElement) {
        footerElement.removeEventListener('click', handleClick)
      }
    }
  }, [navigate])
  
  return (
    <div ref={footerRef}>
      <UIFooter />
    </div>
  )
}

export default Footer
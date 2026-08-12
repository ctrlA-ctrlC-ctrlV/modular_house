import { Link } from 'react-router-dom'
import { Footer as UIFooter, type LinkRenderer, type NavLink } from '@modular-house/ui'

// Mirrors @modular-house/ui's own (unexported) default NAV_LINKS, with a
// trailing "Cookie Policy" entry (T086, N4/FR-005). FooterProps.navLinks
// replaces rather than merges the library's default list, and the default
// array is not exported for reuse, so the marketing entries are restated
// here — this is the one Open-Closed extension point the shared Footer
// exposes without touching @modular-house/ui itself (out of scope).
const NAV_LINKS_WITH_COOKIE_POLICY: NavLink[] = [
  { id: 'home', label: 'Home', url: '/' },
  { id: 'garden-rooms', label: 'Garden Rooms', url: '/garden-rooms' },
  { id: 'house-extensions', label: 'House Extensions', url: '/house-extensions' },
  { id: 'gallery', label: 'Gallery', url: '/gallery' },
  { id: 'about', label: 'About Us', url: '/about' },
  { id: 'contact', label: 'Contact Us', url: '/contact' },
  { id: 'cookie-policy', label: 'Cookie Policy', url: '/cookie-policy' },
]

function Footer() {
  // Render Link helper
  const renderLink: LinkRenderer = (props) => {
    const { href, children, className, onClick, ...rest } = props;
    return (
      <Link to={href} className={className} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  };
  
  return (
    <div>
      <UIFooter renderLink={renderLink} navLinks={NAV_LINKS_WITH_COOKIE_POLICY} />
    </div>
  )
}

export default Footer
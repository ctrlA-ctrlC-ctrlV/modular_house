import { Link } from 'react-router-dom'
import { Footer as UIFooter, type LinkRenderer } from '@modular-house/ui'

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
      <UIFooter renderLink={renderLink} />
    </div>
  )
}

export default Footer
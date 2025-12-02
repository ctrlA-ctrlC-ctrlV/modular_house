import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import App from '../../App';

// Mock components to isolate layout testing
vi.mock('../../components/Header', () => ({
  default: () => <header data-testid="template-header">Header</header>
}));

vi.mock('../../components/Footer', () => ({
  default: () => <footer data-testid="template-footer">Footer</footer>
}));

// Mock page components to verify routing
vi.mock('../../routes/Landing', () => ({ default: () => <div data-testid="page-landing">Landing Page</div> }));
vi.mock('../../routes/About', () => ({ default: () => <div data-testid="page-about">About Page</div> }));
vi.mock('../../routes/Gallery', () => ({ default: () => <div data-testid="page-gallery">Gallery Page</div> }));
vi.mock('../../routes/Contact', () => ({ default: () => <div data-testid="page-contact">Contact Page</div> }));
vi.mock('../../routes/Privacy', () => ({ default: () => <div data-testid="page-privacy">Privacy Page</div> }));
vi.mock('../../routes/Terms', () => ({ default: () => <div data-testid="page-terms">Terms Page</div> }));
vi.mock('../../routes/not-found', () => ({ default: () => <div data-testid="page-404">404 Page</div> }));

describe('TemplateLayout Integration', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const renderRoute = (route: string) => {
    window.history.pushState({}, 'Test page', route);
    render(<App />);
  };

  it.each([
    ['/', 'page-landing'],
    ['/about', 'page-about'],
    ['/gallery', 'page-gallery'],
    ['/contact', 'page-contact'],
    ['/privacy', 'page-privacy'],
    ['/terms', 'page-terms'],
    ['/unknown-route', 'page-404'],
  ])('renders TemplateLayout for route %s', async (route, testId) => {
    renderRoute(route);
    
    // Verify layout components are present
    expect(await screen.findByTestId('template-header')).toBeInTheDocument();
    expect(screen.getByTestId('template-footer')).toBeInTheDocument();
    
    // Verify the specific page content is rendered
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    
    // Verify the layout wrapper class (.theme-rebar)
    // The Header is a direct child of the wrapper in TemplateLayout
    const header = screen.getByTestId('template-header');
    const wrapper = header.parentElement;
    expect(wrapper).toHaveClass('theme-rebar');
    
    // Verify main content area attributes
    const main = wrapper?.querySelector('main');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('tabIndex', '-1');
  });
});

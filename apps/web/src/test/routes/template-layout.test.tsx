import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
vi.mock('../../routes/GardenRoom', () => ({ default: () => <div data-testid="page-garden-room">Garden Room Page</div> }));
vi.mock('../../routes/HouseExtension', () => ({ default: () => <div data-testid="page-house-extension">House Extension Page</div> }));
vi.mock('../../routes/NotFound', () => ({ default: () => <div data-testid="page-404">404 Page</div> }));

describe('TemplateLayout Integration', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const renderRoute = (route: string) => {
    render(
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    );
  };

  it.each([
    ['/', 'page-landing'],
    ['/about', 'page-about'],
    ['/gallery', 'page-gallery'],
    ['/contact', 'page-contact'],
    ['/privacy', 'page-privacy'],
    ['/terms', 'page-terms'],
    ['/garden-room', 'page-garden-room'],
    ['/house-extension', 'page-house-extension'],
    ['/unknown-route', 'page-404'],
  ])('renders TemplateLayout for route %s', async (route, testId) => {
    renderRoute(route);
    
    // Verify layout components are present
    expect(await screen.findByTestId('template-header')).toBeInTheDocument();
    expect(screen.getByTestId('template-footer')).toBeInTheDocument();
    
    // Verify the specific page content is rendered
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    
    // Verify the layout wrapper class (.theme-template)
    // The Header is inside a wrapper div, which is inside the theme wrapper
    const header = screen.getByTestId('template-header');
    // Header component mock renders <header>, so parentElement is #template__header-wrapper
    const headerWrapper = header.parentElement;
    // #template__header-wrapper's parent is the .theme-template div
    const wrapper = headerWrapper?.parentElement;
    expect(wrapper).toHaveClass('theme-template');
    
    // Verify main content area attributes
    const main = wrapper?.querySelector('main');
    expect(main).toHaveAttribute('id', 'template__main-content');
    expect(main).toHaveAttribute('tabIndex', '-1');
  });
});

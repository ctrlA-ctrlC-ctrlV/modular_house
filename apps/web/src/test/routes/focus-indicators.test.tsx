import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TemplateLayout } from '../../components/TemplateLayout';

// We use the real TemplateLayout and Header to verify the skip link presence.
// Header uses Link, so we need MemoryRouter.

describe('Focus Indicators & Accessibility', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a skip link pointing to main content', () => {
    render(
      <MemoryRouter>
        <TemplateLayout />
      </MemoryRouter>
    );
    
    const skipLink = screen.getByText(/skip to main content/i);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
    
    // Verify it has classes for screen reader only (initially)
    expect(skipLink).toHaveClass('sr-only');
    // Verify it becomes visible on focus (checking class presence)
    expect(skipLink).toHaveClass('focus:not-sr-only');
  });

  it('main content region is programmatically focusable', () => {
    render(
      <MemoryRouter>
        <TemplateLayout />
      </MemoryRouter>
    );
    
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('tabIndex', '-1');
    
    main.focus();
    expect(document.activeElement).toBe(main);
  });
});

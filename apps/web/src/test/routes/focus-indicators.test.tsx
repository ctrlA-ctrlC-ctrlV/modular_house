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

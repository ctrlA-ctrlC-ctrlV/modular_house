// T085 — Public Footer cookie-policy link test (T-F4, footer half).
// Asserts the public site's standard page Footer renders a link to
// /cookie-policy (FR-005/N4): the policy page must be reachable from the
// banner AND the footer. This file covers the footer half only; the banner
// half of T-F4 is covered by the cookie-banner suite.
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Footer from '../../components/Footer'

describe('Footer — cookie-policy link (T085, T-F4, N4/FR-005)', () => {
  it('renders a link to /cookie-policy', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: /cookie policy/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/cookie-policy')
  })
})

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TextWithContactForm } from './TextWithContactForm';
import React from 'react';

describe('TextWithContactForm', () => {
  it('renders correctly with default props', () => {
    render(<TextWithContactForm />);
    
    expect(screen.getByText('Have inquiries? Reach out to us!')).toBeDefined();
    expect(screen.getByLabelText(/Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Email/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Send Message/i })).toBeDefined();
  });

  it('displays validation errors when submitting empty form', async () => {
    render(<TextWithContactForm />);
    
    const submitButton = screen.getByRole('button', { name: /Send Message/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeDefined();
      expect(screen.getByText('Invalid email address')).toBeDefined();
      expect(screen.getByText('You must agree to the data collection policy')).toBeDefined();
    });
  });

  it('calls onSubmit with correct data when form is valid', async () => {
    const handleSubmit = vi.fn();
    render(<TextWithContactForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
    fireEvent.click(screen.getByLabelText(/I agree that my submitted data is being/i)); // Click checkbox

    const submitButton = screen.getByRole('button', { name: /Send Message/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
      expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
        gdprConsent: true
      }));
    });
  });

  it('shows loading state when isSubmitting is true', () => {
    render(<TextWithContactForm isSubmitting={true} />);
    expect(screen.getByRole('button', { name: /Sending.../i })).toBeDefined();
    expect(screen.getByRole('button')).toHaveProperty('disabled', true);
  });

  it('shows success message when submissionSuccess is true', () => {
    render(<TextWithContactForm submissionSuccess={true} />);
    expect(screen.getByText('Message Sent!')).toBeDefined();
    expect(screen.queryByRole('form')).toBeNull();
  });

  it('shows error message when submissionError is provided', () => {
    render(<TextWithContactForm submissionError="Failed to send" />);
    expect(screen.getByText('Failed to send')).toBeDefined();
  });
});

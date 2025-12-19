import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { TextWithContactForm } from './TextWithContactForm';

afterEach(() => {
  cleanup();
});

describe('TextWithContactForm', () => {
  it('renders correctly with default props', () => {
    render(<TextWithContactForm />);
    
    expect(screen.getByText('Have inquiries? Reach out to us!')).toBeDefined();
    expect(screen.getByLabelText(/First Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Surname/i)).toBeDefined();
    expect(screen.getByLabelText(/Email/i)).toBeDefined();
    expect(screen.getByLabelText(/Phone/i)).toBeDefined();
    expect(screen.getByLabelText(/First Line Address/i)).toBeDefined();
    expect(screen.getByLabelText(/Eircode/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Send Message/i })).toBeDefined();
  });

  it('displays validation errors when submitting empty form', async () => {
    render(<TextWithContactForm />);
    
    const submitButton = screen.getByRole('button', { name: /Send Message/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeDefined();
      expect(screen.getByText('Invalid email address')).toBeDefined();
      expect(screen.getByText('Phone number is required')).toBeDefined();
      expect(screen.getByText('Address is required')).toBeDefined();
      expect(screen.getByText('Eircode is required')).toBeDefined();
      expect(screen.getByText('You must agree to the data collection policy')).toBeDefined();
    });
  });

  it('calls onSubmit with correct data when form is valid', async () => {
    const handleSubmit = vi.fn();
    render(<TextWithContactForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Surname/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText(/First Line Address/i), { target: { value: '123 Main St' } });
    fireEvent.change(screen.getByLabelText(/Eircode/i), { target: { value: 'D01 AB12' } });
    fireEvent.click(screen.getByLabelText(/I agree that my submitted data is being/i)); // Click checkbox

    const submitButton = screen.getByRole('button', { name: /Send Message/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
      expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({
        firstName: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        address: '123 Main St',
        eircode: 'D01 AB12',
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

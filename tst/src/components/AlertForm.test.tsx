import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertForm } from '../../../src/components/AlertForm';

describe('AlertForm', () => {
  const mockSubmit = vi.fn();

  it('should render creation header by default', () => {
    render(<AlertForm onSubmit={mockSubmit} />);
    expect(screen.getByText('Create New Alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Alert/i })).toBeInTheDocument();
  });

  const mockAlert = {
    id: 'alert-123',
    user_id: 'user-1',
    is_active: true,
    delivery_method: 'email' as const,
    email: 'test@test.com',
    filters: {
      areas: [],
      price: { lowerBound: null, upperBound: null },
      bedrooms: { lowerBound: null, upperBound: null },
      bathrooms: { lowerBound: null, upperBound: null },
      amenities: [],
      petsAllowed: null
    }
  };

  it('should render editing header and ID when editingAlert is provided', () => {
    render(<AlertForm onSubmit={mockSubmit} editingAlert={mockAlert} />);
    
    expect(screen.getByText('Editing Existing Alert')).toBeInTheDocument();
    expect(screen.getByText(/ID: alert-123/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('should call onSubmit with form data', () => {
    render(<AlertForm onSubmit={mockSubmit} />);
    
    // Fill in email
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Submit
    const submitBtn = screen.getByRole('button', { name: /Create Alert/i });
    fireEvent.click(submitBtn);
    
    expect(mockSubmit).toHaveBeenCalled();
    expect(mockSubmit.mock.calls[0][0].email).toBe('test@example.com');
  });

  it('should call onCancel when cancel button is clicked', () => {
    const mockCancel = vi.fn();
    
    render(<AlertForm onSubmit={mockSubmit} editingAlert={mockAlert} onCancel={mockCancel} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockCancel).toHaveBeenCalled();
  });
});

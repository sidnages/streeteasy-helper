import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../../../src/components/ErrorBoundary';
import React from 'react';

// Component that throws an error
const ThrowError = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe('ErrorBoundary', () => {
  let consoleSpy: any;

  beforeEach(() => {
    // Silence console.error for the tests
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Normal Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });

  it('should render fallback UI when a child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Test crash" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Sorry, something happened!')).toBeInTheDocument();
    expect(screen.getByText('The application encountered an unexpected error.')).toBeInTheDocument();
    expect(screen.getByText('Test crash')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload Application/i })).toBeInTheDocument();
  });

  it('should reload the page when reload button is clicked', () => {
    const originalLocation = window.location;
    // @ts-ignore
    delete window.location;
    window.location = { ...originalLocation, reload: vi.fn() };

    render(
      <ErrorBoundary>
        <ThrowError message="Crash" />
      </ErrorBoundary>
    );

    const reloadBtn = screen.getByRole('button', { name: /Reload Application/i });
    fireEvent.click(reloadBtn);

    expect(window.location.reload).toHaveBeenCalled();

    // Restore location
    window.location = originalLocation;
  });
});

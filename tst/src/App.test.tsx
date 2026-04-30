import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../src/App';

// Mock Supabase client
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  },
  updateSupabaseConfig: vi.fn(),
  getSavedConfig: vi.fn(() => ({ url: '', key: '', isValid: false }))
}));

describe('App', () => {
  it('should render landing page when not logged in', () => {
    render(<App />);
    expect(screen.getByText(/Never miss a rental listing again/i)).toBeInTheDocument();
    expect(screen.getByText(/Supabase Project URL/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In via Magic Link/i })).toBeInTheDocument();
  });
});

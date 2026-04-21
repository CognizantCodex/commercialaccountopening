import { describe, expect, it, vi } from 'vitest';
import { App } from '@/App';
import { renderWithProviders, screen } from '@/test/test-utils';

vi.mock('@/app/providers/AppProviders', () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="providers">{children}</div>
  ),
}));

vi.mock('@/app/router/AppRouter', () => ({
  AppRouter: () => <div>Router stub</div>,
}));

describe('App', () => {
  it('composes the router inside the application providers', () => {
    renderWithProviders(<App />);

    expect(screen.getByTestId('providers')).toBeInTheDocument();
    expect(screen.getByText('Router stub')).toBeInTheDocument();
  });
});

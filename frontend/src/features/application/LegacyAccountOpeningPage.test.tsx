import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LegacyAccountOpeningPage } from './LegacyAccountOpeningPage';

vi.mock('../../../../src/App.jsx', () => ({
  default: () => (
    <div className="application-shell kyc-fabric-shell">
      <section className="hero-panel">
        <p className="brand-mark">Cognizant</p>
        <div className="hero-copy">
          <p>Corporate Account Opening Application</p>
        </div>
      </section>
    </div>
  ),
}));

describe('LegacyAccountOpeningPage', () => {
  beforeEach(() => {
    document.documentElement.className = 'dark';
    document.documentElement.dataset.theme = 'dark';
    document.body.className = 'kyc-fabric-route';
  });

  it('forces the embedded corporate application back to the light shell', async () => {
    const { unmount } = render(<LegacyAccountOpeningPage />);

    await waitFor(() => {
      expect(document.querySelector('.application-shell')).toHaveClass('legacy-light-shell');
    });

    expect(document.documentElement).toHaveClass('light');
    expect(document.documentElement).not.toHaveClass('dark');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.body).toHaveClass('legacy-application-route', 'customer-account-route');
    expect(document.body).not.toHaveClass('kyc-fabric-route');
    expect(document.body.style.colorScheme).toBe('light');
    expect(document.querySelector('.application-shell')).toHaveClass(
      'customer-account-shell',
      'corporate-light-shell',
      'legacy-light-shell',
    );
    expect(document.querySelector('.application-shell')).not.toHaveClass('kyc-fabric-shell');

    unmount();

    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.body).not.toHaveClass('legacy-application-route', 'customer-account-route');
  });
});

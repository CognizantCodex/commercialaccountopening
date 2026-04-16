import { beforeEach, describe, expect, it } from 'vitest';
import { resolveInitialThemeMode } from '@/store/app';

describe('resolveInitialThemeMode', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = '';
    window.localStorage.clear();
  });

  it('prefers the dataset theme set during boot', () => {
    document.documentElement.dataset.theme = 'light';
    window.localStorage.setItem('kyc-theme', 'dark');

    expect(resolveInitialThemeMode()).toBe('light');
  });

  it('falls back to the stored theme when the dataset is missing', () => {
    window.localStorage.setItem('kyc-theme', 'system');

    expect(resolveInitialThemeMode()).toBe('system');
  });

  it('defaults to dark when no persisted preference exists', () => {
    expect(resolveInitialThemeMode()).toBe('dark');
  });
});

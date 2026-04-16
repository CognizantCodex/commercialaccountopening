import { useEffect } from 'react';
import { usePlatformStore } from '@/store';

function resolveTheme(theme: 'dark' | 'light' | 'system') {
  if (theme !== 'system') {
    return theme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeSynchronizer() {
  const themeMode = usePlatformStore((state) => state.themeMode);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const html = document.documentElement;
      const resolved = resolveTheme(themeMode);
      html.classList.remove('dark', 'light');
      html.classList.add(resolved);
      html.dataset.theme = themeMode;
      localStorage.setItem('kyc-theme', themeMode);
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);

    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [themeMode]);

  return null;
}

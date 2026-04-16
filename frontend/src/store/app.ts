import type { AppSlice, PlatformSliceCreator } from '@/store/types';
import type { ThemeMode } from '@/types/platform';

const themeCycle = ['dark', 'light', 'system'] as const;

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'dark' || value === 'light' || value === 'system';
}

export function resolveInitialThemeMode(): ThemeMode {
  if (typeof document !== 'undefined' && isThemeMode(document.documentElement.dataset.theme ?? null)) {
    return document.documentElement.dataset.theme;
  }

  if (typeof window !== 'undefined') {
    const storage = window.localStorage;
    if (storage && typeof storage.getItem === 'function') {
      const storedTheme = storage.getItem('kyc-theme');
      if (isThemeMode(storedTheme)) {
        return storedTheme;
      }
    }
  }

  return 'dark';
}

export const createAppSlice: PlatformSliceCreator<AppSlice> = (set) => ({
  currentRoute: 'executive',
  focusedCaseId: null,
  focusedRegion: null,
  commandPaletteOpen: false,
  themeMode: resolveInitialThemeMode(),
  navigateToView: (route) => set({ currentRoute: route }),
  focusCase: (caseId) => set({ focusedCaseId: caseId }),
  focusRegion: (region) => set({ focusedRegion: region }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setTheme: (themeMode) => set({ themeMode }),
  cycleTheme: () =>
    set((state) => {
      const currentIndex = themeCycle.indexOf(state.themeMode);
      const nextTheme = themeCycle[(currentIndex + 1) % themeCycle.length];
      return { themeMode: nextTheme };
    }),
});

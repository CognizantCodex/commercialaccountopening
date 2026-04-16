import type { AppSlice, PlatformSliceCreator } from '@/store/types';

const themeCycle = ['dark', 'light', 'system'] as const;

export const createAppSlice: PlatformSliceCreator<AppSlice> = (set) => ({
  currentRoute: 'executive',
  focusedCaseId: null,
  focusedRegion: null,
  commandPaletteOpen: false,
  themeMode: 'dark',
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

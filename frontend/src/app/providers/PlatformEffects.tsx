import { useEffect, useRef } from 'react';
import { useDemoEngine } from '@/services/demo-engine';
import { usePlatformStore } from '@/store';

export function PlatformEffects() {
  const dataSource = usePlatformStore((state) => state.dataSource);
  const initializePlatform = usePlatformStore((state) => state.initializePlatform);
  const refreshPlatform = usePlatformStore((state) => state.refreshPlatform);
  const lastRefreshAtRef = useRef(0);

  useDemoEngine();

  useEffect(() => {
    void initializePlatform();
  }, [dataSource, initializePlatform]);

  useEffect(() => {
    function refreshIfStale() {
      const now = Date.now();

      // Browsers often fire both visibility and focus when a tab becomes active.
      if (now - lastRefreshAtRef.current < 1000) {
        return;
      }

      lastRefreshAtRef.current = now;
      void refreshPlatform();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        refreshIfStale();
      }
    }

    window.addEventListener('focus', refreshIfStale);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', refreshIfStale);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshPlatform]);

  return null;
}

import { useEffect } from 'react';
import { useDemoEngine } from '@/services/demo-engine';
import { usePlatformStore } from '@/store';

export function PlatformEffects() {
  const dataSource = usePlatformStore((state) => state.dataSource);
  const initializePlatform = usePlatformStore((state) => state.initializePlatform);

  useDemoEngine();

  useEffect(() => {
    void initializePlatform();
  }, [dataSource, initializePlatform]);

  return null;
}

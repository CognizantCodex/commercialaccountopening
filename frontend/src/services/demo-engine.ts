import { useEffect } from 'react';
import { usePlatformStore } from '@/store';

export function useDemoEngine() {
  const dataSource = usePlatformStore((state) => state.dataSource);
  const autoplay = usePlatformStore((state) => state.autoplay);
  const speedMultiplier = usePlatformStore((state) => state.speedMultiplier);
  const currentStep = usePlatformStore((state) => state.currentStep);
  const timelineLength = usePlatformStore((state) => state.timeline.length);
  const stepTimeline = usePlatformStore((state) => state.stepTimeline);

  useEffect(() => {
    if (dataSource !== 'demo' || !autoplay || currentStep >= timelineLength) {
      return;
    }

    const delay = Math.max(900 / speedMultiplier, 350);
    const timer = window.setInterval(() => {
      stepTimeline();
    }, delay);

    return () => window.clearInterval(timer);
  }, [autoplay, currentStep, dataSource, speedMultiplier, stepTimeline, timelineLength]);
}

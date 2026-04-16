import { useEffect } from 'react';
import { usePlatformStore } from '@/store';

export function useDemoEngine() {
  const autoplay = usePlatformStore((state) => state.autoplay);
  const speedMultiplier = usePlatformStore((state) => state.speedMultiplier);
  const currentStep = usePlatformStore((state) => state.currentStep);
  const timelineLength = usePlatformStore((state) => state.timeline.length);
  const stepTimeline = usePlatformStore((state) => state.stepTimeline);

  useEffect(() => {
    if (!autoplay || currentStep >= timelineLength) {
      return;
    }

    const delay = Math.max(900 / speedMultiplier, 350);
    const timer = window.setInterval(() => {
      stepTimeline();
    }, delay);

    return () => window.clearInterval(timer);
  }, [autoplay, currentStep, speedMultiplier, stepTimeline, timelineLength]);
}

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatformStore } from '@/store';
import { getRouteByIndex, routeCatalog } from '@/services/selectors';

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  );
}

export function GlobalHotkeys() {
  const navigate = useNavigate();
  const setCommandPaletteOpen = usePlatformStore((state) => state.setCommandPaletteOpen);
  const toggleAutoplay = usePlatformStore((state) => state.toggleAutoplay);
  const stepTimeline = usePlatformStore((state) => state.stepTimeline);
  const cycleTheme = usePlatformStore((state) => state.cycleTheme);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      if (event.key === 'Escape') {
        setCommandPaletteOpen(false);
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (/^[1-5]$/.test(event.key)) {
        const route = getRouteByIndex(Number(event.key) - 1);
        void navigate(routeCatalog[route].path);
        return;
      }

      if (event.key === ' ') {
        event.preventDefault();
        toggleAutoplay();
        return;
      }

      if (event.key === '.') {
        event.preventDefault();
        stepTimeline();
        return;
      }

      if (event.shiftKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        cycleTheme();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleTheme, navigate, setCommandPaletteOpen, stepTimeline, toggleAutoplay]);

  return null;
}

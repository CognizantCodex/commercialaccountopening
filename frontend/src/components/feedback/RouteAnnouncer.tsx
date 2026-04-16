import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function RouteAnnouncer() {
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current!.textContent = document.title;
  }, [location.pathname]);

  return <div ref={ref} aria-live="polite" className="sr-only" />;
}

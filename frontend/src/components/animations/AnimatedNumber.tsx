import { useEffect, useRef, useState } from 'react';

export function AnimatedNumber({
  value,
  suffix,
  formatter = Math.round,
}: {
  value: number;
  suffix?: string;
  formatter?: (value: number) => number | string;
}) {
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    const start = previous.current;
    const difference = value - start;
    const startedAt = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - startedAt) / 900, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + difference * eased);
      if (progress < 1) {
        window.requestAnimationFrame(tick);
        return;
      }

      previous.current = value;
    }

    const animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [value]);

  return (
    <span>
      {formatter(display)}
      {suffix}
    </span>
  );
}

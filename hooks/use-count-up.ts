'use client';

import { useEffect, useRef, useState } from 'react';

type Options = {
  /** Animation length in ms. */
  duration?: number;
  /** Delay before starting, in ms. */
  delay?: number;
};

/**
 * Eased count-up from 0 → target using requestAnimationFrame. Returns the
 * target immediately when the user prefers reduced motion, so callers can use
 * the result directly for both animated and static rendering.
 */
export function useCountUp(target: number, { duration = 1200, delay = 0 }: Options = {}) {
  const [value, setValue] = useState(0);
  const frame = useRef<number | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReduced) {
      setValue(target);
      return;
    }

    const run = () => {
      const startTime = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        setValue(target * eased);
        if (t < 1) frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    };

    if (delay > 0) {
      timeout.current = setTimeout(run, delay);
    } else {
      run();
    }

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, [target, duration, delay]);

  return value;
}

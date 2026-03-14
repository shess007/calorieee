"use client";

import { useState, useEffect, useRef } from "react";

export function useAnimatedValue(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  const ref = useRef({ start: 0, startTime: 0, target: 0 });

  useEffect(() => {
    const r = ref.current;
    r.start = value;
    r.target = target;
    r.startTime = performance.now();

    let frameId: number;
    const animate = (now: number) => {
      const elapsed = now - r.startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(r.start + (r.target - r.start) * eased);
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}

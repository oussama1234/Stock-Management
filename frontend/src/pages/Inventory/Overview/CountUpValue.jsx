// src/pages/Inventory/Overview/CountUpValue.jsx
import React, { useEffect, useRef, useState } from 'react';

const formatNum = (n) => new Intl.NumberFormat().format(Number(n || 0));

export default function CountUpValue({ value = 0, duration = 700, className = '' }) {
  const [display, setDisplay] = useState(Number(value) || 0);
  const prevRef = useRef(Number(value) || 0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = prevRef.current;
    const end = Number(value) || 0;
    if (start === end) return;

    const startTime = performance.now();
    const run = (t) => {
      const elapsed = t - startTime;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = start + (end - start) * eased;
      setDisplay(current);
      if (p < 1) rafRef.current = requestAnimationFrame(run);
      else prevRef.current = end;
    };

    rafRef.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <span className={className}>{formatNum(display.toFixed(0))}</span>;
}

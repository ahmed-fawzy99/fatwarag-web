"use client";

import { useEffect, useRef } from "react";

/**
 * The review banner and the site header, pinned together at the top as one block.
 * Its live height is published as `--pinned-h` so anchors and sub-bars sit just below it (the banner wraps on narrow screens).
 */
export function PinnedTop({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty("--pinned-h", `${element.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} id="site-top" className="sticky top-0 z-30">
      {children}
    </div>
  );
}

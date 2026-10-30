"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SourceTitleBarProps = {
  /** e.g. «سورة البقرة» or «صحيح البخاري». */
  title: string;
  /** e.g. the surah number or «حديث ٥٢». */
  detail?: string | null;
  /** The page's own title; the bar shows once it has scrolled under the pinned header. */
  children: React.ReactNode;
};

/**
 * A slim bar under the pinned header naming the source being read, shown once the page's own title scrolls away.
 * Wrap the page title in it, inside an element that sets `--subbar-h`. The bar is fixed, so it never moves the page.
 */
export function SourceTitleBar({ title, detail, children }: SourceTitleBarProps) {
  const watched = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = watched.current;
    if (!element) return;
    let observer: IntersectionObserver | null = null;
    // The pinned block's height changes when the banner wraps, so the observer is rebuilt on resize.
    const observe = () => {
      observer?.disconnect();
      const pinned = document.getElementById("site-top")?.offsetHeight ?? 0;
      observer = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting && entry.boundingClientRect.top < pinned), {
        rootMargin: `-${pinned}px 0px 0px 0px`,
      });
      observer.observe(element);
    };
    observe();
    window.addEventListener("resize", observe);
    return () => {
      window.removeEventListener("resize", observe);
      observer?.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={watched}>{children}</div>
      <div
        aria-hidden={!shown}
        className={cn(
          "fixed inset-x-0 top-(--pinned-h) z-20 h-(--subbar-h) border-b bg-background/90 backdrop-blur-md transition-opacity duration-150 motion-reduce:transition-none",
          shown ? "opacity-100" : "pointer-events-none invisible opacity-0",
        )}
      >
        <p className="mx-auto flex h-full max-w-[860px] items-center gap-2 px-4 text-sm">
          <span className="truncate font-semibold">{title}</span>
          {detail && <span className="shrink-0 text-muted-foreground">· {detail}</span>}
        </p>
      </div>
    </>
  );
}

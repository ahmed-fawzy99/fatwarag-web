"use client";

import { useEffect } from "react";
import { scrollToElement } from "@/lib/helpers/scroll";

/**
 * Every in-page `#…` link (e.g. «الفتاوى المتعلقة بسؤالك») lands on the TOP of its target, below the pinned
 * block, even when content above or around it changes height mid-scroll. The URL is left as it is, so these
 * jumps add no history entries for the back control to walk through. Renders nothing.
 */
export function InPageLinks() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      // Links with their own handler (e.g. citation chips) have already prevented the default.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href^='#']");
      const id = link?.getAttribute("href")?.slice(1);
      const target = id ? document.getElementById(decodeURIComponent(id)) : null;
      if (!target) return;
      event.preventDefault();
      scrollToElement(target);
    }
    // On window, so it runs after React's own handlers (attached to the document).
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);
  return null;
}

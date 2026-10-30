"use client";

import { useEffect } from "react";
import { scrollToElement } from "@/lib/helpers/scroll";

/**
 * Jumps to a highlighted element once the page has rendered (source pages opened from a quote), its top just
 * below the pinned bars. Deliberately instant, overriding the app-wide smooth scrolling: animating down a long
 * surah tires the eye.
 */
export function ScrollToElement({ id }: { id: string }) {
  useEffect(() => {
    const element = document.getElementById(id);
    if (element) scrollToElement(element, { instant: true });
  }, [id]);
  return null;
}

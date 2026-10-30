"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { recordVisit } from "@/lib/helpers/site-history";

/** Remembers in-site page views so back controls know whether history stays on this site. Renders nothing. */
export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    // The browser URL, not `pathname`: the proxy rewrites Arabic pages, so the two can differ.
    recordVisit(window.location.pathname + window.location.search);
  }, [pathname]);
  return null;
}

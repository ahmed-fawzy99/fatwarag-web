"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/client";
import type { AnalyticsEvent } from "@/lib/analytics/events";

/**
 * Sends an event when it appears on screen, once. Lets server-rendered parts (search results, a shared page) report
 * what was shown. Renders nothing. `event` is a plain value, so server components can pass it.
 */
export function TrackOnMount({ event }: { event: AnalyticsEvent }) {
  const key = JSON.stringify(event);
  useEffect(() => {
    trackEvent(JSON.parse(key) as AnalyticsEvent);
  }, [key]);
  return null;
}

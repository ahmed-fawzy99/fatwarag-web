"use client";

import { trackEvent } from "@/lib/analytics/client";
import type { AnalyticsEvent } from "@/lib/analytics/events";

type TrackedAnchorProps = React.ComponentProps<"a"> & { event: AnalyticsEvent };

/** A plain link that reports an event when it is clicked. For links rendered by server components. */
export function TrackedAnchor({ event, onClick, ...rest }: TrackedAnchorProps) {
  return (
    <a
      {...rest}
      onClick={(clickEvent) => {
        onClick?.(clickEvent);
        trackEvent(event);
      }}
    />
  );
}

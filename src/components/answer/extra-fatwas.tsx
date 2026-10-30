"use client";

import { useSummarySession } from "@/hooks/use-summary-session";
import type { SummaryRequest } from "@/types/answer";

/**
 * Cross-referenced fatwas the summary cites that the search didn't return, appended after the list once the
 * summary is final. It shares the summary's one request, so it costs no extra call.
 */
export function ExtraFatwas({ request }: { request: SummaryRequest }) {
  const state = useSummarySession(request);
  return state.phase === "ready" ? state.extras : null;
}

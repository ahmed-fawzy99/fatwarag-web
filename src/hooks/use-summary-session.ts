"use client";

import { useCallback, useSyncExternalStore } from "react";
import { INITIAL_SUMMARY_STATE, subscribeSummary, summarySnapshot, type SummarySessionState } from "@/lib/answer/summary-session";
import type { SummaryRequest } from "@/types/answer";

/**
 * The answer's summary as it is written and checked. Every component watching the same answer shares one
 * request, keyed by answer and locale: it starts when the first one mounts (never during server rendering), and
 * re-renders or remounts reuse it. It stops only if they all leave before it finishes.
 */
export function useSummarySession(request: SummaryRequest): SummarySessionState {
  const subscribe = useCallback((listener: () => void) => subscribeSummary(request, listener), [request]);
  const snapshot = useCallback(() => summarySnapshot(request), [request]);
  return useSyncExternalStore(subscribe, snapshot, () => INITIAL_SUMMARY_STATE);
}

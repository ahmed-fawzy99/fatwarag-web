"use client";

import { useSummarySession } from "@/hooks/use-summary-session";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { SummaryRequest } from "@/types/answer";
import { ShareDialog } from "./share-dialog";

/**
 * The answer page's «مشاركة» link. It appears once the summary has settled (written, paused or failed), so a share
 * carries the final summary when there is one; it shares the page's one summary request, never starting another.
 */
export function ShareAnswer({ request, strings }: { request: SummaryRequest; strings: Dictionary["share"] }) {
  const { phase } = useSummarySession(request);
  if (phase === "working") return null;
  return <ShareDialog answerId={request.answerId} locale={request.locale} strings={strings} />;
}

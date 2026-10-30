"use client";

import { CircleSlashIcon, TriangleAlertIcon } from "lucide-react";
import { ShareAnswer } from "@/components/share/share-answer";
import { useSummarySession } from "@/hooks/use-summary-session";
import { summaryParts } from "@/lib/answer/summary-session";
import type { Locale } from "@/lib/config/i18n";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { CitationInfo, SummaryRequest } from "@/types/answer";
import { SummaryCard, type SummaryStrings } from "./summary-card";

type SummarySectionProps = {
  locale: Locale;
  request: SummaryRequest;
  strings: SummaryStrings & Pick<Dictionary["ask"], "summaryPaused" | "summaryFailed" | "fatwasBelow">;
  reportStrings: Dictionary["report"];
  shareStrings: Dictionary["share"];
  /** How the listed fatwas show when cited, in list order. */
  citations: CitationInfo;
};

/** A short note in place of the summary; «{fatwas}» in the text becomes a link that scrolls to the fatwa list. */
function SummaryNote({ icon: Icon, text, fatwasLabel }: { icon: typeof CircleSlashIcon; text: string; fatwasLabel: string }) {
  const [before, after = ""] = text.split("{fatwas}");
  return (
    <p role="status" className="flex items-start gap-2.5 rounded-xl border border-dashed bg-sunken px-4 py-3 text-sm text-ink-soft">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span>
        {before}
        {text.includes("{fatwas}") && (
          <a href="#fatwas-heading" className="quote-link">
            {fatwasLabel}
          </a>
        )}
        {after}
      </span>
    </p>
  );
}

/**
 * The summary as it is written: what it is doing, then each part once it has passed every check (nothing
 * unchecked is ever shown), then the final summary. When the monthly budget is used up (paused) or the summary
 * can't be written (failed), a short note stands in and the fatwa list carries the page.
 */
export function SummarySection({ locale, request, strings, reportStrings, shareStrings, citations }: SummarySectionProps) {
  const state = useSummarySession(request);
  // The «مشاركة» link shows once the summary has settled: beside the report link in the card, or under the note.
  const share = <ShareAnswer request={request} strings={shareStrings} />;
  if (state.phase === "paused" || state.phase === "failed") {
    return (
      <div className="flex flex-col gap-2">
        {state.phase === "paused" ? (
          <SummaryNote icon={CircleSlashIcon} text={strings.summaryPaused} fatwasLabel={strings.fatwasBelow} />
        ) : (
          <SummaryNote icon={TriangleAlertIcon} text={strings.summaryFailed} fatwasLabel={strings.fatwasBelow} />
        )}
        <div className="flex justify-end px-1">{share}</div>
      </div>
    );
  }

  return (
    <SummaryCard
      locale={locale}
      question={request.question}
      strings={strings}
      reportStrings={reportStrings}
      summary={state.summary}
      stage={state.stage}
      parts={state.summary ? summaryParts(state.summary) : state.parts}
      evidence={state.evidence}
      // Citation numbers follow the list: the search results, then the cross-referenced fatwas appended after them.
      citations={{ ...citations, ...state.citations }}
      share={share}
    />
  );
}

import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { citationInfo, fatwaEntries } from "@/components/answer/fatwa-entries";
import { SummaryCard } from "@/components/answer/summary-card";
import { SummaryEvidence } from "@/components/answer/summary-evidence";
import { Disclaimer } from "@/components/common/disclaimer";
import { RetryButton } from "@/components/common/retry-button";
import { StatusMessage } from "@/components/common/status-message";
import { FatwaAccordion } from "@/components/fatwa/fatwa-accordion";
import { evidenceKey, summaryParts } from "@/lib/answer/summary-session";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { getFatwasByIds } from "@/lib/data-access/fatwas";
import { fatwaTitle } from "@/lib/helpers/fatwa";
import { normalizeSummary, summaryEvidenceLists } from "@/lib/helpers/shared-answer";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { SharedAnswer } from "@/types/share";
import { TrackOnMount } from "@/components/analytics/track-on-mount";
import { EVENTS } from "@/lib/analytics/events";
import { SharedAnswerStructuredData } from "./shared-answer-structured-data";

type SharedAnswerViewProps = { share: SharedAnswer; dict: Dictionary };

/**
 * A shared answer, shown like the answer page from what was saved: the question, the stored summary (if any), the
 * disclaimer and the fatwa list. No search and no AI run here. Shown in the language it was shared in.
 */
export async function SharedAnswerView({ share, dict }: SharedAnswerViewProps) {
  const locale: Locale = share.locale;
  const fatwas = await getFatwasByIds(share.fatwaIds, locale).catch(() => null);

  if (!fatwas) {
    return (
      <StatusMessage icon={TriangleAlertIcon} title={dict.errorPage.title} body={dict.errorPage.body} tone="error">
        <RetryButton label={dict.errorPage.retry} />
      </StatusMessage>
    );
  }

  const summary = share.summary ? normalizeSummary(share.summary) : null;
  const [entries, citations, evidence] = await Promise.all([
    fatwaEntries({ locale, dict, question: share.question }, fatwas, 0),
    citationInfo(fatwas, locale, 0),
    summary ? renderEvidence(summary, locale, dict) : {},
  ]);

  return (
    <>
      <TrackOnMount event={{ name: EVENTS.sharedPageViewed, props: { locale, share_id: share.id } }} />
      <SharedAnswerStructuredData share={share} fatwaTitles={fatwas.map((fatwa) => fatwaTitle(fatwa, locale).title)} />

      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl leading-snug font-bold text-balance">{share.question}</h1>
        <p className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
          <span>{dict.sharedPage.note}</span>
          <Link href={routes.home(locale)} className="quote-link">
            {dict.sharedPage.askOwn}
          </Link>
        </p>
      </header>

      {summary && (
        <SummaryCard
          locale={locale}
          question={share.question}
          // The whole `ask` dictionary: a superset of the card's strings, so new ones reach it without a change here.
          strings={dict.ask}
          reportStrings={dict.report}
          summary={summary}
          stage="reading"
          parts={summaryParts(summary)}
          evidence={evidence}
          citations={citations}
        />
      )}

      <Disclaimer title={dict.disclaimer.title} body={dict.disclaimer.body} />

      {entries.length > 0 && (
        <section aria-labelledby="fatwas-heading" className="flex flex-col gap-3">
          <h2 id="fatwas-heading" className="scroll-mt-pinned text-lg font-semibold">
            {dict.ask.fatwasTitle}
          </h2>
          <FatwaAccordion locale={locale} entries={entries} translatedLabel={dict.fatwa.translated} defaultOpenId={entries[0]?.id ?? null} />
        </section>
      )}
    </>
  );
}

/** The summary's verses and hadiths, rendered from stored text like the live page, keyed for the summary card. */
function renderEvidence(summary: NonNullable<SharedAnswer["summary"]>, locale: Locale, dict: Dictionary): Record<string, ReactNode> {
  return Object.fromEntries(
    summaryEvidenceLists(summary).map((list) => [evidenceKey(list), <SummaryEvidence key={evidenceKey(list)} evidence={list} locale={locale} dict={dict} />]),
  );
}

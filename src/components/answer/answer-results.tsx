import { BanIcon, CircleSlashIcon, HourglassIcon, MessageSquareWarningIcon, SearchXIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { TrackOnMount } from "@/components/analytics/track-on-mount";
import { Disclaimer } from "@/components/common/disclaimer";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { RelatedFatwas } from "@/components/common/related-fatwas";
import { RetryButton } from "@/components/common/retry-button";
import { StatusMessage } from "@/components/common/status-message";
import { FatwaAccordion } from "@/components/fatwa/fatwa-accordion";
import { QuestionForm } from "@/components/search/question-form";
import { buttonVariants } from "@/components/ui/button";
import { EVENTS, type AnalyticsEvent } from "@/lib/analytics/events";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { getFatwasByIds } from "@/lib/data-access/fatwas";
import { searchFatwas, type SearchFailure } from "@/lib/data-access/search";
import { formatNumber } from "@/lib/helpers/format";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { format, formatPlural } from "@/lib/i18n/format";
import type { SearchResult, SummaryRequest } from "@/types/answer";
import type { Fatwa } from "@/types/fatwa";
import { ExtraFatwas } from "./extra-fatwas";
import { citationInfo, fatwaEntries } from "./fatwa-entries";
import { SummarySection } from "./summary-section";

type AnswerResultsProps = {
  locale: Locale;
  dict: Dictionary;
  question: string;
  followUp: string | null;
};

/** What the visitor was shown instead of results, for analytics (kinds only; never the question). */
function failureEvent(kind: SearchFailure, locale: Locale, isFollowUp: boolean): AnalyticsEvent {
  if (kind === "offTopic") return { name: EVENTS.offTopicShown, props: { locale } };
  if (kind === "notFound") return { name: EVENTS.searchResultsShown, props: { locale, count: 0, none_found: true, sources_searched: 0, is_follow_up: isFollowUp } };
  return { name: EVENTS.searchFailed, props: { locale, reason: kind === "limit" || kind === "rate" || kind === "invalid" ? kind : "error" } };
}

function SearchFailureMessage({ kind, locale, dict, followUp = false }: { kind: SearchFailure; locale: Locale; dict: Dictionary; followUp?: boolean }) {
  return (
    <>
      <TrackOnMount event={failureEvent(kind, locale, followUp)} />
      <SearchFailureView kind={kind} locale={locale} dict={dict} />
    </>
  );
}

function SearchFailureView({ kind, locale, dict }: { kind: SearchFailure; locale: Locale; dict: Dictionary }) {
  if (kind === "limit") return <StatusMessage icon={HourglassIcon} title={dict.ask.limitTitle} body={dict.ask.limitBody} />;
  if (kind === "rate") return <StatusMessage icon={CircleSlashIcon} title={dict.ask.rateLimitTitle} body={dict.ask.rateLimitBody} />;
  if (kind === "offTopic") return <StatusMessage icon={BanIcon} title={dict.ask.offTopicTitle} body={dict.ask.offTopicBody} />;
  if (kind === "invalid") return <StatusMessage icon={MessageSquareWarningIcon} title={dict.ask.invalidTitle} body={dict.ask.invalidBody} />;
  if (kind === "notFound") {
    return (
      <StatusMessage icon={SearchXIcon} title={dict.ask.nothingFoundTitle} body={dict.ask.nothingFoundBody}>
        <Link href={routes.topics(locale)} className={buttonVariants({ variant: "outline" })}>
          {dict.header.topics}
        </Link>
      </StatusMessage>
    );
  }
  return (
    <StatusMessage icon={TriangleAlertIcon} title={dict.ask.errorTitle} body={dict.ask.errorBody} tone="error">
      <RetryButton label={dict.ask.retry} />
    </StatusMessage>
  );
}

type ListProps = { locale: Locale; dict: Dictionary; result: SearchResult };

async function FatwaList({ fatwas, summary, ...props }: ListProps & { fatwas: Fatwa[]; summary: SummaryRequest }) {
  const { locale, dict, result } = props;
  const entries = await fatwaEntries({ locale, dict, question: result.question }, fatwas, 0);

  return (
    <section aria-labelledby="fatwas-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="fatwas-heading" className="scroll-mt-pinned text-lg font-semibold">
          {dict.ask.fatwasTitle}
        </h2>
        <span className="text-sm text-muted-foreground">{dict.ask.fatwasOrder}</span>
      </div>
      <FatwaAccordion locale={locale} entries={entries} translatedLabel={dict.fatwa.translated} defaultOpenId={entries[0]?.id ?? null} />
      <ExtraFatwas request={summary} />
    </section>
  );
}

/**
 * The answer page body. The search runs straight away (bots are handled by Cloudflare Bot Fight Mode and the
 * API's limits). Fatwas show as soon as the search returns, then the summary streams in.
 */
export async function AnswerResults({ locale, dict, question, followUp }: AnswerResultsProps) {
  const outcome = await searchFatwas({
    question: followUp ?? question,
    followUpOf: followUp ? question : null,
    locale,
  });

  return outcome.ok ? (
    <AnswerBody locale={locale} dict={dict} result={outcome.result} />
  ) : (
    <SearchFailureMessage kind={outcome.kind} locale={locale} dict={dict} followUp={Boolean(followUp)} />
  );
}

async function AnswerBody({ locale, dict, result }: { locale: Locale; dict: Dictionary; result: SearchResult }) {
  const fatwas = await getFatwasByIds(result.fatwaIds, locale).catch(() => null);
  if (!fatwas) return <SearchFailureMessage kind="error" locale={locale} dict={dict} />;
  if (fatwas.length === 0) return <SearchFailureMessage kind="notFound" locale={locale} dict={dict} followUp={Boolean(result.mergedFrom)} />;
  const topFatwa = fatwas[0];
  const citations = await citationInfo(fatwas, locale, 0);
  // The page asks for its one summary through this; the summary card and the appended fatwas share it.
  const summary: SummaryRequest = { answerId: result.answerId, locale, question: result.question, listedIds: result.fatwaIds, offset: fatwas.length };
  const summaryStrings = {
    summaryEyebrow: dict.ask.summaryEyebrow,
    jumpToFatwas: dict.ask.jumpToFatwas,
    askTrusted: dict.ask.askTrusted,
    summaryOtherViews: dict.ask.summaryOtherViews,
    summaryDetailsBelow: dict.ask.summaryDetailsBelow,
    summaryNote: dict.ask.summaryNote,
    summaryMoreLead: dict.ask.summaryMoreLead,
    summaryMoreLink: dict.ask.summaryMoreLink,
    summaryMoreEnd: dict.ask.summaryMoreEnd,
    reportSummary: dict.ask.reportSummary,
    summaryStages: dict.ask.summaryStages,
    summaryPaused: dict.ask.summaryPaused,
    summaryFailed: dict.ask.summaryFailed,
    fatwasBelow: dict.ask.fatwasBelow,
  };
  const questionStrings = {
    label: dict.ask.followUpLabel,
    placeholder: dict.ask.followUpPlaceholder,
    submit: dict.ask.followUpSubmit,
    submitting: dict.search.submitting,
    emptyError: dict.search.emptyError,
    tooShortError: dict.search.tooShortError,
    linkError: dict.search.linkError,
  };

  return (
    <>
      <TrackOnMount
        event={{
          name: EVENTS.searchResultsShown,
          props: { locale, count: fatwas.length, none_found: false, sources_searched: result.sourcesSearched, is_follow_up: Boolean(result.mergedFrom) },
        }}
      />
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        {result.mergedFrom && (
          <p className="text-base text-foreground">
            <span className="text-muted-foreground">{dict.ask.searchingFor}</span> <b className="font-semibold">{result.question}</b>
          </p>
        )}
        <p className="flex flex-wrap gap-x-4">
          <span>{format(dict.ask.searchedSources, { sources: formatNumber(result.sourcesSearched, locale) })}</span>
          <a href="#fatwas-heading" className="quote-link">
            {formatPlural(dict.ask.foundFatwas, fatwas.length, locale, formatNumber(fatwas.length, locale))}
          </a>
        </p>
      </div>

      <SummarySection locale={locale} request={summary} strings={summaryStrings} reportStrings={dict.report} shareStrings={dict.share} citations={citations} />

      <Disclaimer title={dict.disclaimer.title} body={dict.disclaimer.body} />

      <FatwaList locale={locale} dict={dict} result={result} fatwas={fatwas} summary={summary} />

      <QuestionForm locale={locale} strings={questionStrings} followUpOf={result.question} />

      <Suspense fallback={<ListSkeleton rows={3} />}>
        <RelatedFatwas locale={locale} dict={dict} topicKeys={topFatwa.topicKeys} excludeIds={result.fatwaIds} />
      </Suspense>
    </>
  );
}

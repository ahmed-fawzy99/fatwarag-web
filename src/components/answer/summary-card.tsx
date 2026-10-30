"use client";

import { ArrowDownIcon, TextIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ReportDialog } from "@/components/report/report-dialog";
import { evidenceKey } from "@/lib/answer/summary-session";
import type { Locale } from "@/lib/config/i18n";
import { localizeDigits } from "@/lib/helpers/format";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { cn } from "@/lib/utils";
import type { CitationInfo, Evidence, Summary, SummaryPart, SummaryPoint, SummaryQuestionPart, SummaryStage } from "@/types/answer";
import { CitationChip } from "./citation-chip";

export type SummaryStrings = Pick<
  Dictionary["ask"],
  "summaryEyebrow" | "jumpToFatwas" | "askTrusted" | "summaryOtherViews" | "summaryDetailsBelow" | "summaryNote" | "summaryMoreLead" | "summaryMoreLink" | "summaryMoreEnd" | "reportSummary" | "summaryStages"
>;

type SummaryCardProps = {
  locale: Locale;
  question: string;
  strings: SummaryStrings;
  reportStrings: Dictionary["report"];
  /** Set once the authoritative summary has arrived; until then the card shows its progress. */
  summary: Summary | null;
  stage: SummaryStage;
  /** The parts to show, in display order: the checked parts so far, or the finished summary's. */
  parts: SummaryPart[];
  /** Server-rendered verses and hadiths, by `evidenceKey`. */
  evidence: Record<string, ReactNode>;
  /** Fatwa ids in list order, with their numbers; citation numbers follow this order. */
  citations: CitationInfo;
  /** The «مشاركة» link, shown beside the report link once the summary is final. */
  share?: ReactNode;
};

/** Each part fades in once, when it first appears; never under reduced motion. */
const REVEAL = "animate-in fade-in duration-700 ease-out motion-reduce:animate-none";

function Citations({ ids, info, locale }: { ids: string[]; info: CitationInfo; locale: Locale }) {
  const order = Object.keys(info);
  const known = ids.filter((id) => info[id]).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  // A cited fatwa missing from the list (e.g. it couldn't be loaded) is shown as a plain label, never a broken link.
  const unknown = ids.filter((id) => !info[id]);
  return (
    <span className="whitespace-nowrap">
      {known.map((id) => (
        <CitationChip key={id} locale={locale} fatwaId={id} {...info[id]} />
      ))}
      {unknown.map((id) => (
        <span key={id} className="mx-0.5 inline-flex h-5 items-center rounded-md bg-sunken px-1.5 align-[2px] font-sans text-[0.72rem] text-muted-foreground">
          {localizeDigits(id.split("-").slice(1).join("-") || id, locale)}
        </span>
      ))}
    </span>
  );
}

function EvidenceSlot({ evidence, rendered }: { evidence: Evidence[]; rendered: Record<string, ReactNode> }) {
  if (evidence.length === 0) return null;
  return rendered[evidenceKey(evidence)] ?? null;
}

type PointProps = { point: SummaryPoint; info: CitationInfo; locale: Locale; evidence: Record<string, ReactNode>; tone: "agreed" | "view" };

function Point({ point, info, locale, evidence, tone }: PointProps) {
  return (
    <div className={cn(REVEAL, tone === "view" ? "rounded-xl border-s-[3px] border-primary bg-sunken px-4 py-3" : "py-1")}>
      <div className="mb-1 flex flex-wrap items-baseline gap-x-2 font-sans">
        <h3 className="text-[0.98rem] font-semibold">{point.title}</h3>
        {point.heldBy && <span className="text-sm text-muted-foreground">{point.heldBy}</span>}
      </div>
      <p className="text-reading">
        {point.body} <Citations ids={point.citations} info={info} locale={locale} />
      </p>
      <EvidenceSlot evidence={point.evidence} rendered={evidence} />
    </div>
  );
}

/** The line for a part of the question no fatwa answers (the owner's wording), followed by the part's label. */
const UNANSWERED: Record<Locale, string> = {
  ar: "لم نجد في الفتاوى أدناه جوابًا عن:",
  en: "The fatwas below don't answer:",
};

type ItemsProps = { parts: SummaryPart[]; info: CitationInfo; locale: Locale; evidence: Record<string, ReactNode> };

/** Agreed point, views and preferences, in display order. */
function MainItems({ parts, info, locale, evidence }: ItemsProps) {
  const main = parts.filter((part) => part.section !== "caution");
  if (main.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {main.map((part) =>
        part.section === "preference" ? (
          <p key={`preference-${part.index}`} className={cn(REVEAL, "text-reading")}>
            {part.item.text} <Citations ids={part.item.citations} info={info} locale={locale} />
          </p>
        ) : (
          <Point
            key={`${part.section}-${part.index}`}
            point={part.item}
            info={info}
            locale={locale}
            evidence={evidence}
            tone={part.section === "view" ? "view" : "agreed"}
          />
        ),
      )}
    </div>
  );
}

function Caution({ part, info, locale, evidence }: { part: SummaryPart | undefined; info: CitationInfo; locale: Locale; evidence: Record<string, ReactNode> }) {
  if (part?.section !== "caution") return null;
  return (
    <div className={cn(REVEAL, "text-reading")}>
      {part.item.text} <Citations ids={part.item.citations} info={info} locale={locale} />
      <EvidenceSlot evidence={part.item.evidence} rendered={evidence} />
    </div>
  );
}

type QuestionPartGroup = { index: number; label: string; final: SummaryQuestionPart | null; items: SummaryPart[] };

/** The question's parts in order: from the finished summary, or, while streaming, from the items shown so far. */
function questionParts(summary: Summary | null, parts: SummaryPart[]): QuestionPartGroup[] | null {
  const streamed = parts.filter((part) => part.part !== undefined);
  if (summary?.parts?.length) {
    return summary.parts.map((final, index) => ({ index, label: final.label, final, items: parts.filter((part) => part.part === index) }));
  }
  if (summary || streamed.length === 0) return null;
  const indexes = [...new Set(streamed.map((part) => part.part as number))].sort((a, b) => a - b);
  return indexes.map((index) => {
    const items = streamed.filter((part) => part.part === index);
    return { index, label: items[0]?.partLabel ?? "", final: null, items };
  });
}

/**
 * One part of a question asked in parts, under a small sub-heading: its headline (once final), its items and its
 * caution, or, when no fatwa answers it, a plain line saying so.
 */
type OtherViewsText = Pick<SummaryStrings, "summaryOtherViews" | "summaryDetailsBelow">;

/**
 * The fixed line pointing the reader to the fatwas below, as the API chose it (`note`): the other views, or the
 * details. Answers stored before `note` carry `otherViews` instead.
 */
function OtherViews({ final, text, className }: { final: Pick<Summary, "note" | "otherViews" | "views"> | null | undefined; text: OtherViewsText; className?: string }) {
  const note = final?.note ?? (final?.otherViews ? (final.views.length > 0 ? "otherViews" : "details") : null);
  if (!note) return null;
  return <p className={cn(REVEAL, "text-reading text-ink-soft", className)}>{note === "otherViews" ? text.summaryOtherViews : text.summaryDetailsBelow}</p>;
}

type QuestionPartProps = { group: QuestionPartGroup; info: CitationInfo; locale: Locale; evidence: Record<string, ReactNode>; otherViewsText: OtherViewsText };

function QuestionPart({ group, info, locale, evidence, otherViewsText }: QuestionPartProps) {
  const unanswered = group.final !== null && (group.final.kind === "unanswered" || group.items.length === 0);
  return (
    <section aria-label={group.label} className={cn(REVEAL, "flex flex-col gap-2")}>
      <h3 className="font-sans text-sm font-semibold text-accent-foreground">{group.label}</h3>
      {unanswered ? (
        <p className="text-reading text-ink-soft">
          {UNANSWERED[locale]} {group.label}
        </p>
      ) : (
        <>
          {group.final?.headline && <p className="font-semibold text-balance">{group.final.headline}</p>}
          <MainItems parts={group.items} info={info} locale={locale} evidence={evidence} />
          <OtherViews final={group.final} text={otherViewsText} />
          {group.items.some((part) => part.section === "caution") && (
            <div className="mt-1 border-t border-dashed pt-2 text-ink-soft">
              <Caution part={group.items.find((part) => part.section === "caution")} info={info} locale={locale} evidence={evidence} />
            </div>
          )}
        </>
      )}
    </section>
  );
}

const STAGES: SummaryStage[] = ["reading", "writing", "checking", "translating"];

/** The stages shown in the track: Arabic summaries are never translated, so they have three. */
function stagesFor(locale: Locale, stage: SummaryStage): SummaryStage[] {
  return locale === "ar" && stage !== "translating" ? STAGES.slice(0, 3) : STAGES;
}

/**
 * What the summary is doing: the stage track (finished stages filled, the current one pulsing, upcoming ones faint)
 * and the stage text with a soft shimmer and trailing dots. Under reduced motion only the still track and text remain,
 * the current step marked.
 */
function SummaryProgress({ locale, stage, label }: { locale: Locale; stage: SummaryStage; label: string }) {
  const stages = stagesFor(locale, stage);
  const current = stages.indexOf(stage);
  const text = label.replace(/(…|\.\.\.)$/, "");

  return (
    // As tall as a one-line headline, which takes its place when the summary is final, so nothing below moves.
    <div role="status" className="mb-3 flex h-[1.72rem] items-center">
      <div className="flex items-center gap-3 text-sm leading-5">
        <span aria-hidden="true" className="flex shrink-0 items-center gap-1.5">
          {stages.map((step, index) => (
            <span
              key={step}
              className={cn(
                "size-2 rounded-full transition-colors duration-500 motion-reduce:transition-none",
                index < current && "bg-primary",
                index === current && "animate-stage-pulse bg-primary ring-primary/25 motion-reduce:animate-none motion-reduce:ring-[3px]",
                index > current && "bg-primary/15",
              )}
            />
          ))}
        </span>
        <span key={stage} className="animate-in fade-in duration-500 motion-reduce:animate-none">
          <span className="text-shimmer">{text}</span>
          <span aria-hidden="true" className="text-ink-soft">
            {[0, 1, 2].map((dot) => (
              <span key={dot} className="animate-dot-fade motion-reduce:animate-none" style={{ animationDelay: `${dot * 0.2}s` }}>
                .
              </span>
            ))}
          </span>
        </span>
      </div>
    </div>
  );
}

/**
 * الخلاصة — written only from the retrieved fatwas; every claim carries citations. It fills in part by part as
 * each part passes its checks, then settles on the final summary.
 */
export function SummaryCard({ locale, question, strings, reportStrings, summary, stage, parts, evidence, citations, share }: SummaryCardProps) {
  const grouped = questionParts(summary, parts);
  const caution = grouped ? undefined : parts.find((part) => part.section === "caution");
  const differ = summary?.kind === "differ";

  return (
    <section aria-labelledby={summary ? "summary-heading" : "summary-eyebrow"} aria-busy={!summary} className="rounded-2xl border bg-card px-5 py-5 shadow-xs sm:px-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <span id="summary-eyebrow" className="flex items-center gap-2 font-semibold text-accent-foreground">
          <TextIcon className="size-4" />
          {strings.summaryEyebrow}
        </span>
        <a href="#fatwas-heading" className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-accent-foreground">
          {strings.jumpToFatwas}
          <ArrowDownIcon className="size-3.5" />
        </a>
      </div>
      {summary ? (
        <h2 id="summary-heading" className={cn(REVEAL, "mb-3 text-xl leading-snug font-bold text-balance")}>
          {summary.headline}
        </h2>
      ) : (
        <SummaryProgress locale={locale} stage={stage} label={strings.summaryStages[stage]} />
      )}

      {grouped ? (
        <div className="flex flex-col gap-5">
          {grouped.map((group) => (
            <QuestionPart key={group.index} group={group} info={citations} locale={locale} evidence={evidence} otherViewsText={strings} />
          ))}
        </div>
      ) : (
        <>
          <MainItems parts={parts} info={citations} locale={locale} evidence={evidence} />
          <OtherViews final={summary} text={strings} className="mt-3" />
        </>
      )}

      {(caution || differ) && (
        <div className="mt-4 border-t border-dashed pt-3 text-ink-soft">
          <Caution part={caution} info={citations} locale={locale} evidence={evidence} />
          {differ && <p className={cn(REVEAL, "text-reading")}>{strings.askTrusted}</p>}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3 font-sans text-sm text-muted-foreground">
        <span className="text-xs">
          {strings.summaryNote}{" "}
          {strings.summaryMoreLead}{" "}
          <a href="#fatwas-heading" className="quote-link">
            {strings.summaryMoreLink}
          </a>
          {strings.summaryMoreEnd}
        </span>
        {summary && (
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {share}
            <ReportDialog
              locale={locale}
              target={{ kind: "summary", question, summary }}
              triggerLabel={strings.reportSummary}
              strings={reportStrings}
              defaultReason="misrepresents"
            />
          </span>
        )}
      </div>
    </section>
  );
}

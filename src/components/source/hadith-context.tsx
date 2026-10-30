import { notFound } from "next/navigation";
import { PageTitle } from "@/components/common/page-title";
import { ScrollToElement } from "@/components/common/scroll-to-element";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SourceTitleBar } from "@/components/layout/source-title-bar";
import { GradingLine } from "@/components/evidence/grading-line";
import { ReportDialog } from "@/components/report/report-dialog";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { getCollection, getHadith } from "@/lib/data-access/foundations";
import { findQuoteRange } from "@/lib/helpers/arabic";
import { formatNumber } from "@/lib/helpers/format";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { format } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import type { Hadith } from "@/types/foundations";
import { ExplainPanel } from "./explain-panel";

type HadithContextProps = {
  locale: Locale;
  dict: Dictionary;
  collection: string;
  number: number;
  /** The quote from the fatwa, highlighted inside the full text (harakat-insensitive). */
  highlight: string | null;
  /** The fatwa whose quote link opened this page; attached to a report on the hadith. */
  fromFatwaId: string | null;
};

function HighlightedText({ text, quote }: { text: string; quote: string | null }) {
  const range = quote ? findQuoteRange(text, quote) : null;
  if (!range) return <>{text}</>;
  return (
    <>
      {text.slice(0, range.start)}
      <mark className="rounded bg-highlight px-0.5 text-inherit">{text.slice(range.start, range.end)}</mark>
      {text.slice(range.end)}
    </>
  );
}

function HadithGrading({ hadith, locale, dict }: { hadith: Hadith; locale: Locale; dict: Dictionary }) {
  if (hadith.grades.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-[0.8rem] text-muted-foreground">
      <GradingLine locale={locale} grades={hadith.grades} strings={dict.evidence} />
    </div>
  );
}

/** The hadith as held in the hadith library (Dorar), with its gradings; the quoted part is highlighted. */
export async function HadithContext({ locale, dict, collection, number, highlight, fromFatwaId }: HadithContextProps) {
  const [target, book] = await Promise.all([getHadith({ collection, number }, locale), getCollection(collection)]);
  if (!target) notFound();
  // Dorar hadiths have no book sections, so the page shows the one hadith (the list keeps room for neighbours).
  const neighbours = [target];
  const s = dict.sourcePage;
  // Without its collection record the hadith is still shown, titled «حديث».
  const bookName = book ? (locale === "ar" ? book.nameAr : book.nameEn) : null;
  // Arabic pages never fall back to the English chapter name.
  const sectionName = locale === "ar" ? target.sectionAr : (target.sectionEn ?? target.sectionAr);
  const hadithLabel = format(s.hadithNumber, { number: formatNumber(Math.floor(target.displayNumber), locale) });

  return (
    // --subbar-h: the pinned source title bar, so the hadith anchor lands below it.
    <article className="flex flex-col gap-5 [--subbar-h:2.5rem]">
      <Breadcrumbs
        locale={locale}
        strings={dict.nav}
        items={[{ label: dict.nav.hadith }, ...(bookName ? [{ label: bookName }] : []), { label: hadithLabel, href: routes.hadith(locale, collection, number) }]}
        // Opened from a fatwa's quote (usually in a new tab): back leads to that fatwa.
        backHref={fromFatwaId ? routes.fatwa(locale, fromFatwaId) : undefined}
        structuredData
      />
      <SourceTitleBar title={bookName ?? dict.nav.hadith} detail={bookName ? hadithLabel : formatNumber(Math.floor(target.displayNumber), locale)}>
        <PageTitle title={bookName ?? hadithLabel} subtitle={sectionName} eyebrow={s.isnadNote} />
      </SourceTitleBar>

      <ol className="flex flex-col gap-3">
        {neighbours.map((hadith) => {
          const isTarget = hadith.number === target.number;
          return (
            <li
              key={hadith.number}
              id={`hadith-${hadith.number}`}
              className={cn("flex scroll-mt-pinned flex-col gap-2 rounded-xl border px-4 py-3", isTarget ? "border-primary/40 bg-card shadow-xs" : "bg-card/60")}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="w-fit rounded-full bg-sunken px-2.5 py-0.5 font-sans text-xs text-ink-soft">
                  {format(s.hadithNumber, { number: formatNumber(Math.floor(hadith.displayNumber), locale) })}
                </span>
                <ReportDialog
                  locale={locale}
                  target={{
                    kind: "hadith",
                    collection,
                    number: hadith.number,
                    ...(isTarget ? { quote: highlight, referrerFatwaId: fromFatwaId } : {}),
                  }}
                  triggerLabel={s.report}
                  strings={dict.report}
                  defaultReason="wrongLink"
                />
              </div>
              <p dir="rtl" lang="ar" className={cn("text-reading", !isTarget && "text-ink-soft")}>
                <HighlightedText text={hadith.ar} quote={isTarget ? highlight : null} />
              </p>
              {locale === "en" && hadith.en && <p className="text-reading text-ink-soft">{hadith.en}</p>}
              <HadithGrading hadith={hadith} locale={locale} dict={dict} />
              {hadith.explanation ? (
                <ExplainPanel kind="passage" passage={hadith.explanation} strings={s} />
              ) : (
                <ExplainPanel kind="note" note={s.noHadithExplanation} strings={s} />
              )}
            </li>
          );
        })}
      </ol>
      <ScrollToElement id={`hadith-${target.number}`} />
    </article>
  );
}

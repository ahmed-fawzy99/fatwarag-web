import { ArrowUpLeftIcon, ArrowUpRightIcon, LanguagesIcon } from "lucide-react";
import { LOCALE_META, type Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { getCollection, getHadith } from "@/lib/data-access/foundations";
import { formatNumber } from "@/lib/helpers/format";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { HadithKey } from "@/types/content";
import { type FatwaGrading, GradingLine } from "./grading-line";
import { TrackedAnchor } from "@/components/analytics/tracked-anchor";
import { EVENTS } from "@/lib/analytics/events";
import { dorarSearchUrl } from "@/lib/helpers/dorar";
import { NotFoundReference } from "./not-found-reference";

type HadithBlockProps = {
  locale: Locale;
  quote: string;
  /** Stored AI translation of the quote, shown on English pages above the Arabic original. */
  quoteEn?: string | null;
  hadithRef: HadithKey | null;
  /** The fatwa the quote was taken from, carried to the source page for reports. */
  fatwaId?: string | null;
  fatwaGrading: FatwaGrading | null;
  strings: Dictionary["evidence"] & { notFound: string; searchSource: string; translated: string };
};

export function SourceLinkIcon({ locale }: { locale: Locale }) {
  const Icon = LOCALE_META[locale].dir === "rtl" ? ArrowUpLeftIcon : ArrowUpRightIcon;
  return <Icon className="size-3" aria-hidden="true" />;
}

/** A hadith shown as evidence: the stored quote, its source link and its grading line. */
export async function HadithBlock({ locale, quote, quoteEn, hadithRef, fatwaId = null, fatwaGrading, strings }: HadithBlockProps) {
  // A failed lookup shows the quote as not found rather than breaking the fatwa or summary around it.
  const hadith = hadithRef ? await getHadith(hadithRef, locale).catch(() => null) : null;
  const collection = hadith ? await getCollection(hadith.collection) : null;
  const href = hadith ? routes.hadith(locale, hadith.collection, hadith.number, { quote, fromFatwaId: fatwaId }) : null;

  const clicked = { name: EVENTS.evidenceClicked, props: { locale, kind: "hadith", surface: "summary", ref: hadith ? `${hadith.collection}/${hadith.number}` : "" } } as const;

  return (
    <div className="my-2 rounded-xl border bg-card px-4 py-3">
      {locale !== "ar" && quoteEn && (
        <div className="mb-1.5 flex flex-col gap-1">
          <p lang="en" dir="ltr" className="text-reading">
            “{quoteEn}”
          </p>
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-sunken px-2 py-0.5 font-sans text-[0.7rem] text-ink-soft">
            <LanguagesIcon className="size-3" /> {strings.translated}
          </span>
        </div>
      )}
      <p dir="rtl" lang="ar" className={locale !== "ar" && quoteEn ? "text-reading text-ink-soft" : "text-reading text-[1.12rem]"}>
        {href ? (
          <TrackedAnchor event={clicked} href={href} target="_blank" rel="noopener" className="quote-link" title={strings.openSource}>
            «{quote}»
          </TrackedAnchor>
        ) : (
          <NotFoundReference locale={locale} text={`«${quote}»`} note={strings.notFound} search={{ href: dorarSearchUrl(quote), label: strings.searchSource }} />
        )}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-[0.8rem] text-muted-foreground">
        {hadith && collection && href && (
          <span>
            {strings.source}:{" "}
            <TrackedAnchor event={clicked} href={href} target="_blank" rel="noopener" className="source-link inline-flex items-center gap-1">
              {locale === "ar" ? collection.nameAr : collection.nameEn} · {formatNumber(Math.floor(hadith.displayNumber), locale)}
              <SourceLinkIcon locale={locale} />
            </TrackedAnchor>
          </span>
        )}
        <GradingLine locale={locale} grades={hadith?.grades ?? []} fatwaGrading={fatwaGrading} strings={strings} />
      </div>
    </div>
  );
}

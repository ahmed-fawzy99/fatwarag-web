import { ArrowUpLeftIcon, ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { TrackOnMount } from "@/components/analytics/track-on-mount";
import { ReportDialog } from "@/components/report/report-dialog";
import { LOCALE_META, type Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { EVENTS } from "@/lib/analytics/events";
import { getMufti, getSource } from "@/lib/data-access/catalog";
import { formatGregorianDate, formatHijriDate, localizeDigits } from "@/lib/helpers/format";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { format } from "@/lib/i18n/format";
import type { Fatwa } from "@/types/fatwa";
import { FatwaText } from "./fatwa-text";
import { FatwaTranslation } from "./fatwa-translation";
import { FatwaTranslationOnOpen } from "./fatwa-translation-on-open";
import { TranslationSkeleton } from "./translation-skeleton";

type FatwaBodyProps = {
  locale: Locale;
  fatwa: Fatwa;
  dict: Dictionary;
  /** The question the user asked, attached to reports. */
  question: string | null;
  /**
   * When a missing translation is made: as the page loads (fatwa page, streamed in `<Suspense>`) or when the
   * fatwa is expanded (answer page list, so collapsed fatwas are never translated).
   */
  translateOn?: "load" | "open";
};

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span>
      {label}: <b className="font-medium text-ink-soft">{children}</b>
    </span>
  );
}

/** The full fatwa: metadata, the source's own summary, question, answer, see-also and actions. */
export async function FatwaBody({ locale, fatwa, dict, question, translateOn = "load" }: FatwaBodyProps) {
  const [mufti, source] = await Promise.all([getMufti(fatwa.muftiKey).catch(() => null), getSource(fatwa.sourceKey)]);
  const english = locale === "ar" ? null : (fatwa.en ?? fatwa.enMachine);
  const needsTranslation = locale !== "ar" && !english;
  const textStrings = {
    ...dict.fatwa,
    openSource: dict.evidence.openSource,
  };
  const OutIcon = LOCALE_META[locale].dir === "rtl" ? ArrowUpLeftIcon : ArrowUpRightIcon;
  const date = [
    fatwa.dateHijri && formatHijriDate(fatwa.dateHijri, locale),
    fatwa.dateGregorian && formatGregorianDate(fatwa.dateGregorian, locale),
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        {fatwa.sourceKey === "islamweb" || fatwa.sourceKey === "islamqa" ? (
          <Meta label={dict.fatwa.number}>{localizeDigits(fatwa.sourceFatwaId, locale)}</Meta>
        ) : null}
        {date.length > 0 && <Meta label={dict.fatwa.date}>{date.join(" · ")}</Meta>}
        {mufti && (
          <Meta label={dict.fatwa.mufti}>
            <Link href={routes.mufti(locale, mufti.key)} className="border-b border-dotted border-accent-foreground text-accent-foreground">
              {locale === "ar" ? mufti.nameAr : mufti.nameEn}
            </Link>
          </Meta>
        )}
        {fatwa.origin && <Meta label={dict.fatwa.origin}>{localizeDigits(fatwa.origin, locale)}</Meta>}
        {fatwa.referencedBy.length > 0 && (
          <Meta label={dict.fatwa.referencedBy}>
            {fatwa.referencedBy.map((id, index) => (
              <span key={id}>
                {index > 0 && "، "}
                <Link href={routes.fatwa(locale, id)} className="border-b border-dotted border-accent-foreground text-accent-foreground">
                  {localizeDigits(id.split("-").at(-1) ?? id, locale)}
                </Link>
              </span>
            ))}
          </Meta>
        )}
      </div>

      {!needsTranslation ? (
        <FatwaText locale={locale} fatwaId={fatwa.id} text={english ?? fatwa.ar} arabic={fatwa.ar} machine={Boolean(english && !fatwa.en)} strings={textStrings} />
      ) : translateOn === "open" ? (
        <FatwaTranslationOnOpen id={fatwa.id} locale={locale} arabic={fatwa.ar} strings={textStrings} />
      ) : (
        <Suspense fallback={<TranslationSkeleton label={dict.fatwa.translating} />}>
          <TrackOnMount event={{ name: EVENTS.fatwaTranslationRequested, props: { locale, fatwa_id: fatwa.id, surface: "page" } }} />
          <FatwaTranslation id={fatwa.id} locale={locale} arabic={fatwa.ar} strings={textStrings} />
        </Suspense>
      )}

      {fatwa.seeAlso.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">{dict.fatwa.seeAlso}</span>
          {fatwa.seeAlso.map((item) => (
            <a key={item.sourceFatwaId} href={item.url} target="_blank" rel="noopener" className="rounded-lg bg-sunken px-2.5 py-0.5 text-ink-soft hover:text-accent-foreground">
              {format(dict.fatwa.seeAlsoItem, { id: localizeDigits(item.sourceFatwaId, locale) })}
            </a>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
        <a href={(english ?? fatwa.ar).url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-medium text-accent-foreground hover:underline">
          {dict.fatwa.readOriginal} {source && `(${locale === "ar" ? source.nameAr : source.nameEn})`}
          <OutIcon className="size-3.5" />
        </a>
        <ReportDialog locale={locale} target={{ kind: "fatwa", fatwaId: fatwa.id, question }} triggerLabel={dict.fatwa.report} strings={dict.report} />
      </div>
    </div>
  );
}

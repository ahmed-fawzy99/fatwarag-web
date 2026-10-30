import { notFound } from "next/navigation";
import { PageTitle } from "@/components/common/page-title";
import { ScrollToElement } from "@/components/common/scroll-to-element";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SourceTitleBar } from "@/components/layout/source-title-bar";
import { ReportDialog } from "@/components/report/report-dialog";
import type { Locale } from "@/lib/config/i18n";
import { routes, type SourceLinkRef } from "@/lib/config/routes";
import { getSurah } from "@/lib/data-access/foundations";
import { formatNumber } from "@/lib/helpers/format";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { format } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { ExplainPanel } from "./explain-panel";
import { VerseAudioButton } from "./verse-audio-button";

type QuranSurahProps = {
  locale: Locale;
  dict: Dictionary;
  surahNumber: number;
  highlightAyah: number | null;
  /** Set when opened from a fatwa's quote link; attached to a report on the highlighted verse. */
  linkRef: SourceLinkRef;
};

/** The full surah, scrolled to and highlighting the referenced verse. */
export async function QuranSurah({ locale, dict, surahNumber, highlightAyah, linkRef }: QuranSurahProps) {
  const surah = await getSurah(surahNumber);
  if (!surah) notFound();
  const s = dict.sourcePage;
  const explainStrings = { ...s, tafsirNames: s.tafsirNames };
  const audioStrings = { listen: s.audioListen, pause: s.audioPause, audioFailed: s.audioFailed, reciter: s.audioReciter };
  const title = format(s.quranTitle, { surah: locale === "ar" ? surah.nameAr : surah.nameEn });

  return (
    // --subbar-h: the pinned source title bar, so verse anchors land below it.
    <article className="flex flex-col gap-5 [--subbar-h:2.5rem]">
      <Breadcrumbs
        locale={locale}
        strings={dict.nav}
        items={[{ label: dict.nav.quran }, { label: title, href: routes.quran(locale, surahNumber) }]}
        // Opened from a fatwa's quote (usually in a new tab): back leads to that fatwa.
        backHref={linkRef.fromFatwaId ? routes.fatwa(locale, linkRef.fromFatwaId) : undefined}
        structuredData
      />
      <SourceTitleBar title={title} detail={format(dict.nav.sourceNumber, { number: formatNumber(surahNumber, locale) })}>
        <PageTitle title={title} subtitle={surah.partial ? s.quranPartial : locale === "en" ? s.englishTranslationNote : null} />
      </SourceTitleBar>

      <ol className="flex flex-col gap-3">
        {surah.ayat.map((verse) => {
          const highlighted = verse.ayah === highlightAyah;
          return (
            <li
              key={verse.ayah}
              id={`ayah-${verse.ayah}`}
              className={cn(
                "flex scroll-mt-pinned flex-col gap-2 rounded-xl border px-4 py-3",
                highlighted ? "border-quran-border bg-quran" : "bg-card",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-sans text-xs text-muted-foreground">{format(s.verse, { ayah: formatNumber(verse.ayah, locale) })}</span>
                  <VerseAudioButton locale={locale} surah={surahNumber} ayah={verse.ayah} strings={audioStrings} />
                </div>
                <ReportDialog
                  locale={locale}
                  target={{
                    kind: "quran",
                    surah: surahNumber,
                    ayah: verse.ayah,
                    ...(highlighted ? { quote: linkRef.quote ?? null, referrerFatwaId: linkRef.fromFatwaId ?? null } : {}),
                  }}
                  triggerLabel={s.report}
                  strings={dict.report}
                  defaultReason="wrongLink"
                />
              </div>
              <p dir="rtl" lang="ar" className="font-quran text-[1.55rem] leading-[2.2]">
                <mark className={cn("bg-transparent text-inherit", highlighted && "rounded bg-highlight px-1")}>{verse.ar}</mark>
                <span className="px-1 text-[0.85em] text-quran-ink">﴿{formatNumber(verse.ayah, "ar")}﴾</span>
              </p>
              {locale === "en" && <p className="text-reading text-ink-soft">{verse.en}</p>}
              <ExplainPanel kind="tafsir" surah={surahNumber} ayah={verse.ayah} strings={explainStrings} />
            </li>
          );
        })}
      </ol>
      {highlightAyah && <ScrollToElement id={`ayah-${highlightAyah}`} />}
    </article>
  );
}

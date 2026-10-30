import { TrackedAnchor } from "@/components/analytics/tracked-anchor";
import { EVENTS } from "@/lib/analytics/events";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { getAyah } from "@/lib/data-access/foundations";
import { formatNumber } from "@/lib/helpers/format";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { format } from "@/lib/i18n/format";
import { SourceLinkIcon } from "./hadith-block";

type QuranBlockProps = {
  locale: Locale;
  surah: number;
  ayah: number;
  strings: Dictionary["evidence"];
};

/** A verse shown as evidence: always the stored King Fahd Complex text, never typed by the AI. */
export async function QuranBlock({ locale, surah, ayah, strings }: QuranBlockProps) {
  const verse = await getAyah(surah, ayah);
  if (!verse) return null;
  const href = routes.quran(locale, surah, ayah);
  const clicked = { name: EVENTS.evidenceClicked, props: { locale, kind: "quran", surface: "summary", ref: `${surah}:${ayah}` } } as const;
  const reference = format(strings.surahAyah, {
    surah: locale === "ar" ? verse.nameAr : verse.nameEn,
    ayah: formatNumber(ayah, locale),
  });

  return (
    <div className="my-2 rounded-xl border border-quran-border bg-quran px-4 py-3">
      <span className="block font-sans text-xs font-semibold text-quran-ink">{strings.quranLabel}</span>
      <p dir="rtl" className="font-quran text-[1.3rem] leading-[2]">
        <span className="px-1 text-[0.9em] text-quran-ink">﴿</span>
        <TrackedAnchor event={clicked} href={href} target="_blank" rel="noopener" className="quote-link" title={strings.openSource}>
          {verse.ar}
        </TrackedAnchor>
        <span className="px-1 text-[0.9em] text-quran-ink">﴾</span>
      </p>
      {locale === "en" && <p className="mt-1 text-[0.95rem] leading-relaxed text-ink-soft">{verse.en}</p>}
      <TrackedAnchor event={clicked} href={href} target="_blank" rel="noopener" className="source-link mt-1 inline-flex items-center gap-1 font-sans text-[0.8rem]">
        {reference}
        <SourceLinkIcon locale={locale} />
      </TrackedAnchor>
    </div>
  );
}

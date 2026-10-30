import { HadithBlock } from "@/components/evidence/hadith-block";
import { QuranBlock } from "@/components/evidence/quran-block";
import type { Locale } from "@/lib/config/i18n";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Evidence } from "@/types/answer";

/** The verses and hadiths a summary part cites, from stored text (server-rendered; sent to the summary card). */
export function SummaryEvidence({ evidence, locale, dict }: { evidence: Evidence[]; locale: Locale; dict: Dictionary }) {
  if (evidence.length === 0) return null;
  const strings = { ...dict.evidence, notFound: dict.fatwa.notFound, searchSource: dict.fatwa.searchSource, translated: dict.fatwa.translated };
  return (
    <div className="mt-2 flex flex-col">
      {evidence.map((item, index) =>
        item.type === "quran" ? (
          <QuranBlock key={index} locale={locale} surah={item.surah} ayah={item.ayah} strings={dict.evidence} />
        ) : (
          <HadithBlock
            key={index}
            locale={locale}
            quote={item.quote}
            quoteEn={item.quoteEn}
            hadithRef={item.ref}
            fatwaId={item.fatwaId}
            fatwaGrading={item.gradingInFatwa ? { phrase: item.gradingInFatwa, scope: item.gradingScope, context: item.gradingContext } : null}
            strings={strings}
          />
        ),
      )}
    </div>
  );
}

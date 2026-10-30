import type { FatwaAccordionEntry } from "@/components/fatwa/fatwa-accordion";
import { FatwaBody } from "@/components/fatwa/fatwa-body";
import type { Locale } from "@/lib/config/i18n";
import { listSources } from "@/lib/data-access/catalog";
import { fatwaTitle } from "@/lib/helpers/fatwa";
import { formatNumber } from "@/lib/helpers/format";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { CitationInfo } from "@/types/answer";
import type { Fatwa } from "@/types/fatwa";

type EntryContext = { locale: Locale; dict: Dictionary; question: string };

/** Accordion entries for fatwas on the answer page, numbered from `offset + 1` (the numbers citation chips use). */
export async function fatwaEntries({ locale, dict, question }: EntryContext, fatwas: Fatwa[], offset: number): Promise<FatwaAccordionEntry[]> {
  const sources = await listSources().catch(() => []);
  return fatwas.map((fatwa, index) => {
    const { title, translated } = fatwaTitle(fatwa, locale);
    const source = sources.find((s) => s.key === fatwa.sourceKey);
    return {
      id: fatwa.id,
      number: formatNumber(offset + index + 1, locale),
      title,
      titleTranslated: translated,
      sourceName: (locale === "ar" ? source?.nameAr : source?.nameEn) ?? "",
      body: <FatwaBody locale={locale} fatwa={fatwa} dict={dict} question={question} translateOn="open" />,
    };
  });
}

/** How each fatwa shows when the summary cites it, numbered from `offset + 1` like the list. */
export async function citationInfo(fatwas: Fatwa[], locale: Locale, offset: number): Promise<CitationInfo> {
  const sources = await listSources().catch(() => []);
  const info: CitationInfo = {};
  fatwas.forEach((fatwa, index) => {
    const source = sources.find((s) => s.key === fatwa.sourceKey);
    info[fatwa.id] = {
      number: formatNumber(offset + index + 1, locale),
      title: fatwaTitle(fatwa, locale).title,
      sourceName: (locale === "ar" ? source?.nameAr : source?.nameEn) ?? "",
    };
  });
  return info;
}

import type { Locale } from "@/lib/config/i18n";
import type { Fatwa } from "@/types/fatwa";

/**
 * A fatwa's title in the reader's language: the English text's title, else the English title translated up front
 * (`titleEn`, available before the body is), else the Arabic. `translated` marks a machine translation.
 */
export function fatwaTitle(fatwa: Fatwa, locale: Locale): { title: string; translated: boolean } {
  if (locale === "ar") return { title: fatwa.ar.title, translated: false };
  const english = fatwa.en ?? fatwa.enMachine;
  if (english) return { title: english.title, translated: !fatwa.en };
  if (fatwa.titleEn) return { title: fatwa.titleEn, translated: fatwa.titleEnTranslated };
  return { title: fatwa.ar.title, translated: false };
}

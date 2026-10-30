import { headers } from "next/headers";
import { userAgent } from "next/server";
import type { Locale } from "@/lib/config/i18n";
import { getTranslation } from "@/lib/data-access/fatwas";
import type { FatwaText as FatwaTextData } from "@/types/fatwa";
import { FatwaText, type FatwaTextStrings } from "./fatwa-text";

type FatwaTranslationProps = {
  id: string;
  locale: Locale;
  arabic: FatwaTextData;
  strings: FatwaTextStrings & { translationFailed: string };
};

/**
 * First-open translation on a fatwa page (render inside `<Suspense>`). Crawlers never trigger one; they get the
 * Arabic. If the translation fails or times out, the Arabic is shown and the next reader tries again.
 */
export async function FatwaTranslation({ id, locale, arabic, strings }: FatwaTranslationProps) {
  const { isBot } = userAgent({ headers: await headers() });
  const translated = isBot ? null : await getTranslation(id, locale);
  if (translated) return <FatwaText locale={locale} fatwaId={id} text={translated} arabic={arabic} machine strings={strings} />;
  return <FatwaText locale={locale} fatwaId={id} text={arabic} arabic={arabic} machine={false} note={isBot ? null : strings.translationFailed} strings={strings} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { QuranSurah } from "@/components/source/quran-surah";
import { isLocale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { getSurah } from "@/lib/data-access/foundations";
import { pageAlternates } from "@/lib/helpers/seo";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { format } from "@/lib/i18n/format";

type Props = PageProps<"/[lang]/quran/[surah]">;

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { lang, surah } = await params;
  const number = Number(surah);
  if (!isLocale(lang) || !Number.isInteger(number)) return {};
  const found = await getSurah(number).catch(() => null);
  if (!found) return {};
  const dict = await getDictionary(lang);
  const name = lang === "ar" ? found.nameAr : found.nameEn;
  return {
    title: format(dict.sourcePage.quranTitle, { surah: name }),
    description: format(dict.meta.surahDescription, { surah: name }),
    alternates: pageAlternates(lang, routes.quran("ar", number)),
  };
}

async function Content({ params, searchParams }: Props) {
  const [{ lang, surah }, query] = await Promise.all([params, searchParams]);
  const surahNumber = Number(surah);
  if (!isLocale(lang) || !Number.isInteger(surahNumber)) notFound();
  const ayah = typeof query.ayah === "string" ? Number(query.ayah) : NaN;
  const quote = typeof query.q === "string" ? query.q : null;
  const fromFatwaId = typeof query.from === "string" ? query.from : null;
  return (
    <QuranSurah
      locale={lang}
      dict={await getDictionary(lang)}
      surahNumber={surahNumber}
      highlightAyah={Number.isInteger(ayah) ? ayah : null}
      linkRef={{ quote, fromFatwaId }}
    />
  );
}

export default function QuranPage(props: Props) {
  return (
    <Suspense fallback={<ListSkeleton rows={6} />}>
      <Content {...props} />
    </Suspense>
  );
}

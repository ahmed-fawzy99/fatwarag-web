import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { HadithContext } from "@/components/source/hadith-context";
import { isLocale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { getHadith } from "@/lib/data-access/foundations";
import { formatNumber } from "@/lib/helpers/format";
import { excerpt, pageAlternates } from "@/lib/helpers/seo";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { format } from "@/lib/i18n/format";

type Props = PageProps<"/[lang]/hadith/[collection]/[number]">;

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { lang, collection, number } = await params;
  const id = Number(number);
  if (!isLocale(lang) || !Number.isInteger(id)) return {};
  const hadith = await getHadith({ collection, number: id }, lang).catch(() => null);
  if (!hadith) return {};
  const dict = await getDictionary(lang);
  return {
    title: format(dict.sourcePage.hadithTitle, { number: formatNumber(hadith.displayNumber, lang) }),
    description: excerpt(lang === "en" && hadith.en ? hadith.en : hadith.ar),
    alternates: pageAlternates(lang, routes.hadith("ar", collection, id)),
  };
}

async function Content({ params, searchParams }: Props) {
  const [{ lang, collection, number }, query] = await Promise.all([params, searchParams]);
  const hadithNumber = Number(number);
  if (!isLocale(lang) || !Number.isInteger(hadithNumber)) notFound();
  const highlight = typeof query.hl === "string" ? query.hl : null;
  const fromFatwaId = typeof query.from === "string" ? query.from : null;
  return (
    <HadithContext locale={lang} dict={await getDictionary(lang)} collection={collection} number={hadithNumber} highlight={highlight} fromFatwaId={fromFatwaId} />
  );
}

export default function HadithPage(props: Props) {
  return (
    <Suspense fallback={<ListSkeleton rows={4} />}>
      <Content {...props} />
    </Suspense>
  );
}

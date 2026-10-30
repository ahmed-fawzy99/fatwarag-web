import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { FatwaPageContent } from "@/components/fatwa/fatwa-page-content";
import { isLocale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { getFatwa } from "@/lib/data-access/fatwas";
import { fatwaTitle } from "@/lib/helpers/fatwa";
import { excerpt, pageAlternates, plainText } from "@/lib/helpers/seo";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type Props = PageProps<"/[lang]/fatwas/[id]">;

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLocale(lang)) return {};
  const fatwa = await getFatwa(id, lang).catch(() => null);
  if (!fatwa) return {};
  const english = fatwa.en ?? fatwa.enMachine;
  const text = lang === "en" && english ? english : fatwa.ar;
  const path = routes.fatwa("ar", fatwa.id);
  return {
    title: fatwaTitle(fatwa, lang).title,
    description: excerpt(plainText(text.answer)),
    // The English page is only worth indexing once a translation exists; before that it is the Arabic page again.
    alternates: pageAlternates(lang, path, english ? ["ar", "en"] : ["ar"]),
    robots: lang === "en" && !english ? { index: false, follow: true } : undefined,
  };
}

async function Content({ params }: Pick<Props, "params">) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  return <FatwaPageContent locale={lang} id={id} dict={await getDictionary(lang)} />;
}

/** Waits for the existence check below before rendering (a cached read), so a missing item gets a real 404 status. */
export const instant = false;

export default async function FatwaPage({ params }: Props) {
  // Checked before the stream starts, so a missing fatwa is a real 404 rather than a 200 carrying the not-found page.
  const { lang, id } = await params;
  if (!isLocale(lang) || !(await getFatwa(id, lang))) notFound();

  return (
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <Content params={params} />
    </Suspense>
  );
}

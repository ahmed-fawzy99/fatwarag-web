import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { MuftiProfile } from "@/components/topics/mufti-profile";
import { isLocale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { getMufti } from "@/lib/data-access/catalog";
import { pageAlternates } from "@/lib/helpers/seo";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { format } from "@/lib/i18n/format";

type Props = PageProps<"/[lang]/muftis/[key]">;

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { lang, key } = await params;
  if (!isLocale(lang)) return {};
  const mufti = await getMufti(key).catch(() => null);
  if (!mufti) return {};
  const dict = await getDictionary(lang);
  const name = lang === "ar" ? mufti.nameAr : mufti.nameEn;
  return { title: name, description: format(dict.meta.muftiDescription, { name }), alternates: pageAlternates(lang, routes.mufti("ar", key)) };
}

async function Content({ params, searchParams }: Props) {
  const [{ lang, key }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(lang)) notFound();
  const page = typeof query.page === "string" ? Math.max(1, Math.floor(Number(query.page)) || 1) : 1;
  return <MuftiProfile locale={lang} dict={await getDictionary(lang)} muftiKey={key} page={page} />;
}

/** Waits for the existence check below before rendering (a cached read), so a missing item gets a real 404 status. */
export const instant = false;

export default async function MuftiPage(props: Props) {
  // Checked before the stream starts, so a missing mufti is a real 404 rather than a 200 carrying the not-found page.
  const { key } = await props.params;
  if (!(await getMufti(key))) notFound();

  return (
    <Suspense fallback={<ListSkeleton rows={4} />}>
      <Content {...props} />
    </Suspense>
  );
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SharedAnswerView } from "@/components/share/shared-answer";
import { isLocale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { getShare } from "@/lib/data-access/shares";
import { truncateTitle } from "@/lib/helpers/shared-answer";
import { absoluteUrl } from "@/lib/helpers/seo";
import { formatNumber } from "@/lib/helpers/format";
import { formatPlural } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";
// Client components the summary's evidence (rendered by a server action) uses but this page doesn't render itself:
// referenced here so they're in this route's client manifest, or the action's output can't find them.
import "@/components/evidence/dispute-icon";
import "@/components/evidence/grade-badge";

type Props = PageProps<"/[lang]/s/[id]">;

/** One static branded image for every share: Satori can't shape Arabic, so no question text is drawn into it. */
const OG_IMAGE = { url: "/og/share.png", width: 1200, height: 630 };

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLocale(lang)) return {};
  const share = await getShare(id).catch(() => null);
  if (!share) return { title: (await getDictionary(lang)).sharedPage.notFoundTitle, robots: { index: false, follow: true } };

  // Described in the language it was shared in, whichever prefix the link used (the canonical is that language's page).
  const dict = await getDictionary(share.locale);
  const title = truncateTitle(share.question);
  const count = share.fatwaIds.length;
  const description = share.summary?.headline || formatPlural(dict.sharedPage.fatwaCount, count, share.locale, formatNumber(count, share.locale));
  const url = routes.share(share.locale, share.id);
  const image = { ...OG_IMAGE, alt: dict.meta.title };

  return {
    title: { absolute: title },
    description,
    // Shared with the visitor's consent to a public page: indexed like a fatwa page.
    robots: { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url: absoluteUrl(url),
      siteName: dict.meta.title,
      locale: share.locale === "ar" ? "ar_AR" : "en_US",
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

async function Content({ params }: Pick<Props, "params">) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  const share = await getShare(id);
  if (!share) notFound();
  // A shared answer has one language (its summary's): the other prefix goes to that page.
  if (share.locale !== lang) redirect(routes.share(share.locale, share.id));
  const dict = await getDictionary(lang);

  return (
    <>
      <Breadcrumbs locale={lang} strings={dict.nav} items={[{ label: dict.nav.shared, href: routes.share(lang, share.id) }]} structuredData />
      <SharedAnswerView share={share} dict={dict} />
    </>
  );
}

/** Waits for the existence check below before rendering (a cached read), so a missing item gets a real 404 status. */
export const instant = false;

export default async function SharedAnswerPage({ params }: Props) {
  // Checked before the stream starts, so a missing share is a real 404 rather than a 200 carrying the not-found page.
  const { id } = await params;
  if (!(await getShare(id))) notFound();

  return (
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <Content params={params} />
    </Suspense>
  );
}

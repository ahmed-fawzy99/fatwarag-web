import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { TopicDetail } from "@/components/topics/topic-detail";
import { isLocale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { findTopic } from "@/lib/data-access/catalog";
import { pageAlternates } from "@/lib/helpers/seo";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { format } from "@/lib/i18n/format";

type Props = PageProps<"/[lang]/topics/[key]">;

function pageNumber(value: string | string[] | undefined): number {
  return typeof value === "string" ? Math.max(1, Math.floor(Number(value)) || 1) : 1;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ lang, key }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(lang)) return {};
  const match = await findTopic(key).catch(() => null);
  if (!match) return {};
  const dict = await getDictionary(lang);
  const label = (lang === "en" && match.topic.labelEn) || match.topic.labelAr;
  return {
    title: label,
    description: format(dict.meta.topicDescription, { topic: label }),
    alternates: pageAlternates(lang, routes.topic("ar", key, pageNumber(query.page))),
  };
}

async function Content({ params, searchParams }: Props) {
  const [{ lang, key }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(lang)) notFound();
  const page = pageNumber(query.page);
  return <TopicDetail locale={lang} dict={await getDictionary(lang)} topicKey={key} page={page} />;
}

/** Waits for the existence check below before rendering (a cached read), so a missing item gets a real 404 status. */
export const instant = false;

export default async function TopicPage(props: Props) {
  // Checked before the stream starts, so a missing topic is a real 404 rather than a 200 carrying the not-found page.
  const { key } = await props.params;
  if (!(await findTopic(key))) notFound();

  return (
    <Suspense fallback={<ListSkeleton />}>
      <Content {...props} />
    </Suspense>
  );
}

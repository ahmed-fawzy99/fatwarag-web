import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TopicsIndex } from "@/components/topics/topics-index";
import { isLocale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { pageAlternates } from "@/lib/helpers/seo";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/topics">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.topics.title, description: dict.topics.subtitle, alternates: pageAlternates(lang, "/topics") };
}

export default async function TopicsPage({ params }: PageProps<"/[lang]/topics">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  return (
    <>
      <Breadcrumbs locale={lang} strings={dict.nav} items={[{ label: dict.topics.title, href: routes.topics(lang) }]} structuredData />
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <TopicsIndex locale={lang} dict={dict} />
      </Suspense>
    </>
  );
}

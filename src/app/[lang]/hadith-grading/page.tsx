import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { GradingReference } from "@/components/gradings/grading-reference";
import { isLocale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { pageAlternates } from "@/lib/helpers/seo";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type Props = PageProps<"/[lang]/hadith-grading">;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const term = typeof query.term === "string" ? query.term : undefined;
  return {
    title: dict.glossary.metaTitle,
    description: dict.glossary.subtitle,
    alternates: pageAlternates(lang, routes.gradings("ar", term)),
  };
}

async function Content({ params, searchParams }: Props) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(lang)) notFound();
  const term = typeof query.term === "string" ? query.term : null;
  return <GradingReference locale={lang} dict={await getDictionary(lang)} term={term} />;
}

export default function HadithGradingPage(props: Props) {
  return (
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <Content {...props} />
    </Suspense>
  );
}

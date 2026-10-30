import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeHero } from "@/components/home/home-hero";
import { isLocale } from "@/lib/config/i18n";
import { pageAlternates } from "@/lib/helpers/seo";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { alternates: pageAlternates(lang, "/") };
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  return <HomeHero locale={lang} dict={dict} />;
}

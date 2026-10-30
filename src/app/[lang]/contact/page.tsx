import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/common/page-title";
import { ContactForm } from "@/components/contact/contact-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { isLocale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { pageAlternates } from "@/lib/helpers/seo";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.contact.title, description: dict.contact.subtitle, alternates: pageAlternates(lang, "/contact") };
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs locale={lang} strings={dict.nav} items={[{ label: dict.contact.title, href: routes.contact(lang) }]} structuredData />
      <PageTitle title={dict.contact.title} subtitle={dict.contact.subtitle} />
      <ContactForm locale={lang} strings={dict.contact} />
    </div>
  );
}

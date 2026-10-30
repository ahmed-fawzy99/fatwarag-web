// REVIEW REQUIRED: the owner must review this page before launch. It describes what the code does today
// (see the `privacy` section of the dictionaries, written from api/ and web/) and is not legal advice.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/common/page-title";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { isLocale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { pageAlternates } from "@/lib/helpers/seo";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.privacy.title, description: dict.privacy.subtitle, alternates: pageAlternates(lang, "/privacy") };
}

export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs locale={lang} strings={dict.nav} items={[{ label: dict.privacy.title, href: routes.privacy(lang) }]} structuredData />
      <PageTitle title={dict.privacy.title} subtitle={dict.privacy.subtitle} />
      {dict.privacy.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{section.heading}</h2>
          <ul className="flex list-disc flex-col gap-1.5 ps-5 text-ink-soft marker:text-muted-foreground">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import NextTopLoader from "nextjs-toploader";
import { SiteFooter } from "@/components/layout/site-footer";
import { InPageLinks } from "@/components/layout/in-page-links";
import { NavigationTracker } from "@/components/layout/navigation-tracker";
import { PinnedTop } from "@/components/layout/pinned-top";
import { ReviewBanner } from "@/components/layout/review-banner";
import { SiteHeader } from "@/components/layout/site-header";
import { quranFont, readingFont, readingLatinFont, uiFont } from "@/lib/config/fonts";
import { LOCALES, LOCALE_META, isLocale } from "@/lib/config/i18n";
import { siteUrl } from "@/lib/helpers/seo";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { AppProviders } from "@/providers/app-providers";
import "../globals.css";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: dict.meta.title, template: `%s · ${dict.meta.title}` },
    description: dict.meta.description,
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const { dir } = LOCALE_META[lang];

  return (
    <html
      lang={lang}
      dir={dir}
      data-scroll-behavior="smooth"
      className={`${uiFont.variable} ${readingFont.variable} ${readingLatinFont.variable} ${quranFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <NextTopLoader color="var(--primary)" height={3} showSpinner={false} shadow={false} />
        <AppProviders dir={dir}>
          <Suspense fallback={null}>
            <NavigationTracker />
          </Suspense>
          <InPageLinks />
          <PinnedTop>
            <ReviewBanner text={dict.banner.text} />
            <SiteHeader locale={lang} dict={dict.header} brand={dict.meta.title} />
          </PinnedTop>
          <main className="mx-auto flex w-full max-w-[860px] flex-1 flex-col gap-5 px-4 pt-6 pb-24">{children}</main>
          <SiteFooter locale={lang} dict={dict.footer} />
        </AppProviders>
      </body>
    </html>
  );
}

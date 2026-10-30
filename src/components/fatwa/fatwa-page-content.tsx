import { LanguagesIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { RelatedFatwas } from "@/components/common/related-fatwas";
import { PageTitle } from "@/components/common/page-title";
import { TrackOnMount } from "@/components/analytics/track-on-mount";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EVENTS } from "@/lib/analytics/events";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { getMufti, getSource } from "@/lib/data-access/catalog";
import { getFatwa } from "@/lib/data-access/fatwas";
import { findTopicPath } from "@/lib/data-access/topic-path";
import { topicCrumbs } from "@/lib/helpers/breadcrumbs";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { format } from "@/lib/i18n/format";
import { fatwaTitle } from "@/lib/helpers/fatwa";
import { localizeDigits } from "@/lib/helpers/format";
import { FatwaBody } from "./fatwa-body";
import { FatwaStructuredData } from "./fatwa-structured-data";

type FatwaPageContentProps = {
  locale: Locale;
  id: string;
  dict: Dictionary;
};

/** A single fatwa on its own page — same content as an expanded fatwa on the answer page. */
export async function FatwaPageContent({ locale, id, dict }: FatwaPageContentProps) {
  const fatwa = await getFatwa(id, locale);
  if (!fatwa) notFound();
  const [source, topicPath, mufti] = await Promise.all([
    getSource(fatwa.sourceKey),
    // The breadcrumb follows the fatwa's first topic.
    findTopicPath(fatwa.topicKeys[0] ?? ""),
    getMufti(fatwa.muftiKey).catch(() => null),
  ]);
  const english = fatwa.en ?? fatwa.enMachine;
  const { title, translated } = fatwaTitle(fatwa, locale);

  return (
    <article className="flex flex-col gap-5">
      <Breadcrumbs
        locale={locale}
        strings={dict.nav}
        items={[
          ...(topicPath ? topicCrumbs(topicPath, locale, dict.topics.title) : []),
          { label: format(dict.nav.fatwa, { number: localizeDigits(fatwa.sourceFatwaId, locale) }), href: routes.fatwa(locale, fatwa.id) },
        ]}
        // The English page without a translation is not indexed (see the page's metadata).
        structuredData={locale === "ar" || Boolean(english)}
      />
      <TrackOnMount event={{ name: EVENTS.fatwaOpened, props: { locale, fatwa_id: fatwa.id, surface: "page" } }} />
      <FatwaStructuredData locale={locale} fatwa={fatwa} text={locale === "en" && english ? english : fatwa.ar} mufti={mufti} />
      <PageTitle
        title={title}
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            {source && <span className="rounded-full bg-sunken px-2.5 py-0.5 text-xs text-ink-soft">{locale === "ar" ? source.nameAr : source.nameEn}</span>}
            {translated && (
              <span className="inline-flex items-center gap-1 text-xs">
                <LanguagesIcon className="size-3.5" />
                {dict.fatwa.translated}
              </span>
            )}
          </div>
        }
      />
      <div className="rounded-2xl border bg-card px-5 py-5 sm:px-6">
        <FatwaBody locale={locale} fatwa={fatwa} dict={dict} question={null} />
      </div>
      <Suspense fallback={<ListSkeleton rows={3} />}>
        <RelatedFatwas locale={locale} dict={dict} fatwaId={fatwa.id} />
      </Suspense>
    </article>
  );
}

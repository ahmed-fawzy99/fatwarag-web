import { ArrowUpLeftIcon, ArrowUpRightIcon, BuildingIcon, UserIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { FatwaList } from "@/components/common/fatwa-list";
import { PageTitle } from "@/components/common/page-title";
import { Pager } from "@/components/common/pager";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LOCALE_META, type Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { getMufti, getSource } from "@/lib/data-access/catalog";
import { listFatwasByMufti } from "@/lib/data-access/fatwas";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { SourceKey } from "@/types/source";

/** A mufti or institution card: verbatim profile text from the source, and their fatwas. */
type MuftiProfileProps = { locale: Locale; dict: Dictionary; muftiKey: string; page: number };

export async function MuftiProfile({ locale, dict, muftiKey, page }: MuftiProfileProps) {
  const mufti = await getMufti(muftiKey);
  if (!mufti) notFound();
  const [source, fatwas] = await Promise.all([getSource(mufti.key as SourceKey), listFatwasByMufti(mufti.key, locale, page)]);
  // A page past the end (an old or hand-typed link) is not a real page.
  if (page > fatwas.meta.lastPage) notFound();
  const KindIcon = mufti.kind === "institution" ? BuildingIcon : UserIcon;
  const OutIcon = LOCALE_META[locale].dir === "rtl" ? ArrowUpLeftIcon : ArrowUpRightIcon;
  const bio = mufti.bioAr;
  const name = locale === "ar" ? mufti.nameAr : mufti.nameEn;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs locale={locale} strings={dict.nav} items={[{ label: name, href: routes.mufti(locale, mufti.key) }]} structuredData />
      <PageTitle
        title={name}
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <KindIcon className="size-4" />
            {mufti.kind === "institution" ? dict.mufti.institution : dict.mufti.scholar}
          </span>
        }
      />

      <section className="rounded-2xl border bg-card px-5 py-4">
        {bio ? (
          <>
            <p className="mb-2 font-sans text-xs text-muted-foreground">{dict.mufti.bioFrom}</p>
            <div dir="rtl" lang="ar" className="text-reading whitespace-pre-line">
              {bio}
            </div>
            {mufti.bioSourceUrl && (
              <a href={mufti.bioSourceUrl} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent-foreground hover:underline">
                {dict.mufti.source} <OutIcon className="size-3.5" />
              </a>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">{dict.mufti.noBio}</p>
        )}
        {source && (
          <a href={source.homeUrl} target="_blank" rel="noopener" className="mt-3 block text-sm text-ink-soft hover:text-accent-foreground" dir="ltr">
            {source.homeUrl}
          </a>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{dict.mufti.fatwasTitle}</h2>
        <FatwaList locale={locale} items={fatwas.data} emptyText={dict.topics.empty} translatedLabel={dict.fatwa.translated} />
        <Pager
          locale={locale}
          page={fatwas.meta.page}
          lastPage={fatwas.meta.lastPage}
          href={(target) => routes.mufti(locale, mufti.key, target)}
          strings={dict.topics}
        />
      </section>
    </div>
  );
}

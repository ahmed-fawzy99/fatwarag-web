import { ArrowUpLeftIcon, ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { PageTitle } from "@/components/common/page-title";
import { GRADE_TEXT_CLASS } from "@/components/evidence/grade-badge";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LOCALE_META, type Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { getGlossary } from "@/lib/data-access/catalog";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { format } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import type { GradeLevel } from "@/types/content";
import type { GlossaryTerm, GlossaryText } from "@/types/glossary";

type Group = keyof Dictionary["glossary"]["groups"];

const GROUP_OF: Record<GradeLevel, Group> = {
  sahih: "accepted",
  hasan: "accepted",
  daif: "rejected",
  very_daif: "rejected",
  mawdu: "rejected",
  other: "other",
};

const GROUPS: Group[] = ["accepted", "rejected", "other"];

type GradingReferenceProps = {
  locale: Locale;
  dict: Dictionary;
  term: string | null;
};

/** Every hadith grading on one page; `?term=` picks the one shown. */
export async function GradingReference({ locale, dict, term }: GradingReferenceProps) {
  const glossary = await getGlossary();
  const strings = dict.glossary;
  const selected = glossary.terms.find((t) => t.term === term) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        locale={locale}
        strings={dict.nav}
        items={[
          { label: strings.title, href: routes.gradings(locale) },
          ...(selected ? [{ label: locale === "ar" ? selected.labelAr : selected.labelEn, href: routes.gradings(locale, selected.term) }] : []),
        ]}
        structuredData
      />
      <PageTitle title={strings.title} subtitle={strings.subtitle} />

      <nav className="flex flex-col gap-3" aria-label={strings.title}>
        {GROUPS.map((group) => {
          const terms = glossary.terms.filter((t) => GROUP_OF[t.level] === group);
          if (terms.length === 0) return null;
          return (
            <div key={group} className="flex flex-col gap-1.5">
              <h2 className="text-xs font-semibold text-muted-foreground">{strings.groups[group]}</h2>
              <ul className="flex flex-wrap gap-1.5">
                {terms.map((item) => (
                  <li key={item.term}>
                    <TermChip locale={locale} item={item} active={item.term === selected?.term} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {selected ? (
        <TermEntry locale={locale} entry={selected} strings={strings} />
      ) : glossary.intro[locale] || glossary.intro.ar ? (
        <Passage locale={locale} text={(glossary.intro[locale] ?? glossary.intro.ar)!} sourceLine={strings.sourceLine} />
      ) : (
        <p className="text-muted-foreground">{strings.intro}</p>
      )}
    </div>
  );
}

function TermChip({ locale, item, active }: { locale: Locale; item: GlossaryTerm; active: boolean }) {
  return (
    <Link
      href={routes.gradings(locale, item.term)}
      scroll={false}
      replace
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-block rounded-full border px-3 py-1 text-sm transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/40",
      )}
    >
      <span className={cn(!active && GRADE_TEXT_CLASS[item.level], !active && item.level !== "other" && "font-medium")}>
        {locale === "ar" ? item.labelAr : item.labelEn}
      </span>
    </Link>
  );
}

function TermEntry({ locale, entry, strings }: { locale: Locale; entry: GlossaryTerm; strings: Dictionary["glossary"] }) {
  const text = entry[locale] ?? entry.ar;
  const fellBack = locale !== "ar" && !entry[locale] && Boolean(entry.ar);
  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card px-5 py-5 sm:px-6" aria-labelledby="term-heading">
      <h2 id="term-heading" className={cn("text-xl font-bold", GRADE_TEXT_CLASS[entry.level])}>
        {locale === "ar" ? entry.labelAr : `${entry.labelEn} · ${entry.labelAr}`}
      </h2>
      {fellBack && <p className="text-sm text-muted-foreground">{strings.arabicOnly}</p>}
      {text ? (
        <>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-sm font-semibold text-muted-foreground">{strings.meaningTitle}</h3>
            <Passage locale={locale} text={text.meaning} sourceLine={strings.sourceLine} bare />
          </div>
          <div className="flex flex-col gap-1.5 rounded-xl bg-sunken px-4 py-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{strings.actingTitle}</h3>
            {text.acting ? (
              <Passage locale={locale} text={text.acting} sourceLine={strings.sourceLine} bare />
            ) : (
              <p className="text-sm text-muted-foreground">{strings.actingMissing}</p>
            )}
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">{strings.missing}</p>
      )}
    </section>
  );
}

function Passage({ locale, text, sourceLine, bare = false }: { locale: Locale; text: GlossaryText; sourceLine: string; bare?: boolean }) {
  const isArabic = /[؀-ۿ]/.test(text.paragraphs[0] ?? "");
  const OutIcon = LOCALE_META[locale].dir === "rtl" ? ArrowUpLeftIcon : ArrowUpRightIcon;
  return (
    <div className={cn("flex flex-col gap-3", !bare && "rounded-2xl border bg-card px-5 py-5 sm:px-6")}>
      <div dir={isArabic ? "rtl" : "ltr"} lang={isArabic ? "ar" : "en"} className="text-reading flex flex-col gap-3">
        {text.paragraphs.map((paragraph, index) => (
          <p key={index} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </div>
      <a href={text.sourceUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-1 self-start text-sm font-medium text-accent-foreground hover:underline">
        {format(sourceLine, { name: text.sourceName })} <OutIcon className="size-3.5" />
      </a>
    </div>
  );
}

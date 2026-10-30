import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { gradingTermFor, isDisputed, levelFromPhrase, pickMainGrade, sortByStrength } from "@/lib/helpers/grades";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { HadithGrade } from "@/types/foundations";
import { DisputeIcon } from "./dispute-icon";
import { GradeBadge } from "./grade-badge";

export type FatwaGrading = {
  phrase: string;
  scope: "this" | "group" | null;
  context: string | null;
};

type GradingLineProps = {
  locale: Locale;
  grades: HadithGrade[];
  /** The fatwa's own grading of this hadith, when it gives one. Shown instead of the library's main grade. */
  fatwaGrading?: FatwaGrading | null;
  strings: Dictionary["evidence"];
};

/** «خلاصة حكم المحدث» line: one grade up front, and the "!" listing every grading when scholars disagree. */
export function GradingLine({ locale, grades, fatwaGrading, strings }: GradingLineProps) {
  const main = pickMainGrade(grades);
  const label = (g: HadithGrade) => (locale === "ar" ? g.labelAr : g.labelEn);

  return (
    <>
      {fatwaGrading ? (
        <span>
          {strings.gradeFromFatwa}:{" "}
          <GradeBadge
            locale={locale}
            level={levelFromPhrase(fatwaGrading.phrase)}
            label={`«${fatwaGrading.phrase}»`}
            glossaryLabel={strings.glossaryLink}
            context={
              fatwaGrading.context
                ? { text: fatwaGrading.context, title: strings.gradingContextTitle, note: fatwaGrading.scope === "group" ? strings.gradingGroupNote : null }
                : null
            }
          />
        </span>
      ) : (
        main && (
          <>
            <span>
              {strings.mohaddith}: <b className="font-medium text-ink-soft">{locale === "ar" ? main.scholarAr : main.scholarEn}</b>
            </span>
            <span>
              {strings.grade}: <GradeBadge locale={locale} level={main.level} label={label(main)} glossaryLabel={strings.glossaryLink} />
            </span>
          </>
        )
      )}
      {isDisputed(grades) && (
        <DisputeIcon
          title={strings.disputed}
          listTitle={strings.disputedListTitle}
          grades={sortByStrength(grades).map((g) => ({
            scholar: locale === "ar" ? g.scholarAr : g.scholarEn,
            label: label(g),
            level: g.level,
            where: [g.bookAr, g.page].filter(Boolean).join(" · ") || null,
            termHref: routes.gradings(locale, gradingTermFor(g.labelAr, g.level)),
          }))}
        />
      )}
    </>
  );
}

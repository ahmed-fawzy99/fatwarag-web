import { BookOpenTextIcon, FileSearchIcon, MessageSquareTextIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Disclaimer } from "@/components/common/disclaimer";
import { BrandName } from "@/components/layout/brand-name";
import { QuestionForm } from "@/components/search/question-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { formatNumber } from "@/lib/helpers/format";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { HomeCommonQuestions } from "./home-common-questions";
import { HomeTopics } from "./home-topics";

const STEP_ICONS = [MessageSquareTextIcon, FileSearchIcon, BookOpenTextIcon];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function HomeHero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const home = dict.home;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-12 pt-[6vh]">
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-bold">
            <BrandName locale={locale} />
          </h1>
          <p className="text-balance text-ink-soft">{home.tagline}</p>
        </div>
        <QuestionForm locale={locale} strings={{ ...dict.search }} size="hero" quietOnBlur />
        <Suspense
          fallback={
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-32" />
              <div className="grid gap-1.5 sm:grid-cols-2">
                {Array.from({ length: 10 }, (_, i) => (
                  <Skeleton key={i} className="h-11 rounded-xl" />
                ))}
              </div>
            </div>
          }
        >
          <HomeCommonQuestions locale={locale} title={home.commonQuestionsTitle} />
        </Suspense>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="how-heading">
        <SectionTitle>
          <span id="how-heading">{home.howTitle}</span>
        </SectionTitle>
        <ol className="grid gap-3 sm:grid-cols-3">
          {home.steps.map((step, index) => {
            const Icon = STEP_ICONS[index];
            return (
              <li key={step.title} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
                <span className="flex items-center gap-2 text-accent-foreground">
                  <span className="grid size-7 place-items-center rounded-lg bg-accent text-sm font-semibold">{formatNumber(index + 1, locale)}</span>
                  <Icon className="size-4" />
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-ink-soft">{step.body}</p>
              </li>
            );
          })}
        </ol>
        <p className="rounded-xl bg-accent px-4 py-3 text-sm leading-relaxed text-accent-foreground">{home.principle}</p>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="topics-heading">
        <div className="flex items-baseline justify-between gap-2">
          <SectionTitle>
            <span id="topics-heading">{home.topicsTitle}</span>
          </SectionTitle>
          <Link href={routes.topics(locale)} className="text-sm text-accent-foreground hover:underline">
            {home.browseTopics}
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 9 }, (_, i) => (
                <Skeleton key={i} className="h-11 rounded-xl" />
              ))}
            </div>
          }
        >
          <HomeTopics locale={locale} />
        </Suspense>
      </section>

      <Disclaimer title={dict.disclaimer.title} body={dict.disclaimer.body} />
    </div>
  );
}

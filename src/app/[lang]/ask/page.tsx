import { MessageSquareWarningIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect, RedirectType } from "next/navigation";
import { Suspense } from "react";
import { AnswerResults } from "@/components/answer/answer-results";
import { ResultsSkeleton } from "@/components/answer/answer-skeletons";
import { StatusMessage } from "@/components/common/status-message";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { QuestionForm } from "@/components/search/question-form";
import { sealAskLink, unsealAskLink } from "@/lib/answer/ask-link";
import { isLocale, type Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { getDictionary, type Dictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/ask">): Promise<Metadata> {
  const { lang } = await params;
  // Answer pages are AI-written, endless and costly: never indexed (robots.txt also keeps crawlers out).
  return { title: lang === "en" ? "Answer" : "الإجابة", robots: { index: false, follow: true } };
}

async function AskContent({ locale, dict, searchParams }: { locale: Locale; dict: Dictionary; searchParams: PageProps<"/[lang]/ask">["searchParams"] }) {
  const query = await searchParams;
  const token = typeof query.t === "string" ? query.t : "";

  if (!token) {
    // A plain link someone typed or pasted (?q=…&f=…): replaced at once by its sealed form, so the question shows
    // in at most this one request. The proxy normally does this already; this covers anything that slips past it.
    const legacy = typeof query.q === "string" ? query.q.trim() : "";
    if (!legacy) redirect(routes.home(locale));
    const legacyFollowUp = typeof query.f === "string" && query.f.trim() ? query.f.trim() : null;
    redirect(routes.ask(locale, sealAskLink({ question: legacy, followUp: legacyFollowUp })), RedirectType.replace);
  }

  const link = unsealAskLink(token);
  if (!link) {
    // Tampered, truncated or sealed with a retired key: the same calm state as a question we can't search with.
    return (
      <>
        <QuestionForm locale={locale} strings={{ ...dict.search }} />
        <StatusMessage icon={MessageSquareWarningIcon} title={dict.ask.invalidTitle} body={dict.ask.invalidBody} />
      </>
    );
  }
  const { question, followUp } = link;

  return (
    <>
      <QuestionForm locale={locale} strings={{ ...dict.search }} defaultValue={question} key={question} />
      <Suspense key={`${question}|${followUp}`} fallback={<ResultsSkeleton />}>
        <AnswerResults locale={locale} dict={dict} question={question} followUp={followUp} />
      </Suspense>
    </>
  );
}

export default async function AskPage({ params, searchParams }: PageProps<"/[lang]/ask">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      {/* Answer pages are never indexed, so no structured data. */}
      <Breadcrumbs locale={lang} strings={dict.nav} items={[{ label: dict.nav.answer }]} />
      <Suspense fallback={<ResultsSkeleton />}>
        <AskContent locale={lang} dict={dict} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { apiGet } from "@/lib/api/client";
import { sealAskLink } from "@/lib/answer/ask-link";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import type { CommonQuestion } from "@/types/common-question";

const HOUR = 3600;

/** The home page's common questions, in order, in the reader's language. */
export async function listCommonQuestions(locale: Locale): Promise<CommonQuestion[]> {
  return apiGet<CommonQuestion[]>("/common-questions", { locale, revalidate: HOUR, tags: ["common-questions"] });
}

/**
 * The common questions with their answer links, the question sealed into each. Cached with the list (sealing uses a
 * random IV, so it can't run during prerendering uncached); a cached link stays valid while its key is configured.
 */
export async function listCommonQuestionLinks(locale: Locale): Promise<(CommonQuestion & { href: string })[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("common-questions");
  const questions = await listCommonQuestions(locale);
  return questions.map((entry) => ({ ...entry, href: routes.ask(locale, sealAskLink({ question: entry.question, followUp: null })) }));
}

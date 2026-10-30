"use server";

import { sealAskLink } from "@/lib/answer/ask-link";
import { isLocale, type Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";

/** Longest text a link may carry (the API refuses longer questions anyway). */
const MAX_TEXT = 2000;

/**
 * The answer page link for a question (or a follow-up to one), with the question sealed into `t`. Runs on the server
 * because the key never reaches the browser. Null for input that can't be a question.
 */
export async function askLink(locale: Locale, question: string, followUp: string | null = null): Promise<string | null> {
  const q = typeof question === "string" ? question.trim() : "";
  const f = typeof followUp === "string" && followUp.trim() ? followUp.trim() : null;
  if (!isLocale(locale) || !q || q.length > MAX_TEXT || (f?.length ?? 0) > MAX_TEXT) return null;
  return routes.ask(locale, sealAskLink({ question: q, followUp: f }));
}

"use server";

import { apiPost, isApiError, type ApiErrorCode } from "@/lib/api/client";
import type { Locale } from "@/lib/config/i18n";
import type { Summary } from "@/types/answer";
import type { ReportReason, ReportTarget } from "@/types/report";

export type SubmitReportInput = {
  target: ReportTarget;
  reason: ReportReason;
  comment: string;
  locale: Locale;
  pageUrl: string;
  turnstileToken: string | null;
};

function safePath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
}

export type FormResult = { ok: true } | { ok: false; code: ApiErrorCode };

/** Sends a report to the API with the context the owner needs: page, part, item, question and the summary shown. */
export async function submitReport({ target, reason, comment, locale, pageUrl, turnstileToken }: SubmitReportInput): Promise<FormResult> {
  const { kind, ...item } = target;
  const question = "question" in item ? (item.question ?? null) : null;
  const summary: Summary | null = "summary" in item ? (item.summary ?? null) : null;
  // A source page opened from a fatwa's quote link: the quote in the fatwa, the fatwa, and where the link pointed.
  const quote = "quote" in item ? (item.quote ?? null) : null;
  const referrerFatwaId = "referrerFatwaId" in item ? (item.referrerFatwaId ?? null) : null;
  const linked = Boolean(quote || referrerFatwaId);
  const pointedTo =
    !linked ? null : target.kind === "quran" ? `Quran ${target.surah}:${target.ayah ?? ""}`.replace(/:$/, "") : target.kind === "hadith" ? `Hadith ${target.collection} #${target.number}` : null;
  // Reported from a shared answer's page (/s/{id} or /en/s/{id}): the owner gets the share id with the report.
  const shareId = /^\/(?:[a-z]{2}\/)?s\/([A-Za-z0-9]{10,32})(?:[/?#]|$)/.exec(safePath(pageUrl))?.[1] ?? null;
  const itemOnly = Object.fromEntries(
    Object.entries(item).filter(([key]) => !["question", "summary", "quote", "referrerFatwaId"].includes(key)),
  );

  try {
    await apiPost("/reports", {
      reason,
      comment,
      locale,
      turnstileToken: turnstileToken ?? "",
      context: {
        pageUrl: pageUrl.slice(0, 2000),
        part: kind,
        item: itemOnly,
        question,
        summary,
        ...(shareId ? { shareId } : {}),
        ...(linked ? { quote: quote?.slice(0, 2000) ?? null, referrerFatwaId, pointedTo } : {}),
      },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, code: isApiError(error) ? error.code : "unavailable" };
  }
}

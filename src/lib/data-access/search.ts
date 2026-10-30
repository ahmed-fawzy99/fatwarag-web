import "server-only";
import { cache } from "react";
import { apiGet, apiPost, isApiError } from "@/lib/api/client";
import type { Locale } from "@/lib/config/i18n";
import type { SearchResult, Summary, SummaryOutcome } from "@/types/answer";

export type SearchFailure = "notFound" | "offTopic" | "limit" | "rate" | "invalid" | "error";

export type SearchOutcome = { ok: true; result: SearchResult } | { ok: false; kind: SearchFailure };

type SearchInput = {
  question: string;
  /** Set for a follow-up: the question it follows. The API merges the two into one complete question. */
  followUpOf: string | null;
  locale: Locale;
};

/** Searches the fatwa sources by meaning. Never throws: every failure maps to a state the page can show. */
export async function searchFatwas({ question, followUpOf, locale }: SearchInput): Promise<SearchOutcome> {
  try {
    const result = await apiPost<SearchResult>(
      "/search",
      { question, locale, ...(followUpOf ? { followUp: { original: followUpOf } } : {}) },
      { timeoutMs: 45_000 },
    );
    return { ok: true, result };
  } catch (error) {
    if (!isApiError(error)) return { ok: false, kind: "error" };
    const kinds: Partial<Record<string, SearchFailure>> = {
      not_found: "notFound",
      off_topic: "offTopic",
      daily_cap_reached: "limit",
      rate_limited: "rate",
      validation: "invalid",
    };
    return { ok: false, kind: kinds[error.code] ?? "error" };
  }
}

export type { SummaryOutcome };

/**
 * The summary written only from the retrieved fatwas. Any failure leaves the fatwa list on its own.
 * Deduplicated per request: the summary card and the extra-fatwas list share one call (each call costs money).
 */
export const getSummary = cache(async function getSummary(answerId: string, locale: Locale): Promise<SummaryOutcome> {
  try {
    const data = await apiGet<Summary | { status: "paused" | "failed" }>(`/answers/${encodeURIComponent(answerId)}/summary`, {
      locale,
      timeoutMs: 120_000,
    });
    if ("status" in data) return { status: data.status === "paused" ? "paused" : "failed" };
    return { status: "ready", summary: { ...data, extraFatwaIds: data.extraFatwaIds ?? [] } };
  } catch (error) {
    return { status: isApiError(error, "budget_exhausted") ? "paused" : "failed" };
  }
});

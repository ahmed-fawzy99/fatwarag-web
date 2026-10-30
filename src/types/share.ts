import type { Locale } from "@/lib/config/i18n";
import type { Summary } from "@/types/answer";

/** `GET /shares/{id}`: an answer a visitor chose to share, exactly as it was saved. */
export type SharedAnswer = {
  id: string;
  /** The question the answer answers (for a follow-up, the merged complete question). */
  question: string;
  /** The follow-up as typed, when the question came from one. */
  followUp: string | null;
  /** The language it was shared in (the summary's language). */
  locale: Locale;
  /** Public fatwa ids, best first (cross-referenced fatwas the summary cites come last). */
  fatwaIds: string[];
  /** The final summary, or null when there was none (the list alone is shown). */
  summary: Summary | null;
  createdAt: string | null;
};

/** `POST /shares`. */
export type CreatedShare = { id: string; url: string };

/** One entry of `GET /sitemap/shares`. */
export type ShareSitemapEntry = { id: string; locale: Locale; updatedAt: string | null };

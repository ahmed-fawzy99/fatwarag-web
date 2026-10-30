import type { Locale } from "@/lib/config/i18n";
import type { ReportReason } from "@/types/report";

/**
 * Every analytics event the site sends, in one place. Callers use `EVENTS.x`, never a string literal.
 *
 * PRIVACY: properties are non-identifying facts only (locale, lengths, counts, ids of fatwas/sources, status,
 * timings). Never add question text, follow-up text, report or contact message text, names or emails. `scrubProps`
 * (privacy.ts) drops such keys as a second line of defence, but the types here are the first.
 */
export const EVENTS = {
  questionAsked: "question_asked",
  followUpAsked: "follow_up_asked",
  searchResultsShown: "search_results_shown",
  searchFailed: "search_failed",
  offTopicShown: "off_topic_shown",
  summaryCompleted: "summary_completed",
  summaryFailed: "summary_failed",
  summaryPaused: "summary_paused",
  fatwaOpened: "fatwa_opened",
  fatwaTranslationRequested: "fatwa_translation_requested",
  citationClicked: "citation_clicked",
  evidenceClicked: "evidence_clicked",
  commonQuestionClicked: "common_question_clicked",
  shareStarted: "share_started",
  shareConsented: "share_consented",
  shareLinkCopied: "share_link_copied",
  sharedPageViewed: "shared_page_viewed",
  reportSubmitted: "report_submitted",
  contactSubmitted: "contact_submitted",
  languageSwitched: "language_switched",
  dorarSearchClicked: "dorar_search_clicked",
  verseAudioPlayed: "verse_audio_played",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/** Where a fatwa was opened: the answer page's list, or its own page. */
export type FatwaSurface = "accordion" | "page";

export type EventProps = {
  /** `length` is the number of characters typed; the text itself is never sent. */
  [EVENTS.questionAsked]: { locale: Locale; length: number; surface: "home" | "ask_page" };
  [EVENTS.followUpAsked]: { locale: Locale; length: number };
  [EVENTS.searchResultsShown]: { locale: Locale; count: number; none_found: boolean; sources_searched: number; is_follow_up: boolean };
  [EVENTS.searchFailed]: { locale: Locale; reason: "limit" | "rate" | "invalid" | "error" };
  [EVENTS.offTopicShown]: { locale: Locale };
  [EVENTS.summaryCompleted]: { locale: Locale; duration_ms: number; fatwa_count: number; part_count: number };
  [EVENTS.summaryFailed]: { locale: Locale; duration_ms: number; fatwa_count: number };
  [EVENTS.summaryPaused]: { locale: Locale; duration_ms: number; fatwa_count: number };
  [EVENTS.fatwaOpened]: { locale: Locale; fatwa_id: string; surface: FatwaSurface };
  [EVENTS.fatwaTranslationRequested]: { locale: Locale; fatwa_id: string; surface: FatwaSurface };
  [EVENTS.citationClicked]: { locale: Locale; fatwa_id: string };
  [EVENTS.evidenceClicked]: {
    locale: Locale;
    kind: "quran" | "hadith" | "fatwa";
    /** Where the link was: inside the summary's evidence, or inside a fatwa's text. */
    surface: "summary" | "fatwa_text";
    /** The surah and ayah (e.g. "2:255"), "collection/number" of a hadith, or the fatwa id. */
    ref: string;
  };
  [EVENTS.commonQuestionClicked]: { locale: Locale; common_question_id: string };
  [EVENTS.shareStarted]: { locale: Locale };
  [EVENTS.shareConsented]: { locale: Locale; created: boolean; error?: string };
  [EVENTS.shareLinkCopied]: { locale: Locale; method: "copy" | "native" };
  [EVENTS.sharedPageViewed]: { locale: Locale; share_id: string };
  [EVENTS.reportSubmitted]: { locale: Locale; target_kind: "summary" | "fatwa" | "quran" | "hadith"; reason: ReportReason; comment_length: number };
  [EVENTS.contactSubmitted]: { locale: Locale; message_length: number };
  [EVENTS.languageSwitched]: { from: Locale; to: Locale };
  [EVENTS.dorarSearchClicked]: { locale: Locale };
  [EVENTS.verseAudioPlayed]: { locale: Locale; surah: number; ayah: number };
};

/** One event with its properties, as a plain value (so server components can hand it to a client tracker). */
export type AnalyticsEvent = { [K in EventName]: { name: K; props: EventProps[K] } }[EventName];

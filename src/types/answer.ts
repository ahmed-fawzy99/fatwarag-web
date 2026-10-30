import type { Locale } from "@/lib/config/i18n";
import type { HadithKey } from "@/types/content";

/** Evidence cited in a summary. Its text is never typed by the AI; it is filled from stored text. */
export type Evidence =
  | { type: "quran"; surah: number; ayah: number; ayahEnd: number | null }
  | {
      type: "hadith";
      /** The quote exactly as it appears in the cited fatwa (stored source text). */
      quote: string;
      /** AI translation of the quote, made once and stored; shown with the "translated" icon above the Arabic. */
      quoteEn: string | null;
      /** The fatwa the quote was taken from. */
      fatwaId: string;
      ref: HadithKey | null;
      /** Copied from the cited fatwa's hadith segment at build time. */
      gradingInFatwa: string | null;
      gradingScope: "this" | "group" | null;
      gradingContext: string | null;
    };

/** Which fixed line points the reader to the fatwas below (`Summary.note`). */
export type SummaryNote = "otherViews" | "details";

export type SummaryPoint = {
  title: string;
  /** Who holds this view, as named by the sources. */
  heldBy: string | null;
  body: string;
  citations: string[];
  evidence: Evidence[];
};

/** One part of a question asking several things, answered on its own (`Summary.parts`). */
export type SummaryQuestionPart = {
  /** A short label phrased from the question, e.g. «إذا كان الشك بعد السلام». */
  label: string;
  /** `unanswered`: none of the fatwas answers this part (its other fields are empty). */
  kind: "agree" | "differ" | "unanswered";
  headline: string | null;
  agreed: SummaryPoint | null;
  views: SummaryPoint[];
  preferences: { text: string; citations: string[] }[];
  caution: { text: string; citations: string[]; evidence: Evidence[] } | null;
  /** As `Summary.note`, for this part. */
  note?: SummaryNote | null;
  /** Answers stored before `note`. */
  otherViews?: boolean;
};

export type Summary = {
  /** In parts: `differ` when any part differs. */
  kind: "agree" | "differ";
  /** In parts: a neutral line («سؤالك من جزأين»); each part has its own. */
  headline: string;
  /** What the sources agree on. */
  agreed: SummaryPoint | null;
  /** The differing views, side by side (empty when sources agree). */
  views: SummaryPoint[];
  /** A source's own stated preference, always attributed by name. */
  preferences: { text: string; citations: string[] }[];
  /** Grounded caution about doubtful matters; only where it applies. */
  caution: { text: string; citations: string[]; evidence: Evidence[] } | null;
  /**
   * The fixed line the page adds under the summary, chosen by the API (never written by the model): `otherViews` when a
   * disagreement lost a view but one is shown («وللمسألة أقوال أخرى في الفتاوى أدناه»); `details` when anything was
   * pruned or dropped, or neither an agreed point nor a view is shown («وتفصيل المسألة في الفتاوى أدناه»); else none.
   */
  note?: SummaryNote | null;
  /** Answers stored before `note`: true meant the line pointing to the fatwas below. */
  otherViews?: boolean;
  /**
   * Set only when the question asks several things: each part answered on its own, in the question's order. The
   * fields above are then empty. Absent for one part (the common case, and every stored answer of the old shape).
   */
  parts?: SummaryQuestionPart[];
  /**
   * Cross-referenced fatwas («وانظر الفتوى رقم…») the summary cites that aren't in `SearchResult.fatwaIds`;
   * the answer page appends them to its fatwa list so every citation resolves.
   */
  extraFatwaIds: string[];
};

export type SearchResult = {
  answerId: string;
  question: string;
  /** Set when a follow-up was merged into a new complete question. */
  mergedFrom: { original: string; followUp: string } | null;
  sourcesSearched: number;
  /** Best first. For a question in parts, each part's best hits merged without repeats (up to 10). */
  fatwaIds: string[];
  /** Set only when the question asks several things and each part was searched on its own. */
  parts?: { label: string; fatwaIds: string[] }[];
};

/** What the summary is doing right now, as the summary stream reports it. */
export type SummaryStage = "reading" | "writing" | "checking" | "translating";

/** Where a streamed item sits when the question is in parts: its part (0-based) and that part's label. */
type InQuestionPart = { part?: number; partLabel?: string };

/** One part of a summary that has passed every safeguard check, sent by the stream in display order. */
export type SummaryPart = InQuestionPart &
  (
    | { section: "agreed"; index: number; item: SummaryPoint }
    | { section: "view"; index: number; item: SummaryPoint }
    | { section: "preference"; index: number; item: Summary["preferences"][number] }
    | { section: "caution"; index: number; item: NonNullable<Summary["caution"]> }
  );

/** Events of `GET /answers/{answerId}/summary/stream`. `done` carries the authoritative final summary. */
export type SummaryStreamEvent =
  | { event: "stage"; data: { stage: SummaryStage } }
  | { event: "item"; data: SummaryPart }
  | { event: "done"; data: Summary }
  | { event: "status"; data: { status: "failed" | "paused" } };

/** The fallback JSON summary, as the BFF hands it to the browser. */
export type SummaryOutcome = { status: "ready"; summary: Summary } | { status: "paused" } | { status: "failed" };

/** How a cited fatwa shows in the summary: its number in the list, title and source. */
export type CitationInfo = Record<string, { number: string; title: string; sourceName: string }>;

/** What the answer page needs to ask for its one summary and place what it cites. */
export type SummaryRequest = {
  answerId: string;
  locale: Locale;
  question: string;
  /** The search's fatwa ids; cited fatwas outside them are appended to the list. */
  listedIds: string[];
  /** How many fatwas the list shows; appended fatwas are numbered after them. */
  offset: number;
};

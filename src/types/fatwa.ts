import type { RichParagraph } from "@/types/content";
import type { SourceKey } from "@/types/source";

export type FatwaText = {
  title: string;
  question: RichParagraph[];
  answer: RichParagraph[];
  /** The source's own summary (e.g. islamqa's «ملخص الجواب»), if it has one. */
  sourceSummary: RichParagraph[] | null;
  url: string;
};

/** A Hijri date, normalised from the many formats sources publish (month is 1–12, Muharram = 1). */
export type HijriDate = { day: number; month: number; year: number };

export type Fatwa = {
  /** Our id: `${sourceKey}-${sourceFatwaId}`. */
  id: string;
  sourceKey: SourceKey;
  sourceFatwaId: string;
  muftiKey: string;
  /** Where the fatwa originally appeared, e.g. «نور على الدرب» or a printed volume/page. */
  origin: string | null;
  dateHijri: HijriDate | null;
  dateGregorian: string | null;
  topicKeys: string[];
  seeAlso: { sourceFatwaId: string; url: string }[];
  /** Fatwas of the same source that point to this one («وانظر الفتوى رقم…»); set when it was collected as a cross-reference. */
  referencedBy: string[];
  ar: FatwaText;
  /** The source's own English translation, if published. */
  en: FatwaText | null;
  /** AI translation, stored once (marked with the "translated" icon). */
  enMachine: FatwaText | null;
  /** English title (source's own, else machine), translated up front; null for Arabic readers or none yet. */
  titleEn: string | null;
  titleEnTranslated: boolean;
};

/** What a fatwa list needs, without the full text. */
export type FatwaListItem = Pick<Fatwa, "id" | "sourceKey" | "sourceFatwaId" | "dateHijri" | "dateGregorian" | "muftiKey"> & {
  title: string;
  titleTranslated: boolean;
};

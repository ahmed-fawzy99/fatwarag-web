import type { GradeLevel } from "@/types/content";

/** A passage quoted verbatim from a trusted source; never AI-written. */
export type GlossaryText = {
  paragraphs: string[];
  sourceName: string;
  sourceUrl: string;
};

/** A term explained for lay readers: what it means, and whether a hadith with it is acted upon. */
export type GlossaryEntry = {
  meaning: GlossaryText;
  acting: GlossaryText | null;
};

export type GlossaryTerm = {
  term: string;
  labelAr: string;
  labelEn: string;
  /** Colour group on the grading page; "other" for terms that describe the chain rather than a verdict. */
  level: GradeLevel;
  ar: GlossaryEntry | null;
  en: GlossaryEntry | null;
};

export type Glossary = {
  intro: { ar: GlossaryText | null; en: GlossaryText | null };
  terms: GlossaryTerm[];
};

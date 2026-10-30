import type { GradeLevel } from "@/types/content";

export type Ayah = {
  ayah: number;
  ar: string;
  en: string;
  enFootnotes: string[];
};

export type Surah = {
  number: number;
  nameAr: string;
  nameEn: string;
  /** True when only a window of verses around the referenced ones is stored. */
  partial: boolean;
  ayat: Ayah[];
};

export type TafsirKey = "muyassar" | "ibnKathir" | "saadi";

export type TafsirEntry = {
  surah: number;
  ayah: number;
  texts: Record<TafsirKey, string | null>;
};

export type HadithGrade = {
  scholarAr: string;
  scholarEn: string;
  level: GradeLevel;
  /** The grade as written by the scholar, e.g. «حسن صحيح». */
  labelAr: string;
  labelEn: string;
  /** The grading library's plain-language note on the grade, e.g. «إسناده ضعيف» for «مرسل». */
  explainedAr: string | null;
  /** The scholar's book and page or number where the grade appears. */
  bookAr: string | null;
  page: string | null;
  /** Link to this grading on the grading library (e.g. Dorar). */
  sourceUrl: string | null;
};

/** A real commentary (sharh) on a hadith, quoted verbatim; shown behind the "Explain" button. */
export type HadithExplanation = {
  paragraphs: string[];
  sourceName: string;
  sourceUrl: string;
};

export type HadithCollection = {
  key: string;
  nameAr: string;
  nameEn: string;
};

export type Hadith = {
  collection: string;
  /** Library id within the collection. */
  number: number;
  /** The number scholars cite (e.g. Muslim's Abd al-Baqi numbering); may differ from `number`. */
  displayNumber: number;
  /** Book section; null for Dorar hadiths, which have none. */
  section: number | null;
  sectionAr: string | null;
  sectionEn: string | null;
  ar: string;
  en: string | null;
  /** Every grading we hold, strongest first. */
  grades: HadithGrade[];
  explanation: HadithExplanation | null;
};

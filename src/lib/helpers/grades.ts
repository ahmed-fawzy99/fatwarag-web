import type { GradeLevel } from "@/types/content";
import type { HadithGrade } from "@/types/foundations";

import { normalizeArabic } from "@/lib/helpers/arabic";

/** Grading-page term for each level, used when the wording itself has no closer match. */
const LEVEL_TERM: Record<GradeLevel, string | undefined> = {
  sahih: "sahih",
  hasan: "hasan",
  daif: "daif",
  very_daif: "daif_jiddan",
  mawdu: "mawdu",
  other: undefined,
};

/** Most specific wording first: «إسناده صحيح» must win over «صحيح». Patterns are matched on normalized Arabic. */
const PHRASE_TERMS: [RegExp, string][] = [
  [/لا اصل له/, "la_asla_lah"],
  [/موضوع|مكذوب|باطل/, "mawdu"],
  [/متروك/, "matruk"],
  [/منكر/, "munkar"],
  [/شاذ/, "shadh"],
  [/ضعيف جدا|(^|\s)واه(ي)?($|\s)/, "daif_jiddan"],
  [/مرسل/, "mursal"],
  [/منقطع|انقطاع/, "munqati"],
  [/معلول|(^|\s)معل($|\s)/, "muallal"],
  [/متواتر/, "mutawatir"],
  [/صحيح لغيره/, "sahih_lighayrih"],
  [/حسن لغيره/, "hasan_lighayrih"],
  [/اسناده صحيح|اسناد صحيح|باسناد صحيح/, "isnaduhu_sahih"],
  [/اسناده حسن|اسناد حسن|باسناد حسن/, "isnaduhu_hasan"],
  [/اسناده ضعيف|اسناد ضعيف|باسناد ضعيف/, "isnaduhu_daif"],
  [/جيد/, "jayyid"],
];

/** Which entry of the grading page explains a grading phrase (e.g. «إسناده صحيح» → isnaduhu_sahih). */
export function gradingTermFor(label: string, level: GradeLevel): string | undefined {
  const normalized = normalizeArabic(label);
  return PHRASE_TERMS.find(([pattern]) => pattern.test(normalized))?.[1] ?? LEVEL_TERM[level];
}

const ACCEPTED: GradeLevel[] = ["sahih", "hasan"];

const STRENGTH: Record<GradeLevel, number> = { sahih: 0, hasan: 1, daif: 2, very_daif: 3, mawdu: 4, other: 5 };

/** Strongest grading first (صحيح → حسن → ضعيف → ضعيف جدًا → موضوع); stable within a level. */
export function sortByStrength<T extends { level: GradeLevel }>(grades: T[]): T[] {
  return [...grades].sort((a, b) => STRENGTH[a.level] - STRENGTH[b.level]);
}

/** The grading shown by default: al-Albani's when present (as on Dorar), otherwise the first listed. */
export function pickMainGrade(grades: HadithGrade[]): HadithGrade | null {
  return grades.find((g) => g.scholarEn === "Al-Albani") ?? grades[0] ?? null;
}

/**
 * Gradings are "disputed" when scholars in our library disagree on acceptance
 * (accepted vs. rejected), or on how weak a rejected hadith is.
 */
export function isDisputed(grades: HadithGrade[]): boolean {
  const levels = new Set(grades.map((g) => g.level).filter((l) => l !== "other"));
  const accepted = [...levels].some((l) => ACCEPTED.includes(l));
  const rejected = [...levels].filter((l) => !ACCEPTED.includes(l));
  return (accepted && rejected.length > 0) || rejected.length > 1;
}

/** Classifies a grading phrase quoted from a fatwa (e.g. «صححه الألباني»), for colour only. */
export function levelFromPhrase(phrase: string): GradeLevel {
  const text = normalizeArabic(phrase);
  if (/موضوع|باطل|مكذوب|لا اصل له/.test(text)) return "mawdu";
  if (/منكر|ضعيف جدا|(^|\s)واه(ي)?($|\s)|متروك/.test(text)) return "very_daif";
  // A negated acceptance word is a rejection: «غير قوي», «ليس بصحيح», «لا يصح».
  if (/(^|\s)(غير|ليس|ليست)\s+(ب|بال)?(صحيح|قوي|حسن|ثابت|جيد)|لا (يصح|تصح|يثبت|تثبت)/.test(text)) return "daif";
  if (/ضعيف|ضعف|مرسل|منقطع|شاذ|معلول|(^|\s)معل($|\s)/.test(text)) return "daif";
  if (/صحيح|صحاح|صحح|ثابت|جيد|متواتر/.test(text)) return "sahih";
  if (/حسن|(^|\s)(ال)?حسان($|\s)|قوي/.test(text)) return "hasan";
  return "other";
}

/** A piece of stored source text. Quotes are linked to the Foundations when the content is collected. */
export type Segment =
  | { type: "text"; text: string }
  | { type: "quran"; text: string; surah: number; ayah: number; ayahEnd: number | null }
  | {
      type: "hadith";
      text: string;
      ref: HadithKey | null;
      /** The fatwa's own grading phrase, verbatim, when it grades this hadith. */
      gradingInFatwa: string | null;
      /** "group" when the fatwa's phrase grades several hadiths together. */
      gradingScope: "this" | "group" | null;
      /** The full sentence(s) around that phrase, verbatim, including any scholars it says disagreed. */
      gradingContext: string | null;
    }
  | { type: "scholar"; text: string; scholar: string; book: string | null }
  /** A reference to another fatwa of the same source («وانظر الفتوى رقم…»), collected one level deep. */
  | { type: "fatwaRef"; text: string; fatwaId: string };

/** A paragraph is a run of segments. */
export type RichParagraph = Segment[];

export type HadithKey = {
  collection: string;
  number: number;
};

export type GradeLevel = "sahih" | "hasan" | "daif" | "very_daif" | "mawdu" | "other";

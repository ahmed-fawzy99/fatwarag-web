import { LanguagesIcon } from "lucide-react";
import type { Locale } from "@/lib/config/i18n";
import type { FatwaText as FatwaTextData } from "@/types/fatwa";
import { RichText } from "./rich-text";

export type FatwaTextStrings = {
  translated: string;
  sourceSummary: string;
  question: string;
  answer: string;
  notFound: string;
  searchSource: string;
  openSource: string;
};

type FatwaTextProps = {
  locale: Locale;
  fatwaId: string;
  text: FatwaTextData;
  /** The Arabic original, shown under a machine translation. */
  arabic: FatwaTextData;
  machine: boolean;
  /** A short note above the text, e.g. why the Arabic is shown on an English page. */
  note?: string | null;
  strings: FatwaTextStrings;
};

/** The fatwa's own words: the source's summary, the question and the answer. */
export function FatwaText({ locale, fatwaId, text, arabic, machine, note = null, strings }: FatwaTextProps) {
  const textProps = { locale, fatwaId, notFoundNote: strings.notFound, searchLabel: strings.searchSource, openSourceLabel: strings.openSource };
  // The Arabic original on a page in another language (no translation available) keeps its own direction.
  const original = locale !== "ar" && text === arabic;

  return (
    <>
      {note && <p className="rounded-xl border border-dashed bg-sunken px-4 py-2.5 font-sans text-sm text-ink-soft">{note}</p>}

      {machine && (
        <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sunken px-3 py-1 text-xs text-ink-soft">
          <LanguagesIcon className="size-3.5" /> {strings.translated}
        </p>
      )}

      <div dir={original ? "rtl" : undefined} lang={original ? "ar" : undefined} className="flex flex-col gap-4">
      {text.sourceSummary && (
        <div className="rounded-xl bg-accent px-4 py-3">
          <p className="mb-1 font-sans text-sm font-semibold text-accent-foreground">{strings.sourceSummary}</p>
          <RichText paragraphs={text.sourceSummary} {...textProps} />
        </div>
      )}

      <div>
        <p className="mb-1 font-sans text-sm font-semibold text-muted-foreground">{strings.question}</p>
        <RichText paragraphs={text.question} {...textProps} />
      </div>
      <div>
        <p className="mb-1 font-sans text-sm font-semibold text-muted-foreground">{strings.answer}</p>
        <RichText paragraphs={text.answer} {...textProps} />
      </div>
      </div>

      {machine && (
        <details className="rounded-xl border bg-sunken/50 px-4 py-2">
          <summary className="cursor-pointer py-1 text-sm font-medium text-ink-soft">العربية · Original text</summary>
          <div dir="rtl" lang="ar" className="pt-2">
            <RichText paragraphs={arabic.answer} {...textProps} />
          </div>
        </details>
      )}
    </>
  );
}

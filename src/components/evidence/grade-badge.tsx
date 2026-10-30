"use client";

import { BookOpenIcon } from "lucide-react";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { gradingTermFor } from "@/lib/helpers/grades";
import { cn } from "@/lib/utils";
import type { GradeLevel } from "@/types/content";

export const GRADE_TEXT_CLASS: Record<GradeLevel, string> = {
  sahih: "text-grade-sahih",
  hasan: "text-grade-hasan",
  daif: "text-grade-daif",
  very_daif: "text-grade-very-daif",
  mawdu: "text-grade-mawdu",
  other: "text-grade-other",
};

type GradeBadgeProps = {
  locale: Locale;
  level: GradeLevel;
  label: string;
  glossaryLabel: string;
  /** For a fatwa's own phrase: the full sentence it came from, and a note when it grades several hadiths at once. */
  context?: { text: string; title: string; note: string | null } | null;
};

/** A grading word, colour-coded, with a dotted underline that opens its entry on the hadith-grading page. */
export function GradeBadge({ locale, level, label, glossaryLabel, context }: GradeBadgeProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("border-b-[1.5px] border-dotted border-current font-bold leading-tight", GRADE_TEXT_CLASS[level])}
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-3 text-sm", context ? "w-[min(26rem,90vw)]" : "w-auto max-w-72")} side="top">
        {context && (
          <div className="mb-3 flex flex-col gap-1.5 border-b border-current/15 pb-3">
            <p className="text-xs font-semibold opacity-70">{context.title}</p>
            <p className="font-reading text-[0.95rem] leading-relaxed" lang="ar" dir="rtl">
              «{context.text}»
            </p>
            {context.note && <p className="text-xs opacity-80">{context.note}</p>}
          </div>
        )}
        <Link href={routes.gradings(locale, gradingTermFor(label, level))} target="_blank" className="flex items-center gap-2 font-medium hover:underline">
          <BookOpenIcon className="size-4" />
          {glossaryLabel}
        </Link>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { GradeLevel } from "@/types/content";
import { GRADE_TEXT_CLASS } from "./grade-badge";

export type DisputeGrade = {
  scholar: string;
  label: string;
  level: GradeLevel;
  /** Book and page, e.g. «صحيح أبي داود · 1563». */
  where: string | null;
  /** The grading page entry for this label. */
  termHref: string;
};

type DisputeIconProps = {
  title: string;
  listTitle: string;
  /** Already sorted, strongest first. */
  grades: DisputeGrade[];
};

/** Small "!" shown when scholars in our library disagree; opens every grading we hold, strongest first. */
export function DisputeIcon({ title, listTitle, grades }: DisputeIconProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={title}
          className="inline-grid size-[13px] cursor-pointer place-items-center rounded-full border-[1.2px] border-grade-daif align-[1px] text-[0.55rem] leading-none font-bold text-grade-daif"
        >
          !
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-[min(24rem,90vw)] p-0 text-sm">
        <div className="border-b border-current/15 px-3 pt-3 pb-2">
          <p className="font-semibold">{title}</p>
          <p className="text-xs opacity-70">{listTitle}</p>
        </div>
        <ul className="flex max-h-72 flex-col overflow-x-hidden overflow-y-auto px-3 py-2">
          {grades.map((grade, index) => (
            <li key={index} className="flex items-start justify-between gap-4 border-b border-current/10 py-1.5 last:border-b-0">
              <span className="min-w-0 break-words">
                <span className="block">{grade.scholar}</span>
                {grade.where && <span className="block text-xs opacity-60">{grade.where}</span>}
              </span>
              <Link href={grade.termHref} target="_blank" className={cn("max-w-[45%] shrink-0 text-end font-semibold hover:underline", GRADE_TEXT_CLASS[grade.level])}>
                {grade.label}
              </Link>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

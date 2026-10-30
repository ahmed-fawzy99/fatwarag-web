"use client";

import { SearchIcon } from "lucide-react";
import { track } from "@/lib/analytics/client";
import { EVENTS } from "@/lib/analytics/events";
import type { Locale } from "@/lib/config/i18n";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type NotFoundReferenceProps = {
  locale: Locale;
  text: string;
  note: string;
  /** For a hadith we don't have: a search for it on Dorar, opened in a new tab. */
  search?: { href: string; label: string } | null;
};

/** A quoted source we couldn't find in our library: dotted text with an explanation on hover or tap (the text is focusable). */
export function NotFoundReference({ locale, text, note, search = null }: NotFoundReferenceProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="cursor-help border-b-[1.5px] border-dotted border-muted-foreground text-ink-soft">
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent className="flex max-w-72 flex-col items-start gap-2 text-start text-sm leading-relaxed">
        <span>{note}</span>
        {search && (
          <a
            href={search.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track(EVENTS.dorarSearchClicked, { locale })}
            className="inline-flex items-center gap-1.5 rounded-md bg-background/15 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-background/25"
          >
            {search.label}
            <SearchIcon className="size-3.5" aria-hidden="true" />
          </a>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

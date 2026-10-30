"use client";

import { track } from "@/lib/analytics/client";
import { EVENTS } from "@/lib/analytics/events";
import type { Locale } from "@/lib/config/i18n";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { scrollToElement } from "@/lib/helpers/scroll";
import { useOpenFatwasStore } from "@/stores/open-fatwas-store";

type CitationChipProps = {
  locale: Locale;
  fatwaId: string;
  number: string;
  title: string;
  sourceName: string;
};

/** Numbered citation; hover shows the fatwa, click opens it in the list and scrolls to it. */
export function CitationChip({ locale, fatwaId, number, title, sourceName }: CitationChipProps) {
  const open = useOpenFatwasStore((state) => state.open);

  function openFatwa(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    track(EVENTS.citationClicked, { locale, fatwa_id: fatwaId });
    open(fatwaId);
    const item = document.getElementById(`fatwa-${fatwaId}`);
    if (item) scrollToElement(item);
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={`#fatwa-${fatwaId}`}
          onClick={openFatwa}
          className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-accent px-1.5 align-[2px] font-sans text-[0.72rem] font-semibold text-accent-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {number}
        </a>
      </TooltipTrigger>
      <TooltipContent className="max-w-72">
        <div className="flex flex-col gap-0.5 text-start">
          <span className="font-semibold">{title}</span>
          <span className="opacity-75">{sourceName}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

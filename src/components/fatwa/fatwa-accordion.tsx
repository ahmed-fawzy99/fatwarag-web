"use client";

import { LanguagesIcon } from "lucide-react";
import { track } from "@/lib/analytics/client";
import { EVENTS } from "@/lib/analytics/events";
import type { Locale } from "@/lib/config/i18n";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useOpenFatwasStore } from "@/stores/open-fatwas-store";

export type FatwaAccordionEntry = {
  id: string;
  number: string;
  title: string;
  titleTranslated: boolean;
  sourceName: string;
  body: React.ReactNode;
};

type FatwaAccordionProps = {
  locale: Locale;
  entries: FatwaAccordionEntry[];
  translatedLabel: string;
  /** A fatwa shown open until the reader opens or closes something themselves (the answer page opens its first). */
  defaultOpenId?: string | null;
};

/** Fatwas collapsed by default (except `defaultOpenId`); each shows only its title and source until opened. */
export function FatwaAccordion({ locale, entries, translatedLabel, defaultOpenId = null }: FatwaAccordionProps) {
  const openIds = useOpenFatwasStore((state) => state.openIds);
  const seededFor = useOpenFatwasStore((state) => state.seededFor);
  const setOpenIds = useOpenFatwasStore((state) => state.setOpenIds);
  // Until the reader toggles something on this list, its default fatwa shows open alongside any opened by citations.
  const pendingDefault = defaultOpenId && seededFor !== defaultOpenId && !openIds.includes(defaultOpenId);
  const value = pendingDefault ? [defaultOpenId, ...openIds] : openIds;

  return (
    <Accordion
      type="multiple"
      value={value}
      onValueChange={(ids) => {
        for (const id of ids) if (!value.includes(id)) track(EVENTS.fatwaOpened, { locale, fatwa_id: id, surface: "accordion" });
        setOpenIds(ids, defaultOpenId);
      }}
      className="flex flex-col gap-2.5"
    >
      {entries.map((entry) => (
        <AccordionItem
          key={entry.id}
          value={entry.id}
          id={`fatwa-${entry.id}`}
          className="scroll-mt-pinned overflow-hidden rounded-xl border bg-card transition-[border-color,box-shadow] not-last:border-b data-[state=open]:border-primary/40 data-[state=open]:shadow-xs"
        >
          <AccordionTrigger className="items-center gap-3 px-4 py-3 text-base hover:no-underline [&[data-state=open]_.fatwa-title]:text-accent-foreground">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground">
              {entry.number}
            </span>
            {/* Mobile: title takes the full width, source pill drops below it. sm+: side by side. */}
            <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-3">
              <span className="fatwa-title min-w-0 font-semibold transition-colors sm:flex-1">
                {entry.title}
                {entry.titleTranslated && <LanguagesIcon className="ms-1.5 inline size-3.5 text-muted-foreground" aria-label={translatedLabel} />}
              </span>
              <span className="shrink-0 rounded-full bg-sunken px-2.5 py-0.5 text-xs font-normal text-ink-soft">{entry.sourceName}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="border-t px-4 pt-4 pb-5 text-base [&_p:not(:last-child)]:mb-0">{entry.body}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

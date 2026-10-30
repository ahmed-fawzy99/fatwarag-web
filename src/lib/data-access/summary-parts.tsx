"use server";

import type { ReactNode } from "react";
import { citationInfo, fatwaEntries } from "@/components/answer/fatwa-entries";
import { SummaryEvidence } from "@/components/answer/summary-evidence";
import { FatwaAccordion } from "@/components/fatwa/fatwa-accordion";
import { getFatwasByIds } from "@/lib/data-access/fatwas";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { summaryEvidenceInputSchema, summaryExtrasInputSchema } from "@/lib/zod-schemas/summary";
import type { CitationInfo, Evidence } from "@/types/answer";
import type { Locale } from "@/lib/config/i18n";

/**
 * Renders a streamed summary part's verses and hadiths on the server (they come from stored text, through the
 * same blocks the rest of the site uses), so the browser can show the part complete. Null when there's nothing to
 * show or the input isn't evidence.
 */
export async function renderSummaryEvidence(locale: Locale, evidence: Evidence[]): Promise<ReactNode> {
  const input = summaryEvidenceInputSchema.safeParse({ locale, evidence });
  if (!input.success || input.data.evidence.length === 0) return null;
  const dict = await getDictionary(input.data.locale);
  return <SummaryEvidence evidence={input.data.evidence as Evidence[]} locale={input.data.locale} dict={dict} />;
}

export type SummaryExtras = { citations: CitationInfo; list: ReactNode };

/**
 * The cross-referenced fatwas a finished summary cites that the search didn't return: how citations show them, and
 * their entries for the end of the fatwa list (numbered after the `offset` fatwas already listed).
 */
export async function loadSummaryExtras(locale: Locale, question: string, ids: string[], offset: number): Promise<SummaryExtras> {
  const input = summaryExtrasInputSchema.safeParse({ locale, question, ids, offset });
  if (!input.success || input.data.ids.length === 0) return { citations: {}, list: null };
  const { data } = input;
  const fatwas = await getFatwasByIds(data.ids, data.locale).catch(() => []);
  if (fatwas.length === 0) return { citations: {}, list: null };
  const dict = await getDictionary(data.locale);
  const [citations, entries] = await Promise.all([
    citationInfo(fatwas, data.locale, data.offset),
    fatwaEntries({ locale: data.locale, dict, question: data.question }, fatwas, data.offset),
  ]);
  return { citations, list: <FatwaAccordion locale={data.locale} entries={entries} translatedLabel={dict.fatwa.translated} /> };
}

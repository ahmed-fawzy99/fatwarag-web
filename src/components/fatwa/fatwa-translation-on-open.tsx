"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics/client";
import { EVENTS } from "@/lib/analytics/events";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import type { FatwaText as FatwaTextData } from "@/types/fatwa";
import { FatwaText, type FatwaTextStrings } from "./fatwa-text";
import { TranslationSkeleton } from "./translation-skeleton";

type FatwaTranslationOnOpenProps = {
  id: string;
  locale: Locale;
  arabic: FatwaTextData;
  strings: FatwaTextStrings & { translationFailed: string; translating: string };
};

type State = { status: "loading" } | { status: "done"; text: FatwaTextData | null };

/** A little over the API's 25 s translation limit. */
const TRANSLATION_TIMEOUT_MS = 35_000;

/**
 * First-open translation for a fatwa expanded in the answer page's list. It mounts only when the accordion opens,
 * so collapsed fatwas are never translated. It fetches a GET route (not a server action, which Next runs one at a
 * time), so fatwas opened together translate in parallel. On any failure or timeout the Arabic is shown.
 */
export function FatwaTranslationOnOpen({ id, locale, arabic, strings }: FatwaTranslationOnOpenProps) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    track(EVENTS.fatwaTranslationRequested, { locale, fatwa_id: id, surface: "accordion" });
    const controller = new AbortController();
    fetch(routes.api.translation(id, locale), { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(TRANSLATION_TIMEOUT_MS)]) })
      .then((response) => (response.ok ? (response.json() as Promise<FatwaTextData>) : null))
      .catch(() => null)
      .then((text) => {
        if (!controller.signal.aborted) setState({ status: "done", text });
      });
    return () => controller.abort();
  }, [id, locale]);

  if (state.status === "loading") return <TranslationSkeleton label={strings.translating} />;
  if (state.text) return <FatwaText locale={locale} fatwaId={id} text={state.text} arabic={arabic} machine strings={strings} />;
  return <FatwaText locale={locale} fatwaId={id} text={arabic} arabic={arabic} machine={false} note={strings.translationFailed} strings={strings} />;
}

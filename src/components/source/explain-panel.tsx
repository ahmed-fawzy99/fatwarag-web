"use client";

import { BookOpenTextIcon, RotateCwIcon } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TAFSIR_KEYS } from "@/lib/config/constants";
import { routes } from "@/lib/config/routes";
import { format } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { useTafsirPreferenceStore } from "@/stores/tafsir-preference-store";
import type { TafsirKey } from "@/types/foundations";

type ExplainStrings = {
  explain: string;
  hideExplain: string;
  tafsirLabel: string;
  tafsirFrom: string;
  noTafsir: string;
  tafsirFailed: string;
  retry: string;
  tafsirNames: Record<TafsirKey, string>;
};

type ExplainPanelProps =
  /** The verse's tafsir is loaded the first time the panel opens. */
  | { kind: "tafsir"; surah: number; ayah: number; strings: ExplainStrings }
  | { kind: "note"; note: string; strings: Pick<ExplainStrings, "explain" | "hideExplain"> }
  | {
      kind: "passage";
      passage: { paragraphs: string[]; sourceName: string; sourceUrl: string };
      strings: Pick<ExplainStrings, "explain" | "hideExplain" | "tafsirFrom">;
    };

type TafsirTexts = Record<TafsirKey, string | null>;

type TafsirState = { status: "idle" | "loading" | "failed" } | { status: "done"; texts: TafsirTexts | null };

const TAFSIR_TIMEOUT_MS = 20_000;

/** Fetches a verse's tafsir from the BFF route; null when the library has none for it. Throws on any failure. */
async function fetchTafsir(surah: number, ayah: number): Promise<TafsirTexts | null> {
  const response = await fetch(routes.api.tafsir(surah, ayah), { signal: AbortSignal.timeout(TAFSIR_TIMEOUT_MS) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Tafsir request failed (${response.status})`);
  return (await response.json()) as TafsirTexts;
}

/** "Explain" (شرح): real explanation text from a named source — never AI-written. */
export function ExplainPanel(props: ExplainPanelProps) {
  const [open, setOpen] = useState(false);
  const [tafsirState, setTafsirState] = useState<TafsirState>({ status: "idle" });
  const tafsir = useTafsirPreferenceStore((state) => state.tafsir);
  const setTafsir = useTafsirPreferenceStore((state) => state.setTafsir);

  function loadTafsir() {
    if (props.kind !== "tafsir") return;
    setTafsirState({ status: "loading" });
    fetchTafsir(props.surah, props.ayah).then(
      (texts) => setTafsirState({ status: "done", texts }),
      () => setTafsirState({ status: "failed" }),
    );
  }

  function toggle() {
    setOpen((value) => !value);
    if (tafsirState.status === "idle") loadTafsir();
  }

  const texts = tafsirState.status === "done" ? tafsirState.texts : null;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-lg border px-2.5 py-1 font-sans text-xs transition-colors",
          open ? "border-primary/50 text-accent-foreground" : "bg-card text-ink-soft hover:text-accent-foreground",
        )}
      >
        <BookOpenTextIcon className="size-3.5" />
        {open ? props.strings.hideExplain : props.strings.explain}
      </button>

      {open && props.kind === "note" && (
        <p className="rounded-xl border border-dashed bg-sunken px-4 py-3 font-sans text-sm leading-relaxed text-ink-soft">{props.note}</p>
      )}

      {open && props.kind === "passage" && (
        <div className="rounded-xl bg-sunken px-4 py-3">
          <p className="mb-1 font-sans text-xs text-muted-foreground">
            <a href={props.passage.sourceUrl} target="_blank" rel="noopener" className="hover:text-accent-foreground hover:underline">
              {format(props.strings.tafsirFrom, { name: props.passage.sourceName })}
            </a>
          </p>
          <div dir="rtl" lang="ar" className="text-reading flex max-h-96 flex-col gap-2 overflow-y-auto pe-1">
            {props.passage.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}

      {open && props.kind === "tafsir" && (
        <div className="rounded-xl bg-sunken px-4 py-3">
          <div role="radiogroup" aria-label={props.strings.tafsirLabel} className="mb-2 flex flex-wrap gap-1.5 font-sans">
            {TAFSIR_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={tafsir === key}
                onClick={() => setTafsir(key)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition-colors",
                  tafsir === key ? "bg-primary text-primary-foreground" : "bg-card text-ink-soft hover:text-accent-foreground",
                )}
              >
                {props.strings.tafsirNames[key]}
              </button>
            ))}
          </div>
          {tafsirState.status === "failed" ? (
            <div className="flex flex-wrap items-center gap-2 font-sans text-sm text-muted-foreground">
              <span>{props.strings.tafsirFailed}</span>
              <button
                type="button"
                onClick={loadTafsir}
                className="inline-flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1 text-xs text-ink-soft hover:text-accent-foreground"
              >
                <RotateCwIcon className="size-3.5" />
                {props.strings.retry}
              </button>
            </div>
          ) : tafsirState.status !== "done" ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : texts?.[tafsir] ? (
            <>
              <p className="mb-1 font-sans text-xs text-muted-foreground">
                {format(props.strings.tafsirFrom, { name: props.strings.tafsirNames[tafsir] })}
              </p>
              <div dir="rtl" lang="ar" className="text-reading max-h-96 overflow-y-auto pe-1 whitespace-pre-line">
                {texts[tafsir]}
              </div>
            </>
          ) : (
            <p className="font-sans text-sm text-muted-foreground">{props.strings.noTafsir}</p>
          )}
        </div>
      )}
    </div>
  );
}

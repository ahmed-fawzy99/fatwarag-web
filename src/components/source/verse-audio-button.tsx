"use client";

import { Loader2Icon, PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics/client";
import { EVENTS } from "@/lib/analytics/events";
import type { Locale } from "@/lib/config/i18n";
import { VERSE_AUDIO } from "@/lib/config/constants";
import { verseAudioUrl } from "@/lib/helpers/verse-audio";
import { format } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

type VerseAudioStrings = {
  listen: string;
  pause: string;
  audioFailed: string;
  reciter: string;
};

type VerseAudioButtonProps = { locale: Locale; surah: number; ayah: number; strings: VerseAudioStrings };

type AudioState = "idle" | "loading" | "playing" | "failed";

/** Only one verse plays at a time: starting one stops whichever is active. */
let active: { audio: HTMLAudioElement; reset: () => void } | null = null;

/** Plays one ayah from a public recording. The audio is requested only on click, never on load. */
export function VerseAudioButton({ locale, surah, ayah, strings }: VerseAudioButtonProps) {
  const [state, setState] = useState<AudioState>("idle");
  /** Share of the recording played, 0–1; kept while paused so the button shows where it will resume. */
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(
    () => () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      if (active?.audio === audio) active = null;
    },
    [],
  );

  function start() {
    active?.reset();
    let element = audioRef.current;
    if (!element) {
      element = new Audio();
      element.preload = "none";
      element.src = verseAudioUrl(surah, ayah);
      element.onended = () => (setState("idle"), setProgress(0));
      element.ontimeupdate = () => setProgress(element && element.duration ? element.currentTime / element.duration : 0);
      element.onerror = () => setState("failed");
      audioRef.current = element;
    }
    const playing = element;
    active = { audio: playing, reset: () => (playing.pause(), setState("idle")) };
    setState("loading");
    playing.play().then(
      () => {
        setState("playing");
        track(EVENTS.verseAudioPlayed, { locale, surah, ayah });
      },
      () => setState("failed"),
    );
  }

  function toggle() {
    if (state === "playing" || state === "loading") {
      audioRef.current?.pause();
      setState("idle");
      return;
    }
    start();
  }

  const reciter = locale === "ar" ? VERSE_AUDIO.reciterAr : VERSE_AUDIO.reciterEn;
  const label = state === "playing" ? strings.pause : strings.listen;
  const Icon = state === "loading" ? Loader2Icon : state === "playing" ? PauseIcon : PlayIcon;

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        title={`${label} · ${format(strings.reciter, { name: reciter })}`}
        aria-busy={state === "loading"}
        className={cn(
          "relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg border px-2.5 py-1 font-sans text-xs transition-colors",
          state === "playing" ? "border-primary/50 text-accent-foreground" : "bg-card text-ink-soft hover:text-accent-foreground",
        )}
      >
        {/* How much of the verse has played, filling from the start side (right in Arabic). */}
        <span
          aria-hidden
          className="absolute inset-y-0 start-0 bg-primary/15 transition-[width] duration-300 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
        <span className="relative">{label}</span>
        <Icon className={cn("relative size-3.5", state === "loading" && "animate-spin")} />
      </button>
      {state === "failed" && (
        <span role="status" className="font-sans text-xs text-muted-foreground">
          {strings.audioFailed}
        </span>
      )}
    </span>
  );
}

import { VERSE_AUDIO } from "@/lib/config/constants";

/** The public per-ayah recording URL, built from the numbers alone (no API call). */
export function verseAudioUrl(surah: number, ayah: number): string {
  return `${VERSE_AUDIO.baseUrl}/${String(surah).padStart(3, "0")}${String(ayah).padStart(3, "0")}.mp3`;
}

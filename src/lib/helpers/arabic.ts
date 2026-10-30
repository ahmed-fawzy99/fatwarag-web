/** Harakat, Quranic annotation marks and tatweel — removed for search and matching only. */
const IGNORED = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/;

const LETTER_MAP: Record<string, string> = {
  "أ": "ا",
  "إ": "ا",
  "آ": "ا",
  "ٱ": "ا",
  "ة": "ه",
  "ى": "ي",
  "ؤ": "و",
  "ئ": "ي",
};

const PUNCTUATION = /[\s"'«»“”‘’()[\]{}،,.؛;:!?؟\-–—…‏]/;

/**
 * Normalises Arabic text for matching: drops harakat/tatweel/punctuation, unifies letter variants,
 * and returns a map from each normalised character back to its index in the original string.
 */
export function normalizeWithMap(text: string): { normalized: string; map: number[] } {
  let normalized = "";
  const map: number[] = [];
  let lastWasSpace = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (IGNORED.test(ch)) continue;
    if (PUNCTUATION.test(ch)) {
      if (!lastWasSpace) {
        normalized += " ";
        map.push(i);
        lastWasSpace = true;
      }
      continue;
    }
    normalized += (LETTER_MAP[ch] ?? ch).toLowerCase();
    map.push(i);
    lastWasSpace = false;
  }
  return { normalized: normalized.trimEnd(), map };
}

export function normalizeArabic(text: string): string {
  return normalizeWithMap(text).normalized;
}

/**
 * Finds a (possibly differently voweled or punctuated) quote inside an original text.
 * Returns the range in the ORIGINAL string, so highlights keep the full harakat.
 * Falls back to the longest matching run of words when the quote is partial or paraphrased.
 */
export function findQuoteRange(original: string, quote: string): { start: number; end: number } | null {
  const { normalized, map } = normalizeWithMap(original);
  const needle = normalizeArabic(quote);
  if (!needle) return null;

  const exact = normalized.indexOf(needle);
  if (exact >= 0) return toOriginalRange(map, exact, exact + needle.length, original);

  const words = needle.split(" ");
  const minWords = Math.min(4, words.length);
  for (let size = words.length - 1; size >= minWords; size--) {
    for (let from = 0; from + size <= words.length; from++) {
      const chunk = words.slice(from, from + size).join(" ");
      const pos = normalized.indexOf(chunk);
      if (pos >= 0) return toOriginalRange(map, pos, pos + chunk.length, original);
    }
  }
  return null;
}

function toOriginalRange(map: number[], start: number, end: number, original: string) {
  const startIndex = map[start];
  let endIndex = map[end - 1] + 1;
  // Extend over trailing harakat that belong to the last matched letter.
  while (endIndex < original.length && IGNORED.test(original[endIndex])) endIndex++;
  return { start: startIndex, end: endIndex };
}

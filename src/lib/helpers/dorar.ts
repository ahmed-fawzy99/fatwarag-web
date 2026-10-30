/** Dorar's search works best on the opening words of a hadith, not a whole paragraph. */
const MAX_QUERY_WORDS = 12;

/**
 * A word search on Dorar's hadith encyclopedia for a quote we don't have in our library.
 * Harakat and surrounding quote marks are dropped; the letters are otherwise sent as written.
 */
export function dorarSearchUrl(quote: string): string {
  const query = quote
    // Harakat, Quranic marks and tatweel are dropped: Dorar's word search matches bare letters.
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
    .replace(/[«»"“”]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, MAX_QUERY_WORDS)
    .join(" ");

  return `https://dorar.net/hadith/search?q=${encodeURIComponent(query)}&searchType=word`;
}

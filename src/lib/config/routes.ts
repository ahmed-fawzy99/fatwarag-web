import { DEFAULT_LOCALE, type Locale } from "@/lib/config/i18n";

/** Arabic (default) lives at the root; other locales are prefixed (e.g. /en/ask). */
function withLocale(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** Where a source link came from: the fatwa that quoted it and the quoted text (highlighted, and attached to reports). */
export type SourceLinkRef = { quote?: string | null; fromFatwaId?: string | null };

function query(params: Record<string, string | number | null | undefined>): string {
  const entries = Object.entries(params).filter((entry): entry is [string, string | number] => entry[1] !== null && entry[1] !== undefined && entry[1] !== "");
  return entries.length ? `?${entries.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&")}` : "";
}

export const routes = {
  home: (locale: Locale) => withLocale(locale, "/"),
  /** An answer page. `token` is the sealed question (`@/lib/answer/ask-link`); questions never go in URLs as text. */
  ask: (locale: Locale, token: string) => withLocale(locale, `/ask?t=${encodeURIComponent(token)}`),
  /** A shared answer (stored with the visitor's consent). */
  share: (locale: Locale, id: string) => withLocale(locale, `/s/${encodeURIComponent(id)}`),
  fatwa: (locale: Locale, id: string) => withLocale(locale, `/fatwas/${id}`),
  quran: (locale: Locale, surah: number, ayah?: number, ref?: SourceLinkRef) =>
    withLocale(locale, `/quran/${surah}${query({ ayah, q: ref?.quote, from: ref?.fromFatwaId })}`),
  /** `hl` is the quote highlighted inside the hadith text. */
  hadith: (locale: Locale, collection: string, number: number, ref?: SourceLinkRef) =>
    withLocale(locale, `/hadith/${collection}/${number}${query({ hl: ref?.quote, from: ref?.fromFatwaId })}`),
  topics: (locale: Locale) => withLocale(locale, "/topics"),
  topic: (locale: Locale, key: string, page?: number) =>
    withLocale(locale, `/topics/${key}${page && page > 1 ? `?page=${page}` : ""}`),
  mufti: (locale: Locale, key: string, page?: number) =>
    withLocale(locale, `/muftis/${key}${page && page > 1 ? `?page=${page}` : ""}`),
  /** One page for every hadith grading; the term is switched through `?term=`. */
  gradings: (locale: Locale, term?: string) => withLocale(locale, `/hadith-grading${term ? `?term=${term}` : ""}`),
  contact: (locale: Locale) => withLocale(locale, "/contact"),
  privacy: (locale: Locale) => withLocale(locale, "/privacy"),
  /** BFF endpoints the browser fetches (route handlers, not pages; never locale-prefixed). */
  api: {
    translation: (id: string, locale: Locale) => `/api/fatwas/${encodeURIComponent(id)}/translation?locale=${locale}`,
    tafsir: (surah: number, ayah: number) => `/api/tafsir/${surah}/${ayah}`,
    /** The summary as it is written and checked (server-sent events). */
    summaryStream: (answerId: string, locale: Locale) => `/api/answers/${encodeURIComponent(answerId)}/summary/stream?locale=${locale}`,
    /** The whole summary in one JSON response; the fallback when the stream breaks. */
    summary: (answerId: string, locale: Locale) => `/api/answers/${encodeURIComponent(answerId)}/summary?locale=${locale}`,
  },
  /** Same page in another locale, given a locale-free path. */
  switchLocale: (locale: Locale, pathWithoutLocale: string) => withLocale(locale, pathWithoutLocale),
};

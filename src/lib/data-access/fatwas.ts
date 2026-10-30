import "server-only";
import { apiGet, orNull } from "@/lib/api/client";
import type { Locale } from "@/lib/config/i18n";
import type { Fatwa, FatwaListItem, FatwaText } from "@/types/fatwa";
import type { Paginated } from "@/types/pagination";

const HOUR = 3600;

export async function getFatwa(id: string, locale: Locale): Promise<Fatwa | null> {
  return orNull(apiGet<Fatwa>(`/fatwas/${encodeURIComponent(id)}`, { locale, revalidate: HOUR, tags: [`fatwa:${id}`] }));
}

/** Keeps the requested order (relevance order from search); missing ids are skipped. */
export async function getFatwasByIds(ids: string[], locale: Locale): Promise<Fatwa[]> {
  if (ids.length === 0) return [];
  return apiGet<Fatwa[]>("/fatwas", { locale, query: { ids: ids.join(",") }, revalidate: 300 });
}

/** One page of a topic's fatwas (the topic and its descendants). */
export async function listFatwasByTopic(topicKey: string, locale: Locale, page = 1): Promise<Paginated<FatwaListItem>> {
  return apiGet<Paginated<FatwaListItem>>(`/topics/${encodeURIComponent(topicKey)}/fatwas`, {
    locale,
    query: { page },
    revalidate: HOUR,
    tags: [`topic:${topicKey}`],
  });
}

/** One page of a mufti's (or institution's) fatwas. */
export async function listFatwasByMufti(muftiKey: string, locale: Locale, page = 1): Promise<Paginated<FatwaListItem>> {
  return apiGet<Paginated<FatwaListItem>>(`/muftis/${encodeURIComponent(muftiKey)}/fatwas`, {
    locale,
    query: { page },
    revalidate: HOUR,
    tags: [`mufti:${muftiKey}`],
  });
}

/**
 * "Related fatwas": other fatwas from the library on the same topics. Plain library lookup, no AI.
 * More reading is optional, so a failure just hides the section.
 */
export async function listRelatedFatwas(topicKeys: string[], excludeIds: string[], locale: Locale): Promise<FatwaListItem[]> {
  if (topicKeys.length === 0) return [];
  return apiGet<FatwaListItem[]>("/related", {
    locale,
    query: { topicKeys: topicKeys.join(","), exclude: excludeIds.join(",") },
    revalidate: HOUR,
  }).catch(() => []);
}

/** Related fatwas for a single fatwa page. */
export async function listFatwaRelated(id: string, locale: Locale): Promise<FatwaListItem[]> {
  return apiGet<FatwaListItem[]>(`/fatwas/${encodeURIComponent(id)}/related`, { locale, revalidate: HOUR, tags: [`fatwa:${id}`] }).catch(() => []);
}

/**
 * The fatwa's machine translation, made on first request (the API allows it 25 s). Per visitor and uncached:
 * the API stores the translation, so later readers get it with the fatwa. Null on any failure: show the Arabic.
 */
export async function getTranslation(id: string, locale: Locale): Promise<FatwaText | null> {
  return apiGet<FatwaText>(`/fatwas/${encodeURIComponent(id)}/translation`, { locale, timeoutMs: 30_000 }).catch(() => null);
}

export type SitemapEntry = { id: string; updatedAt: string | null; hasEnglish: boolean };

/** One page (5,000 entries) of the hadith sitemap: hadiths whose Dorar lookup is done. */
export async function listSitemapHadiths(page: number): Promise<Paginated<{ id: number; updatedAt: string | null }>> {
  return apiGet<Paginated<{ id: number; updatedAt: string | null }>>("/sitemap/hadiths", { query: { page }, revalidate: HOUR, tags: ["sitemap"] });
}

/** One page (5,000 entries) of the fatwa sitemap. */
export async function listSitemapFatwas(page: number): Promise<Paginated<SitemapEntry>> {
  return apiGet<Paginated<SitemapEntry>>("/sitemap/fatwas", { query: { page }, revalidate: HOUR, tags: ["sitemap"] });
}

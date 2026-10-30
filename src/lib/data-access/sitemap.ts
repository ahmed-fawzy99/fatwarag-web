import "server-only";
import type { MetadataRoute } from "next";
import { LOCALES, type Locale } from "@/lib/config/i18n";
import { HADITH_LIBRARY, MAX_SHARE_SITEMAPS } from "@/lib/config/constants";
import { routes } from "@/lib/config/routes";
import { listTopics } from "@/lib/data-access/catalog";
import { listSitemapFatwas, listSitemapHadiths } from "@/lib/data-access/fatwas";
import { listSitemapShares } from "@/lib/data-access/shares";
import { absoluteUrl } from "@/lib/helpers/seo";
import type { Topic } from "@/types/topic";

const SURAH_COUNT = 114;

/** A page in every language, linked to its other-language versions. `path` is the locale-free path. */
function everyLanguage(path: string, languages: readonly Locale[] = LOCALES, lastModified?: string): MetadataRoute.Sitemap {
  const alternates = { languages: Object.fromEntries(languages.map((lang) => [lang, absoluteUrl(routes.switchLocale(lang, path))])) };
  return languages.map((lang) => ({
    url: absoluteUrl(routes.switchLocale(lang, path)),
    alternates,
    ...(lastModified ? { lastModified } : {}),
  }));
}

function topicKeys(nodes: Topic[]): string[] {
  return nodes.flatMap((node) => [node.key, ...topicKeys(node.children)]);
}

/** Home, topics, the Quran, the grading reference, contact and the privacy policy. */
export async function staticSitemap(): Promise<MetadataRoute.Sitemap> {
  const topics = await listTopics().catch(() => []);
  return [
    ...everyLanguage("/"),
    ...everyLanguage("/topics"),
    ...topicKeys(topics).flatMap((key) => everyLanguage(routes.topic("ar", key))),
    ...Array.from({ length: SURAH_COUNT }, (_, i) => everyLanguage(routes.quran("ar", i + 1))).flat(),
    ...everyLanguage(routes.gradings("ar")),
    ...everyLanguage(routes.contact("ar")),
    ...everyLanguage(routes.privacy("ar")),
  ];
}

/** One API sitemap page of fatwas. An English page is listed only once its translation exists. */
export async function fatwaSitemap(page: number): Promise<MetadataRoute.Sitemap> {
  const { data } = await listSitemapFatwas(page);
  return data.flatMap((entry) =>
    everyLanguage(routes.fatwa("ar", entry.id), entry.hasEnglish ? LOCALES : ["ar"], entry.updatedAt ?? undefined),
  );
}

/** One API sitemap page of hadith source pages, in both languages. */
export async function hadithSitemap(page: number): Promise<MetadataRoute.Sitemap> {
  const { data } = await listSitemapHadiths(page);
  return data.flatMap((entry) => everyLanguage(routes.hadith("ar", HADITH_LIBRARY.key, entry.id), LOCALES, entry.updatedAt ?? undefined));
}

/** One API sitemap page of shared answers, each in the one language it was shared in. */
export async function shareSitemap(page: number): Promise<MetadataRoute.Sitemap> {
  const { data } = await listSitemapShares(page);
  return data.map((entry) => ({ url: absoluteUrl(routes.share(entry.locale, entry.id)), ...(entry.updatedAt ? { lastModified: entry.updatedAt } : {}) }));
}

/** How many fatwa sitemaps are in use right now (at least one, so a new site still lists one). */
export async function fatwaSitemapCount(): Promise<number> {
  const { meta } = await listSitemapFatwas(1).catch(() => ({ meta: { lastPage: 1 } }));
  return Math.max(1, meta.lastPage);
}

/** How many hadith sitemaps are in use right now (none until a hadith lookup is done). */
export async function hadithSitemapCount(): Promise<number> {
  const { meta } = await listSitemapHadiths(1).catch(() => ({ meta: { total: 0, lastPage: 0 } }));
  return meta.total > 0 ? meta.lastPage : 0;
}

/** How many shared answer sitemaps are in use right now (none until something is shared). */
export async function shareSitemapCount(): Promise<number> {
  const { meta } = await listSitemapShares(1).catch(() => ({ meta: { total: 0, lastPage: 0 } }));
  return meta.total > 0 ? Math.min(meta.lastPage, MAX_SHARE_SITEMAPS) : 0;
}

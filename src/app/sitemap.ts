import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { MAX_FATWA_SITEMAPS, MAX_HADITH_SITEMAPS, MAX_SHARE_SITEMAPS } from "@/lib/config/constants";
import { fatwaSitemap, hadithSitemap, shareSitemap, staticSitemap } from "@/lib/data-access/sitemap";

/**
 * `/sitemap/0.xml` lists the fixed pages; `/sitemap/N.xml` lists the fatwas on the API's sitemap page N, and
 * `/sitemap/{MAX_FATWA_SITEMAPS + N}.xml` the hadith source pages on its hadith sitemap page N, and
 * `/sitemap/{MAX_FATWA_SITEMAPS + MAX_HADITH_SITEMAPS + N}.xml` the shared answers on its shares sitemap page N.
 * The ids are a fixed range so new fatwas get listed without a rebuild; robots.txt names only those in use.
 */
export async function generateSitemaps() {
  return Array.from({ length: MAX_FATWA_SITEMAPS + MAX_HADITH_SITEMAPS + MAX_SHARE_SITEMAPS + 1 }, (_, id) => ({ id }));
}

export default async function sitemap({ id }: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  // Built per request (with the data cached underneath) so new fatwas appear as they arrive.
  await connection();
  const page = Number(await id);
  if (page === 0) return staticSitemap();
  if (page > MAX_FATWA_SITEMAPS + MAX_HADITH_SITEMAPS) return shareSitemap(page - MAX_FATWA_SITEMAPS - MAX_HADITH_SITEMAPS).catch(() => []);
  if (page > MAX_FATWA_SITEMAPS) return hadithSitemap(page - MAX_FATWA_SITEMAPS).catch(() => []);
  return fatwaSitemap(page).catch(() => []);
}

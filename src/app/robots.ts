import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { MAX_FATWA_SITEMAPS, MAX_HADITH_SITEMAPS } from "@/lib/config/constants";
import { routes } from "@/lib/config/routes";
import { fatwaSitemapCount, hadithSitemapCount, shareSitemapCount } from "@/lib/data-access/sitemap";
import { absoluteUrl } from "@/lib/helpers/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  const [fatwaPages, hadithPages, sharePages] = await Promise.all([fatwaSitemapCount(), hadithSitemapCount(), shareSitemapCount()]);
  // Answer pages are AI-written and cost money to produce: crawlers stay out of them. Shared answers (/s/…) are stored
  // pages, shared with consent to be public, so they are allowed and listed in the sitemaps.
  const askPaths = [routes.ask("ar", "").split("?")[0], routes.ask("en", "").split("?")[0]];
  return {
    rules: { userAgent: "*", allow: "/", disallow: askPaths },
    sitemap: [
      ...Array.from({ length: fatwaPages + 1 }, (_, id) => absoluteUrl(`/sitemap/${id}.xml`)),
      ...Array.from({ length: hadithPages }, (_, i) => absoluteUrl(`/sitemap/${MAX_FATWA_SITEMAPS + i + 1}.xml`)),
      ...Array.from({ length: sharePages }, (_, i) => absoluteUrl(`/sitemap/${MAX_FATWA_SITEMAPS + MAX_HADITH_SITEMAPS + i + 1}.xml`)),
    ],
  };
}

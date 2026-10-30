import "server-only";
import { apiGet, orNull } from "@/lib/api/client";
import type { Paginated } from "@/types/pagination";
import type { ShareSitemapEntry, SharedAnswer } from "@/types/share";

const HOUR = 3600;

/** A shared answer, or null for an unknown id. Shares never change, so they are cached; an admin delete shows within the hour. */
export async function getShare(id: string): Promise<SharedAnswer | null> {
  if (!/^[A-Za-z0-9]{10,32}$/.test(id)) return null;
  return orNull(apiGet<SharedAnswer>(`/shares/${encodeURIComponent(id)}`, { revalidate: HOUR, tags: ["shares", `share:${id}`] }));
}

/** One page (5,000 entries) of the shared answers sitemap. */
export async function listSitemapShares(page: number): Promise<Paginated<ShareSitemapEntry>> {
  return apiGet<Paginated<ShareSitemapEntry>>("/sitemap/shares", { query: { page }, revalidate: HOUR, tags: ["sitemap"] });
}

import "server-only";
import { apiGet, orNull } from "@/lib/api/client";
import type { Glossary } from "@/types/glossary";
import type { Mufti } from "@/types/mufti";
import type { FatwaSource, SourceKey } from "@/types/source";
import type { Topic } from "@/types/topic";

const HOUR = 3600;

export async function listSources(): Promise<FatwaSource[]> {
  return apiGet<FatwaSource[]>("/sources", { revalidate: HOUR, tags: ["sources"] });
}

/** Source names label lists and badges; a failed lookup only drops the label. */
export async function getSource(key: SourceKey): Promise<FatwaSource | null> {
  const sources = await listSources().catch(() => []);
  return sources.find((s) => s.key === key) ?? null;
}

export async function getMufti(key: string): Promise<Mufti | null> {
  return orNull(apiGet<Mufti>(`/muftis/${encodeURIComponent(key)}`, { revalidate: HOUR, tags: [`mufti:${key}`] }));
}

/** The shared topic tree, each node with its fatwa count (including descendants). */
export async function listTopics(): Promise<Topic[]> {
  return apiGet<Topic[]>("/topics", { revalidate: HOUR, tags: ["topics"] });
}

/** A topic anywhere in the tree, with its parent. */
export async function findTopic(key: string): Promise<{ topic: Topic; parent: Topic | null } | null> {
  const search = (nodes: Topic[], parent: Topic | null): { topic: Topic; parent: Topic | null } | null => {
    for (const node of nodes) {
      if (node.key === key) return { topic: node, parent };
      const found = search(node.children, node);
      if (found) return found;
    }
    return null;
  };
  return search(await listTopics(), null);
}

/** The whole hadith-grading reference: intro plus every term. */
export async function getGlossary(): Promise<Glossary> {
  return apiGet<Glossary>("/glossary", { revalidate: HOUR * 24, tags: ["glossary"] });
}

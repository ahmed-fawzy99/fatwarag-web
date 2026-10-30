import "server-only";
import { listTopics } from "@/lib/data-access/catalog";
import type { Topic } from "@/types/topic";

/** A topic's path from the top of the tree down to it (e.g. فقه الأسرة › الطلاق); null when the key is unknown or the tree can't load. */
export async function findTopicPath(key: string): Promise<Topic[] | null> {
  if (!key) return null;
  const search = (nodes: Topic[], path: Topic[]): Topic[] | null => {
    for (const node of nodes) {
      const here = [...path, node];
      if (node.key === key) return here;
      const found = search(node.children, here);
      if (found) return found;
    }
    return null;
  };
  const tree = await listTopics().catch(() => null);
  return tree ? search(tree, []) : null;
}

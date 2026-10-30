import type { Evidence, Summary } from "@/types/answer";

/** Keys whose text a reader sees, in the order they appear in a summary. */
const TEXT_KEYS = new Set(["headline", "label", "title", "body", "text"]);
/** Keys that hold ids or flags, never reader-facing text. */
const SKIPPED_KEYS = new Set(["citations", "evidence", "extraFatwaIds", "kind", "heldBy"]);

/**
 * A stored summary as plain lines, in reading order: the headline, then each point's title and body (and, for a
 * question in parts, each part's label and headline). Walks the shape generically so a stored summary of any version
 * reads correctly.
 */
export function summaryLines(summary: Summary): string[] {
  const lines: string[] = [];
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (SKIPPED_KEYS.has(key)) continue;
      if (TEXT_KEYS.has(key) && typeof child === "string" && child.trim()) lines.push(child.trim());
      else walk(child);
    }
  };
  walk(summary);
  return lines;
}

/** Every evidence list in a stored summary (each rendered once, keyed like the live answer page). */
export function summaryEvidenceLists(summary: Summary): Evidence[][] {
  const lists: Evidence[][] = [];
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (key === "evidence" && Array.isArray(child)) {
        if (child.length > 0) lists.push(child as Evidence[]);
      } else if (key !== "citations") walk(child);
    }
  };
  walk(summary);
  return lists;
}

/** A stored summary with the defaults the summary card expects (older stored shapes may lack them). */
export function normalizeSummary(raw: Summary): Summary {
  return { ...raw, views: raw.views ?? [], preferences: raw.preferences ?? [], extraFatwaIds: raw.extraFatwaIds ?? [] };
}

/** A title-length cut at a word boundary (og:title and <title>). */
export function truncateTitle(text: string, max = 70): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${space > max / 2 ? cut.slice(0, space) : cut}…`;
}

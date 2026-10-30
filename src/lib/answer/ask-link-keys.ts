/**
 * The keys that seal ask links, from `ASK_LINK_KEY`: comma-separated "<id>:<32 bytes, base64url>" entries, the first
 * being the one new links are sealed with and the rest older keys still accepted (rotation). Errors never include
 * the key material. Pure (no `server-only`), so next.config can check the key at start-up.
 */
export type AskLinkKey = { id: string; key: Uint8Array };

const KEY_ID = /^[A-Za-z0-9]{1,8}$/;
const KEY_BYTES = 32;

export function parseAskLinkKeys(raw: string | undefined): AskLinkKey[] {
  if (!raw?.trim()) throw new Error("ASK_LINK_KEY is not set. Run `node scripts/generate-ask-link-key.mjs` (dev) or set it in the environment.");
  const keys = raw.split(",").map((entry, index) => {
    const [id, encoded, ...rest] = entry.trim().split(":");
    const key = encoded ? Buffer.from(encoded, "base64url") : Buffer.alloc(0);
    if (!id || !KEY_ID.test(id) || rest.length > 0 || key.length !== KEY_BYTES) {
      throw new Error(`ASK_LINK_KEY entry ${index + 1} is malformed: expected "<id>:<32 bytes as base64url>".`);
    }
    return { id, key: new Uint8Array(key) };
  });
  if (new Set(keys.map((k) => k.id)).size !== keys.length) throw new Error("ASK_LINK_KEY has two entries with the same id.");
  return keys;
}

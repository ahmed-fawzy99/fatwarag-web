import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
// Relative with its extension so `node --test` can load this file too.
import { parseAskLinkKeys, type AskLinkKey } from "./ask-link-keys.ts";

/** What an ask link carries: the question and, for a follow-up, the follow-up asked after it. */
export type AskLinkPayload = { question: string; followUp: string | null };

type SealedPayload = { v: 1; q: string; f?: string };

const IV_BYTES = 12;
const TAG_BYTES = 16;
const MAX_TEXT = 4000;

let cached: { raw: string | undefined; keys: AskLinkKey[] } | null = null;

/** The configured keys, parsed once per value. Throws when the key is missing or malformed: never a plain-text fallback. */
function configuredKeys(): AskLinkKey[] {
  const raw = process.env.ASK_LINK_KEY;
  if (!cached || cached.raw !== raw) cached = { raw, keys: parseAskLinkKeys(raw) };
  return cached.keys;
}

/** The key id is bound into the ciphertext, so a token can't be re-labelled to another key. */
function aad(id: string): Uint8Array {
  return new TextEncoder().encode(`ask-link:${id}`);
}

/**
 * Seals a question (and follow-up) into an opaque `t` token: "<keyId>.<base64url(iv | ciphertext | tag)>", AES-256-GCM
 * with a random 12-byte IV, always with the current (first) key.
 */
export function sealAskLink({ question, followUp }: AskLinkPayload, keys: AskLinkKey[] = configuredKeys()): string {
  const [{ id, key }] = keys;
  const payload: SealedPayload = { v: 1, q: question, ...(followUp ? { f: followUp } : {}) };
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(aad(id));
  const body = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return `${id}.${Buffer.concat([iv, body, cipher.getAuthTag()]).toString("base64url")}`;
}

/** Opens a `t` token with whichever configured key it names. Null for anything unknown, tampered or malformed. */
export function unsealAskLink(token: string, keys: AskLinkKey[] = configuredKeys()): AskLinkPayload | null {
  const match = /^([A-Za-z0-9]{1,8})\.([A-Za-z0-9_-]+)$/.exec(token);
  const entry = match && keys.find((candidate) => candidate.id === match[1]);
  if (!match || !entry) return null;
  try {
    const bytes = Buffer.from(match[2], "base64url");
    if (bytes.length <= IV_BYTES + TAG_BYTES) return null;
    const decipher = createDecipheriv("aes-256-gcm", entry.key, bytes.subarray(0, IV_BYTES));
    decipher.setAAD(aad(entry.id));
    decipher.setAuthTag(bytes.subarray(bytes.length - TAG_BYTES));
    const text = Buffer.concat([decipher.update(bytes.subarray(IV_BYTES, bytes.length - TAG_BYTES)), decipher.final()]).toString("utf8");
    const payload = JSON.parse(text) as Partial<SealedPayload>;
    if (payload.v !== 1 || typeof payload.q !== "string") return null;
    const question = payload.q.trim();
    const followUp = typeof payload.f === "string" && payload.f.trim() ? payload.f.trim() : null;
    if (!question || question.length > MAX_TEXT || (followUp?.length ?? 0) > MAX_TEXT) return null;
    return { question, followUp };
  } catch {
    return null;
  }
}

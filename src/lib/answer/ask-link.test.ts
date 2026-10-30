// Run with `pnpm test` (node's built-in runner; "react-server" makes `server-only` importable outside Next).
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";
import { sealAskLink, unsealAskLink } from "./ask-link.ts";
import { parseAskLinkKeys } from "./ask-link-keys.ts";

const entry = (id: string) => `${id}:${randomBytes(32).toString("base64url")}`;
const k1 = entry("k1");
const k2 = entry("k2");

describe("ask links", () => {
  const keys = parseAskLinkKeys(k1);

  it("round-trips a question and a follow-up", () => {
    const question = "ما حكم زكاة الحلي الملبوس؟";
    assert.deepEqual(unsealAskLink(sealAskLink({ question, followUp: null }, keys), keys), { question, followUp: null });
    assert.deepEqual(unsealAskLink(sealAskLink({ question, followUp: "وماذا لو كنت مسافرًا؟" }, keys), keys), {
      question,
      followUp: "وماذا لو كنت مسافرًا؟",
    });
  });

  it("never shows the question and uses a fresh IV each time", () => {
    const first = sealAskLink({ question: "wudu question", followUp: null }, keys);
    const second = sealAskLink({ question: "wudu question", followUp: null }, keys);
    assert.notEqual(first, second);
    assert.ok(!first.includes("wudu"));
    assert.match(first, /^k1\.[A-Za-z0-9_-]+$/);
  });

  it("rejects tampered, truncated, foreign and malformed tokens", () => {
    const token = sealAskLink({ question: "a question", followUp: null }, keys);
    const body = token.slice(3);
    const flipped = `k1.${body.slice(0, 10)}${body[10] === "A" ? "B" : "A"}${body.slice(11)}`;
    assert.equal(unsealAskLink(flipped, keys), null);
    assert.equal(unsealAskLink(token.slice(0, -4), keys), null);
    assert.equal(unsealAskLink(token, parseAskLinkKeys(entry("k1"))), null);
    assert.equal(unsealAskLink(`k2.${body}`, parseAskLinkKeys(`${k2},${k1}`)), null);
    for (const junk of ["", "k1.", "nope", "k1.***", "k9.AAAA"]) assert.equal(unsealAskLink(junk, keys), null);
  });

  it("seals with the current key and still opens links sealed with an older one", () => {
    const old = sealAskLink({ question: "old link", followUp: null }, parseAskLinkKeys(k1));
    const rotated = parseAskLinkKeys(`${k2},${k1}`);
    assert.deepEqual(unsealAskLink(old, rotated), { question: "old link", followUp: null });
    assert.match(sealAskLink({ question: "new link", followUp: null }, rotated), /^k2\./);
  });

  it("refuses a missing or malformed key without echoing it", () => {
    assert.throws(() => parseAskLinkKeys(undefined), /not set/);
    assert.throws(() => parseAskLinkKeys("k1:short"), (error: Error) => !error.message.includes("short"));
    assert.throws(() => parseAskLinkKeys(`${k1},${k1}`), /same id/);
  });
});

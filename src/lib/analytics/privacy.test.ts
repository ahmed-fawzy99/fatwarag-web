// Run with `pnpm test` (node's built-in runner).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { maskEventProperties, maskUrl, scrubProps } from "./privacy.ts";

describe("maskUrl", () => {
  it("strips the sealed token from ask pages in both languages", () => {
    assert.equal(maskUrl("https://fatwarag.com/ask?t=SEALED"), "https://fatwarag.com/ask");
    assert.equal(maskUrl("https://fatwarag.com/en/ask?t=SEALED#fatwas-heading"), "https://fatwarag.com/en/ask");
    assert.equal(maskUrl("/ask?t=SEALED&x=1"), "/ask");
    assert.equal(maskUrl("/en/ask/?q=question"), "/en/ask/");
  });

  it("drops text-carrying parameters elsewhere but keeps the rest", () => {
    assert.equal(maskUrl("/quran/2?ayah=255&q=some+quote&from=abc"), "/quran/2?ayah=255&from=abc");
    assert.equal(maskUrl("/topics/prayer?page=2"), "/topics/prayer?page=2");
  });

  it("leaves non-URLs alone", () => {
    assert.equal(maskUrl("$direct"), "$direct");
    assert.equal(maskUrl("fatwarag.com"), "fatwarag.com");
  });
});

describe("maskEventProperties", () => {
  it("masks every URL-like property PostHog adds", () => {
    const masked = maskEventProperties({
      $current_url: "https://fatwarag.com/ask?t=SEALED",
      $pathname: "/ask?t=SEALED",
      $referrer: "https://fatwarag.com/en/ask?t=SEALED",
      $prev_pageview_pathname: "/ask?t=SEALED",
      $browser: "Firefox",
    });
    assert.equal(masked.$current_url, "https://fatwarag.com/ask");
    assert.equal(masked.$pathname, "/ask");
    assert.equal(masked.$referrer, "https://fatwarag.com/en/ask");
    assert.equal(masked.$prev_pageview_pathname, "/ask");
    assert.equal(masked.$browser, "Firefox");
  });

  it("masks URLs nested anywhere, whatever the key", () => {
    const masked = maskEventProperties({
      $set_once: { $initial_current_url: "https://fatwarag.com/ask?t=SEALED", $initial_pathname: "/ask?t=SEALED" },
      $elements: [{ attr__href: "/ask?t=SEALED&q=text" }],
      landing: "/topics/x?q=text&page=2",
    });
    assert.deepEqual(masked.$set_once, { $initial_current_url: "https://fatwarag.com/ask", $initial_pathname: "/ask" });
    assert.deepEqual(masked.$elements, [{ attr__href: "/ask" }]);
    assert.equal(masked.landing, "/topics/x?page=2");
  });
});

describe("scrubProps", () => {
  it("keeps numbers, booleans and short strings", () => {
    assert.deepEqual(scrubProps({ locale: "ar", length: 42, none_found: false }), { locale: "ar", length: 42, none_found: false });
  });

  it("drops free text under any sensitive name, and long strings", () => {
    const clean = scrubProps({ question: "ما حكم؟", comment: "x", message: "y", email: "a@b.c", name: "n", followUp: "z", locale: "en", note: "x".repeat(200), nested: { a: 1 } });
    assert.deepEqual(clean, { locale: "en" });
  });
});

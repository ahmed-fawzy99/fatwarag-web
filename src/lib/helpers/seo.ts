import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import type { RichParagraph } from "@/types/content";

/** The public site address, without a trailing slash. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path}`;
}

/**
 * Canonical address plus links between the page's Arabic and English versions.
 * `path` is the locale-free path, e.g. `/fatwas/islamqa-123`.
 */
export function pageAlternates(locale: Locale, path: string, languages: readonly Locale[] = LOCALES): Metadata["alternates"] {
  return {
    canonical: routes.switchLocale(locale, path),
    languages: {
      ...Object.fromEntries(languages.map((lang) => [lang, routes.switchLocale(lang, path)])),
      "x-default": routes.switchLocale(DEFAULT_LOCALE, path),
    },
  };
}

/** Stored rich text as plain text, e.g. for descriptions and structured data. */
export function plainText(paragraphs: RichParagraph[]): string {
  return paragraphs
    .map((paragraph) => paragraph.map((segment) => segment.text).join(""))
    .join("\n")
    .trim();
}

/** A meta description: the first words of a text, cut at a word boundary. */
export function excerpt(text: string, max = 160): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max / 2 ? cut.lastIndexOf(" ") : max)}…`;
}

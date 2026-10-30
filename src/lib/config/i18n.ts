export const LOCALES = ["ar", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";

export const LOCALE_META: Record<Locale, { label: string; dir: "rtl" | "ltr" }> = {
  ar: { label: "العربية", dir: "rtl" },
  en: { label: "English", dir: "ltr" },
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

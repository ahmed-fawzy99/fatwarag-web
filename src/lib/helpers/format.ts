import dayjs from "dayjs";
import type { Locale } from "@/lib/config/i18n";
import type { HijriDate } from "@/types/fatwa";

const NUMBER_LOCALE: Record<Locale, string> = { ar: "ar-EG", en: "en-US" };

/** Arabic-Indic digits in Arabic, Western digits in English. */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[locale], { useGrouping: false }).format(value);
}

/** Digits inside a string (e.g. a stored date or fatwa number) converted for the locale. */
export function localizeDigits(text: string, locale: Locale): string {
  if (locale !== "ar") return text;
  return text.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

/** A Gregorian ISO date (YYYY-MM-DD) shown in the reader's language. */
export function formatGregorianDate(iso: string, locale: Locale): string {
  const date = dayjs(iso);
  if (!date.isValid()) return iso;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(
    date.toDate(),
  );
}

const HIJRI_MONTHS: Record<Locale, string[]> = {
  ar: ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"],
  en: ["Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Akhir", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qa'dah", "Dhu al-Hijjah"],
};

/** A Hijri date in the reader's language: «١٥ صفر ١٤٣٨ هـ» / "15 Safar 1438 AH". */
export function formatHijriDate(date: HijriDate, locale: Locale): string {
  const month = HIJRI_MONTHS[locale][date.month - 1];
  const suffix = locale === "ar" ? "هـ" : "AH";
  return `${formatNumber(date.day, locale)} ${month} ${formatNumber(date.year, locale)} ${suffix}`;
}

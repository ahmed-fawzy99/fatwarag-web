import "server-only";
import { apiGet, orNull } from "@/lib/api/client";
import { HADITH_LIBRARY } from "@/lib/config/constants";
import type { Locale } from "@/lib/config/i18n";
import type { HadithKey } from "@/types/content";
import type { Hadith, HadithCollection, Surah, TafsirEntry } from "@/types/foundations";

const HOUR = 3600;

export async function getSurah(number: number): Promise<Surah | null> {
  return orNull(apiGet<Surah>(`/quran/surahs/${number}`, { revalidate: HOUR * 24 * 7, tags: [`surah:${number}`] }));
}

/** Name and verse text for a single verse (used inside summaries and fatwas). */
export async function getAyah(surah: number, ayah: number) {
  const found = await getSurah(surah).catch(() => null);
  const verse = found?.ayat.find((a) => a.ayah === ayah);
  if (!found || !verse) return null;
  return { surah: found.number, nameAr: found.nameAr, nameEn: found.nameEn, ...verse };
}

/** Some tafsir passages carry the edition's colour markup; only the text is shown. */
function stripMarkup(text: string | null): string | null {
  return text === null ? null : text.replace(/<[^>]+>/g, "");
}

/** The passage of each tafsir covering a verse. */
export async function getTafsir(surah: number, ayah: number): Promise<TafsirEntry | null> {
  const entry = await orNull(apiGet<TafsirEntry>(`/quran/tafsir/${surah}/${ayah}`, { revalidate: HOUR * 24 * 7, tags: [`surah:${surah}`] }));
  if (!entry) return null;
  return {
    ...entry,
    texts: {
      muyassar: stripMarkup(entry.texts.muyassar),
      ibnKathir: stripMarkup(entry.texts.ibnKathir),
      saadi: stripMarkup(entry.texts.saadi),
    },
  };
}

/** Hadiths come from Dorar's encyclopedia, the only collection we hold. */
export async function getCollection(key: string): Promise<HadithCollection | null> {
  return key === HADITH_LIBRARY.key ? HADITH_LIBRARY : null;
}

export async function getHadith(ref: HadithKey, locale: Locale): Promise<Hadith | null> {
  if (ref.collection !== HADITH_LIBRARY.key) return null;
  return orNull(apiGet<Hadith>(`/hadiths/${ref.number}`, { locale, revalidate: HOUR, tags: [`hadith:${ref.number}`] }));
}

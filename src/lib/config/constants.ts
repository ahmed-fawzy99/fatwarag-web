/** Questions shorter than this are rejected before searching. */
export const MIN_QUESTION_LENGTH = 8;

export const MAX_QUESTION_LENGTH = 500;

export const REPORT_REASONS = ["misrepresents", "irrelevant", "wrongLink", "translation", "other"] as const;

export const MAX_REPORT_COMMENT_LENGTH = 1000;

export const TAFSIR_KEYS = ["muyassar", "ibnKathir", "saadi"] as const;

export const DEFAULT_TAFSIR = "muyassar" as const;

export const MIN_CONTACT_MESSAGE_LENGTH = 10;

export const MAX_CONTACT_MESSAGE_LENGTH = 3000;

/** Dorar's hadith encyclopedia: hadith refs and source pages use `collection = "dorar"` and our hadith id. */
export const HADITH_LIBRARY = { key: "dorar", nameAr: "الموسوعة الحديثية · الدرر السنية", nameEn: "Dorar Hadith Encyclopedia" } as const;

/** Fatwa sitemaps the site can serve (5,000 fatwas each, from the API's sitemap pages); robots.txt lists the ones in use. */
export const MAX_FATWA_SITEMAPS = 100;

/** Hadith sitemaps (5,000 hadiths each) follow the fatwa ones: `/sitemap/{MAX_FATWA_SITEMAPS + N}.xml`. */
export const MAX_HADITH_SITEMAPS = 20;

/** Shared answer sitemaps (5,000 each) follow the hadith ones: `/sitemap/{MAX_FATWA_SITEMAPS + MAX_HADITH_SITEMAPS + N}.xml`. */
export const MAX_SHARE_SITEMAPS = 20;

/** Verse audio is streamed straight from QuranicAudio, Quran.com's audio host (never stored or proxied by us): `{base}/{SSS}{AAA}.mp3`. Reciter: Mahmoud Khalil Al-Husary. */
export const VERSE_AUDIO = {
  baseUrl: "https://mirrors.quranicaudio.com/everyayah/Husary_128kbps",
  reciterAr: "محمود خليل الحصري",
  reciterEn: "Mahmoud Khalil Al-Husary",
} as const;

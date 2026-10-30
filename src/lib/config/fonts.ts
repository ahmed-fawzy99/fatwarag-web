import localFont from "next/font/local";
import { Noto_Naskh_Arabic, Readex_Pro, Source_Serif_4 } from "next/font/google";

/** Interface font (Arabic + Latin). */
export const uiFont = Readex_Pro({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
  display: "swap",
});

/** Reading font for summaries, fatwas and hadith. */
export const readingFont = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-reading-face",
  display: "swap",
});

/** Latin reading font; Arabic characters fall through to Noto Naskh. */
export const readingLatinFont = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-reading-latin",
  display: "swap",
});

/** King Fahd Complex Uthmanic Hafs — pairs with the KFGQPC Quran text. */
export const quranFont = localFont({
  src: "../../assets/fonts/UthmanicHafs.woff2",
  variable: "--font-quran-face",
  display: "swap",
});

import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { absoluteUrl, plainText } from "@/lib/helpers/seo";
import type { Fatwa, FatwaText } from "@/types/fatwa";
import type { Mufti } from "@/types/mufti";

type FatwaStructuredDataProps = {
  locale: Locale;
  fatwa: Fatwa;
  text: FatwaText;
  mufti: Mufti | null;
};

/** schema.org QAPage: the fatwa as a question and its answer, attributed to the mufti or institution. */
export function FatwaStructuredData({ locale, fatwa, text, mufti }: FatwaStructuredDataProps) {
  const url = absoluteUrl(routes.fatwa(locale, fatwa.id));
  const author = mufti
    ? { "@type": mufti.kind === "institution" ? "Organization" : "Person", name: locale === "ar" ? mufti.nameAr : mufti.nameEn }
    : undefined;
  const data = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    inLanguage: locale,
    mainEntity: {
      "@type": "Question",
      name: text.title,
      text: plainText(text.question) || text.title,
      answerCount: 1,
      ...(fatwa.dateGregorian ? { dateCreated: fatwa.dateGregorian } : {}),
      acceptedAnswer: {
        "@type": "Answer",
        text: plainText(text.answer),
        url,
        ...(author ? { author } : {}),
        ...(fatwa.dateGregorian ? { dateCreated: fatwa.dateGregorian } : {}),
      },
    },
  };
  // Escape "<" so stored text can never close the script element.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

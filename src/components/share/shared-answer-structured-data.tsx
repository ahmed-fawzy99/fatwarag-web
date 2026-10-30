import { routes } from "@/lib/config/routes";
import { summaryLines } from "@/lib/helpers/shared-answer";
import { absoluteUrl } from "@/lib/helpers/seo";
import type { SharedAnswer } from "@/types/share";

/**
 * schema.org QAPage for a shared answer: the question, and as its accepted answer the summary (headline and points
 * as plain text), or the titles of the listed fatwas when it has no summary.
 */
export function SharedAnswerStructuredData({ share, fatwaTitles }: { share: SharedAnswer; fatwaTitles: string[] }) {
  const url = absoluteUrl(routes.share(share.locale, share.id));
  const answer = (share.summary ? summaryLines(share.summary) : fatwaTitles).join("\n");
  if (!answer) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    inLanguage: share.locale,
    mainEntity: {
      "@type": "Question",
      name: share.question,
      text: share.question,
      answerCount: 1,
      ...(share.createdAt ? { dateCreated: share.createdAt } : {}),
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
        url,
        ...(share.createdAt ? { dateCreated: share.createdAt } : {}),
      },
    },
  };
  // Escape "<" so stored text can never close the script element.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

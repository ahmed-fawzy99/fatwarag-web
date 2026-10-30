import { TrackedAnchor } from "@/components/analytics/tracked-anchor";
import { EVENTS } from "@/lib/analytics/events";
import { NotFoundReference } from "@/components/evidence/not-found-reference";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { dorarSearchUrl } from "@/lib/helpers/dorar";
import type { RichParagraph, Segment } from "@/types/content";

type RichTextProps = {
  locale: Locale;
  paragraphs: RichParagraph[];
  notFoundNote: string;
  /** Label of the search offered for a hadith we don't have. */
  searchLabel: string;
  openSourceLabel: string;
  /** The fatwa this text belongs to; its quote links carry it so a report from the source page can name it. */
  fatwaId?: string;
};

function SegmentView({ segment, locale, notFoundNote, searchLabel, openSourceLabel, fatwaId }: { segment: Segment } & Omit<RichTextProps, "paragraphs">) {
  switch (segment.type) {
    case "text":
      return <>{segment.text}</>;
    case "quran":
      return (
        <TrackedAnchor
          event={{ name: EVENTS.evidenceClicked, props: { locale, kind: "quran", surface: "fatwa_text", ref: `${segment.surah}:${segment.ayah}` } }}
          href={routes.quran(locale, segment.surah, segment.ayah, { quote: segment.text, fromFatwaId: fatwaId })}
          target="_blank"
          rel="noopener"
          className="quote-link"
          title={openSourceLabel}
        >
          {segment.text}
        </TrackedAnchor>
      );
    case "hadith":
      if (!segment.ref) {
        return <NotFoundReference locale={locale} text={segment.text} note={notFoundNote} search={{ href: dorarSearchUrl(segment.text), label: searchLabel }} />;
      }
      return (
        <TrackedAnchor
          event={{ name: EVENTS.evidenceClicked, props: { locale, kind: "hadith", surface: "fatwa_text", ref: `${segment.ref.collection}/${segment.ref.number}` } }}
          href={routes.hadith(locale, segment.ref.collection, segment.ref.number, { quote: segment.text, fromFatwaId: fatwaId })}
          target="_blank"
          rel="noopener"
          className="quote-link"
          title={openSourceLabel}
        >
          {segment.text}
        </TrackedAnchor>
      );
    case "fatwaRef":
      return (
        <TrackedAnchor
          event={{ name: EVENTS.evidenceClicked, props: { locale, kind: "fatwa", surface: "fatwa_text", ref: segment.fatwaId } }}
          href={routes.fatwa(locale, segment.fatwaId)}
          target="_blank"
          rel="noopener"
          className="quote-link"
        >
          {segment.text}
        </TrackedAnchor>
      );
    case "scholar":
      // Display only in V1: styled as a citation, not linked to a book.
      return (
        <span className="rounded bg-sunken px-1 text-ink-soft" title={[segment.scholar, segment.book].filter(Boolean).join(" · ")}>
          {segment.text}
        </span>
      );
  }
}

/** Stored source text, with quotes linked to the Foundations at collection time. */
export function RichText({ paragraphs, ...rest }: RichTextProps) {
  return (
    <div className="text-reading flex flex-col gap-3">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>
          {paragraph.map((segment, i) => (
            <SegmentView key={i} segment={segment} {...rest} />
          ))}
        </p>
      ))}
    </div>
  );
}

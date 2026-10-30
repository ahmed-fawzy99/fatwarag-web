import type { Locale } from "@/lib/config/i18n";
import { listFatwaRelated, listRelatedFatwas } from "@/lib/data-access/fatwas";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { FatwaList } from "./fatwa-list";

type RelatedFatwasProps = {
  locale: Locale;
  dict: Dictionary;
} & (
  /** A single fatwa page: the API's related list for that fatwa. */
  | { fatwaId: string }
  /** The answer page: fatwas on the top result's topics, excluding the ones already listed. */
  | { topicKeys: string[]; excludeIds: string[] }
);

/** More reading at the end of a page: library fatwas on the same topic. Not AI-picked. */
export async function RelatedFatwas(props: RelatedFatwasProps) {
  const { locale, dict } = props;
  const items = "fatwaId" in props ? await listFatwaRelated(props.fatwaId, locale) : await listRelatedFatwas(props.topicKeys, props.excludeIds, locale);
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="related-heading" className="mt-4 flex flex-col gap-3 border-t pt-8">
      <div className="flex flex-col gap-0.5">
        <h2 id="related-heading" className="text-lg font-semibold">
          {dict.related.title}
        </h2>
        <p className="text-sm text-muted-foreground">{dict.related.subtitle}</p>
      </div>
      <FatwaList locale={locale} items={items} emptyText="" translatedLabel={dict.fatwa.translated} />
    </section>
  );
}

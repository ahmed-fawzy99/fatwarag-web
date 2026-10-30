import { LanguagesIcon } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { listSources } from "@/lib/data-access/catalog";
import { formatGregorianDate } from "@/lib/helpers/format";
import type { FatwaListItem } from "@/types/fatwa";

type FatwaListProps = {
  locale: Locale;
  items: FatwaListItem[];
  emptyText: string;
  translatedLabel: string;
};

/** A plain list of fatwas (title, source, date) linking to each fatwa page. */
export async function FatwaList({ locale, items, emptyText, translatedLabel }: FatwaListProps) {
  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed px-4 py-6 text-center text-muted-foreground">{emptyText}</p>;
  }
  const sources = await listSources().catch(() => []);

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const source = sources.find((s) => s.key === item.sourceKey);
        return (
          <li key={item.id}>
            <Link
              href={routes.fatwa(locale, item.id)}
              className="flex flex-col gap-1 rounded-xl border bg-card px-4 py-3 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:gap-3"
            >
              <span className="min-w-0 flex-1 font-semibold">
                {item.title}
                {item.titleTranslated && <LanguagesIcon className="ms-1.5 inline size-3.5 text-muted-foreground" aria-label={translatedLabel} />}
              </span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-sunken px-2.5 py-0.5 text-ink-soft">{locale === "ar" ? source?.nameAr : source?.nameEn}</span>
                {item.dateGregorian && <span>{formatGregorianDate(item.dateGregorian, locale)}</span>}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

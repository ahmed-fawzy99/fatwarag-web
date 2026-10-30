import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { LOCALE_META, type Locale } from "@/lib/config/i18n";
import { formatNumber } from "@/lib/helpers/format";
import { format } from "@/lib/i18n/format";

type PagerProps = {
  locale: Locale;
  page: number;
  lastPage: number;
  href: (page: number) => string;
  strings: { previous: string; next: string; pageOf: string };
};

/** Previous / next links for a paginated list; hidden when everything fits on one page. */
export function Pager({ locale, page, lastPage, href, strings }: PagerProps) {
  if (lastPage <= 1) return null;
  const rtl = LOCALE_META[locale].dir === "rtl";
  const PrevIcon = rtl ? ChevronRightIcon : ChevronLeftIcon;
  const NextIcon = rtl ? ChevronLeftIcon : ChevronRightIcon;
  const linkClass = buttonVariants({ variant: "outline", size: "sm" });

  return (
    <nav className="mt-2 flex items-center justify-between gap-3 text-sm" aria-label={format(strings.pageOf, { page, total: lastPage })}>
      {page > 1 ? (
        <Link href={href(page - 1)} className={linkClass}>
          <PrevIcon /> {strings.previous}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted-foreground">
        {format(strings.pageOf, { page: formatNumber(page, locale), total: formatNumber(lastPage, locale) })}
      </span>
      {page < lastPage ? (
        <Link href={href(page + 1)} className={linkClass}>
          {strings.next} <NextIcon />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

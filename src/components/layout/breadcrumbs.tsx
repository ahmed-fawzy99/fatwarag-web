import Link from "next/link";
import { LOCALE_META, type Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { absoluteUrl } from "@/lib/helpers/seo";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Crumb } from "@/types/breadcrumb";
import { BackControl } from "./back-control";

type BreadcrumbsProps = {
  locale: Locale;
  strings: Dictionary["nav"];
  /** The trail after «الرئيسية», ending with the current page (its `href` only feeds the structured data). */
  items: Crumb[];
  /** Where back goes when history leaves the site; defaults to the nearest linked parent crumb. */
  backHref?: string;
  /** schema.org BreadcrumbList for indexable pages. */
  structuredData?: boolean;
};

/**
 * Back control plus the trail «الرئيسية › … › current page» at the top of an inner page.
 * On phones only the back control and the current page show.
 */
export function Breadcrumbs({ locale, strings, items, backHref, structuredData = false }: BreadcrumbsProps) {
  const trail: Crumb[] = [{ label: strings.home, href: routes.home(locale) }, ...items];
  const current = trail.at(-1)!;
  const parents = trail.slice(0, -1);
  const fallback = backHref ?? parents.findLast((crumb) => crumb.href)?.href ?? routes.home(locale);

  return (
    <>
      {structuredData && <BreadcrumbStructuredData trail={trail} />}
      <nav aria-label={strings.breadcrumb} className="-mb-2 flex scroll-mt-pinned min-w-0 items-center gap-2.5 text-sm text-muted-foreground">
        <BackControl fallbackHref={fallback} label={strings.back} dir={LOCALE_META[locale].dir} />
        <ol className="flex min-w-0 items-center gap-x-1.5 sm:flex-wrap">
          {parents.map((crumb, index) => (
            <li key={index} className="hidden shrink-0 items-center gap-1.5 sm:flex">
              {index > 0 && <Separator />}
              {crumb.href ? (
                <Link href={crumb.href} className="transition-colors hover:text-accent-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </li>
          ))}
          <li className="flex min-w-0 items-center gap-1.5">
            {parents.length > 0 && <Separator className="hidden sm:inline" />}
            <span aria-current="page" className="truncate text-ink-soft">
              {current.label}
            </span>
          </li>
        </ol>
      </nav>
    </>
  );
}

/** «›» is a mirrored character, so it points along the reading direction in Arabic too. */
function Separator({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={className}>
      ›
    </span>
  );
}

/** Only crumbs with a page are listed (Google requires a URL for every step but the last). */
function BreadcrumbStructuredData({ trail }: { trail: Crumb[] }) {
  const linked = trail.filter((crumb, index) => crumb.href || index === trail.length - 1);
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: linked.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      ...(crumb.href ? { item: absoluteUrl(crumb.href) } : {}),
    })),
  };
  // Escape "<" so labels can never close the script element.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

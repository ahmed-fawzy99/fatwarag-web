import Link from "next/link";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { BrandName } from "./brand-name";

type SiteFooterProps = {
  locale: Locale;
  dict: Dictionary["footer"];
};

export function SiteFooter({ locale, dict }: SiteFooterProps) {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-[860px] flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-muted-foreground">
        <BrandName locale={locale} />
        <nav className="flex gap-4">
          <Link href={routes.topics(locale)} className="hover:text-accent-foreground">
            {dict.topics}
          </Link>
          <Link href={routes.contact(locale)} className="hover:text-accent-foreground">
            {dict.contact}
          </Link>
          <Link href={routes.privacy(locale)} className="hover:text-accent-foreground">
            {dict.privacy}
          </Link>
        </nav>
      </div>
    </footer>
  );
}

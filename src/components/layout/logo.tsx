import Link from "next/link";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { BrandName } from "./brand-name";

export function Logo({ locale, name }: { locale: Locale; name: string }) {
  return (
    <Link href={routes.home(locale)} className="flex items-center gap-2.5 text-foreground" aria-label={name}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-[18px] stroke-primary-foreground" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5A1.5 1.5 0 0 1 4 17.5z" />
          <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5-.7 1.5-1.5z" />
          <circle cx="16.5" cy="16.5" r="2.2" className="fill-saffron" stroke="none" />
        </svg>
      </span>
      <BrandName locale={locale} className="text-lg font-semibold" />
    </Link>
  );
}

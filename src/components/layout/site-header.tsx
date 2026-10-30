import Link from "next/link";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { LanguageMenu } from "./language-menu";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

type SiteHeaderProps = {
  locale: Locale;
  dict: Dictionary["header"];
  brand: string;
};

export function SiteHeader({ locale, dict, brand }: SiteHeaderProps) {
  return (
    <header className="border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[860px] items-center gap-3 px-4 py-2.5">
        <Logo locale={locale} name={brand} />
        <nav className="ms-auto flex items-center gap-1.5">
          <Link
            href={routes.topics(locale)}
            className="hidden rounded-md px-2 py-1 text-sm text-ink-soft transition-colors hover:text-accent-foreground sm:inline"
          >
            {dict.topics}
          </Link>
          <LanguageMenu locale={locale} label={dict.language} />
          <ThemeToggle darkLabel={dict.darkMode} lightLabel={dict.lightMode} />
        </nav>
      </div>
    </header>
  );
}

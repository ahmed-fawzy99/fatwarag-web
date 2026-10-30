"use client";

import { CheckIcon, ChevronDownIcon, GlobeIcon } from "lucide-react";
import { track } from "@/lib/analytics/client";
import { EVENTS } from "@/lib/analytics/events";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_LOCALE, LOCALES, LOCALE_META, type Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";

type LanguageMenuProps = {
  locale: Locale;
  label: string;
};

/** Strip a non-default locale prefix from a visible pathname. */
function pathWithoutLocale(pathname: string): string {
  const first = pathname.split("/")[1];
  if (first && first !== DEFAULT_LOCALE && (LOCALES as readonly string[]).includes(first)) {
    return pathname.slice(first.length + 1) || "/";
  }
  return pathname;
}

export function LanguageMenu({ locale, label }: LanguageMenuProps) {
  /** A full page load, not a client navigation: the document's lang and dir change, and the theme script must run fresh. */
  function switchTo(target: Locale) {
    if (target === locale) return;
    track(EVENTS.languageSwitched, { from: locale, to: target });
    const { pathname, search } = window.location;
    window.location.assign(routes.switchLocale(target, pathWithoutLocale(pathname)) + search);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 rounded-full px-3 text-ink-soft" aria-label={label}>
          <GlobeIcon className="size-4" />
          <span>{LOCALE_META[locale].label}</span>
          <ChevronDownIcon className="size-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44 border bg-card p-1.5 text-card-foreground shadow-lg">
        {LOCALES.map((item) => (
          <DropdownMenuItem key={item} onSelect={() => switchTo(item)} className="cursor-pointer justify-between rounded-md px-3 py-2 text-[0.95rem] focus:bg-sunken focus:text-foreground" lang={item}>
            {LOCALE_META[item].label}
            {item === locale && <CheckIcon className="size-4 text-accent-foreground" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { canGoBackInSite } from "@/lib/helpers/site-history";

type BackControlProps = {
  /** Where to go when the previous page isn't on this site (e.g. a source opened in a new tab): the nearest parent. */
  fallbackHref: string;
  label: string;
  dir: "rtl" | "ltr";
};

/** Goes back in history when the previous page is on this site; otherwise follows the link to the parent page. */
export function BackControl({ fallbackHref, label, dir }: BackControlProps) {
  const router = useRouter();
  // "Back" points against the reading direction: right in Arabic, left in English.
  const Icon = dir === "rtl" ? ArrowRightIcon : ArrowLeftIcon;

  return (
    <Link
      href={fallbackHref}
      aria-label={label}
      title={label}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        if (!canGoBackInSite()) return;
        event.preventDefault();
        router.back();
      }}
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border bg-card text-ink-soft transition-colors hover:border-primary/40 hover:text-accent-foreground"
    >
      <Icon className="size-4" />
    </Link>
  );
}

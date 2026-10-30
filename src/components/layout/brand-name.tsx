import type { Locale } from "@/lib/config/i18n";
import { cn } from "@/lib/utils";

/** The product name, written in the page's own language: «فتوى راج» in Arabic, FatwaRAG in English. */
const BRAND_PARTS: Record<Locale, [string, string]> = {
  ar: ["فتوى ", "راج"],
  en: ["Fatwa", "RAG"],
};

export function BrandName({ locale, className }: { locale: Locale; className?: string }) {
  const [base, accent] = BRAND_PARTS[locale];
  return (
    <span className={cn("tracking-tight", className)}>
      {base}
      <span className="text-accent-foreground">{accent}</span>
    </span>
  );
}

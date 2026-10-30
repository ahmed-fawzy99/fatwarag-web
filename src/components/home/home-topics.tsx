import Link from "next/link";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { listTopics } from "@/lib/data-access/catalog";

/** The first top-level topics on the home page. Hidden if the topic tree can't be loaded. */
export async function HomeTopics({ locale }: { locale: Locale }) {
  const topics = await listTopics().catch(() => []);
  if (topics.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {topics.slice(0, 9).map((topic) => (
        <li key={topic.key}>
          <Link
            href={routes.topic(locale, topic.key)}
            className="block h-full rounded-xl border bg-card px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:text-accent-foreground"
          >
            {(locale === "en" && topic.labelEn) || topic.labelAr}
          </Link>
        </li>
      ))}
    </ul>
  );
}

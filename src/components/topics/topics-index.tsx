import Link from "next/link";
import { PageTitle } from "@/components/common/page-title";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { listTopics } from "@/lib/data-access/catalog";
import { formatNumber } from "@/lib/helpers/format";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { formatPlural } from "@/lib/i18n/format";
import type { Topic } from "@/types/topic";

function label(topic: Topic, locale: Locale) {
  return (locale === "en" && topic.labelEn) || topic.labelAr;
}

/** The shared topic tree: top-level topics with their subtopics. */
export async function TopicsIndex({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const topics = await listTopics();

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={dict.topics.title} subtitle={dict.topics.subtitle} />
      {/* Masonry: cards keep their natural height and stack into columns instead of stretching to a row's tallest card. */}
      <div className="columns-1 gap-3 sm:columns-2">
        {topics.map((topic) => (
          <section key={topic.key} className="mb-3 flex break-inside-avoid flex-col gap-2 rounded-xl border bg-card p-4">
            <div className="flex items-baseline justify-between gap-2">
              <Link href={routes.topic(locale, topic.key)} className="font-semibold hover:text-accent-foreground">
                {label(topic, locale)}
              </Link>
              {topic.fatwaCount ? (
                <span className="text-xs text-muted-foreground">{formatPlural(dict.topics.fatwaCount, topic.fatwaCount, locale, formatNumber(topic.fatwaCount, locale))}</span>
              ) : null}
            </div>
            {topic.children.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {topic.children.map((child) => (
                  <li key={child.key}>
                    <Link
                      href={routes.topic(locale, child.key)}
                      className="inline-block rounded-full bg-sunken px-2.5 py-0.5 text-sm text-ink-soft transition-colors hover:text-accent-foreground"
                    >
                      {label(child, locale)}
                      {child.fatwaCount ? <span className="ms-1 text-xs text-accent-foreground">({formatNumber(child.fatwaCount, locale)})</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { FatwaList } from "@/components/common/fatwa-list";
import { PageTitle } from "@/components/common/page-title";
import { Pager } from "@/components/common/pager";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { findTopic } from "@/lib/data-access/catalog";
import { listFatwasByTopic } from "@/lib/data-access/fatwas";
import { findTopicPath } from "@/lib/data-access/topic-path";
import { topicCrumbs } from "@/lib/helpers/breadcrumbs";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Topic } from "@/types/topic";

function label(topic: Topic, locale: Locale) {
  return (locale === "en" && topic.labelEn) || topic.labelAr;
}

/** One topic: its subtopics (if any) and its fatwas. */
type TopicDetailProps = { locale: Locale; dict: Dictionary; topicKey: string; page: number };

export async function TopicDetail({ locale, dict, topicKey, page }: TopicDetailProps) {
  const match = await findTopic(topicKey);
  if (!match) notFound();
  const { topic } = match;
  const [{ data: fatwas, meta }, path] = await Promise.all([listFatwasByTopic(topic.key, locale, page), findTopicPath(topic.key)]);
  // A page past the end (an old or hand-typed link) is not a real page.
  if (page > meta.lastPage) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs locale={locale} strings={dict.nav} items={topicCrumbs(path ?? [topic], locale, dict.topics.title)} structuredData />
      <PageTitle title={label(topic, locale)} />

      {topic.children.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">{dict.topics.subtopics}</h2>
          <ul className="flex flex-wrap gap-1.5">
            {topic.children.map((child) => (
              <li key={child.key}>
                <Link href={routes.topic(locale, child.key)} className="inline-block rounded-full border bg-card px-3 py-1 text-sm hover:border-primary/40 hover:text-accent-foreground">
                  {label(child, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{dict.topics.fatwas}</h2>
        <FatwaList locale={locale} items={fatwas} emptyText={dict.topics.empty} translatedLabel={dict.fatwa.translated} />
        <Pager
          locale={locale}
          page={meta.page}
          lastPage={meta.lastPage}
          href={(target) => routes.topic(locale, topic.key, target)}
          strings={dict.topics}
        />
      </section>
    </div>
  );
}

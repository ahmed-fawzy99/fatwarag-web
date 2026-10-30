import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import type { Crumb } from "@/types/breadcrumb";
import type { Topic } from "@/types/topic";

/** «الموضوعات › فقه الأسرة › الطلاق»: the topics index, then each topic down the path, all linked. */
export function topicCrumbs(path: Topic[], locale: Locale, topicsLabel: string): Crumb[] {
  return [
    { label: topicsLabel, href: routes.topics(locale) },
    ...path.map((topic) => ({ label: (locale === "en" && topic.labelEn) || topic.labelAr, href: routes.topic(locale, topic.key) })),
  ];
}

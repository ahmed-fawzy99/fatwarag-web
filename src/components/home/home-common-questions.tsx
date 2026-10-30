import Link from "next/link";
import type { Locale } from "@/lib/config/i18n";
import { listCommonQuestionLinks } from "@/lib/data-access/common-questions";

/** The common questions on the home page, each a link to its (pre-generated) answer. Hidden if the list can't be loaded. */
export async function HomeCommonQuestions({ locale, title }: { locale: Locale; title: string }) {
  const questions = await listCommonQuestionLinks(locale).catch(() => []);
  if (questions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {questions.map(({ id, question, href }) => (
          <li key={id}>
            <Link
              href={href}
              className="block h-full rounded-xl border bg-card px-4 py-2.5 text-[0.95rem] text-ink-soft transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {question}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

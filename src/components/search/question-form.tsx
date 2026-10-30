"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, ArrowRightIcon, LoaderIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { track } from "@/lib/analytics/client";
import { EVENTS } from "@/lib/analytics/events";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LOCALE_META, type Locale } from "@/lib/config/i18n";
import { askLink } from "@/lib/data-access/ask-links";
import { createQuestionSchema, type QuestionInput } from "@/lib/zod-schemas/question";
import { cn } from "@/lib/utils";

export type QuestionFormStrings = {
  label: string;
  placeholder: string;
  submit: string;
  submitting: string;
  emptyError: string;
  tooShortError: string;
  /** Shown when the link to the answer couldn't be made. */
  linkError: string;
};

type QuestionFormProps = {
  locale: Locale;
  strings: QuestionFormStrings;
  defaultValue?: string;
  /** When set, the form asks a follow-up to this question instead of a new one. */
  followUpOf?: string;
  size?: "hero" | "default";
  /** Skip the "write your question first" error when the box is merely focused and left (home and follow-up boxes). */
  quietOnBlur?: boolean;
};

/** Spacing differences don't make a new question. */
function normalize(question: string): string {
  return question.trim().replace(/\s+/g, " ");
}

export function QuestionForm({ locale, strings, defaultValue = "", followUpOf, size = "default", quietOnBlur = false }: QuestionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const schema = createQuestionSchema({ empty: strings.emptyError, tooShort: strings.tooShortError });
  const form = useForm<QuestionInput>({
    resolver: zodResolver(schema),
    defaultValues: { question: defaultValue },
    mode: quietOnBlur ? "onSubmit" : "onTouched",
  });
  const error = form.formState.errors.question;
  const busy = isPending || form.formState.isSubmitting;
  const value = useWatch({ control: form.control, name: "question" }) ?? "";
  const canSubmit = value.trim().length > 0;
  // The question already on screen isn't searched again.
  const unchanged = !followUpOf && defaultValue !== "" && normalize(value) === normalize(defaultValue);
  const Arrow = LOCALE_META[locale].dir === "rtl" ? ArrowLeftIcon : ArrowRightIcon;

  async function submit({ question }: QuestionInput) {
    if (unchanged) return;
    // The link carries the question sealed (made on the server), never as plain text.
    const href = await askLink(locale, followUpOf ?? question, followUpOf ? question : null).catch(() => null);
    if (!href) {
      form.setError("question", { message: strings.linkError });
      return;
    }
    const length = question.trim().length;
    if (followUpOf) track(EVENTS.followUpAsked, { locale, length });
    else track(EVENTS.questionAsked, { locale, length, surface: size === "hero" ? "home" : "ask_page" });
    startTransition(() => router.push(href));
    if (followUpOf) form.reset({ question: "" });
  }

  function submitOnEnter(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void form.handleSubmit(submit)();
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-1.5">
      <label htmlFor={followUpOf ? "follow-up" : "question"} className="sr-only">
        {strings.label}
      </label>
      <div
        className={cn(
          "flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-xs transition-colors focus-within:border-primary/50",
          error && "border-destructive",
        )}
      >
        <Textarea
          id={followUpOf ? "follow-up" : "question"}
          rows={size === "hero" ? 3 : 1}
          placeholder={strings.placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "question-error" : undefined}
          className={cn(
            "min-h-0 resize-none border-0 bg-transparent px-2 py-1.5 text-[0.95rem] leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent",
            size === "hero" && "min-h-20",
          )}
          onKeyDown={submitOnEnter}
          {...form.register("question")}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={canSubmit ? -1 : 0}>
              <Button type="submit" disabled={!canSubmit || unchanged || busy} className="h-10 rounded-xl px-4">
                <span>{busy ? strings.submitting : strings.submit}</span>
                {busy ? <LoaderIcon className="animate-spin" /> : <Arrow className="size-4" />}
              </Button>
            </span>
          </TooltipTrigger>
          {!canSubmit && <TooltipContent>{strings.emptyError}</TooltipContent>}
        </Tooltip>
      </div>
      {error && (
        <p id="question-error" className="px-2 text-sm text-destructive">
          {error.message}
        </p>
      )}
    </form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import { EVENTS } from "@/lib/analytics/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTurnstile } from "@/hooks/use-turnstile";
import type { Locale } from "@/lib/config/i18n";
import { sendContactMessage } from "@/lib/data-access/contact";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { createContactSchema, type ContactInput } from "@/lib/zod-schemas/contact";
import { cn } from "@/lib/utils";

export function ContactForm({ locale, strings }: { locale: Locale; strings: Dictionary["contact"] }) {
  const schema = createContactSchema(strings);
  const form = useForm<ContactInput>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", message: "" },
    mode: "onTouched",
  });
  const { errors, isSubmitting, isValid } = form.formState;
  const { containerRef: turnstileRef, prepare: prepareTurnstile, getToken, reset: resetTurnstile } = useTurnstile({ locale, action: "contact" });

  async function send(values: ContactInput) {
    const turnstileToken = await getToken();
    const result = await sendContactMessage({ ...values, locale, turnstileToken }).catch(() => ({ ok: false as const }));
    resetTurnstile();
    if (result.ok) {
      track(EVENTS.contactSubmitted, { locale, message_length: values.message.length });
      toast.success(strings.success);
      form.reset();
    } else {
      toast.error(strings.error);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(send)} onFocus={prepareTurnstile} noValidate className="flex flex-col gap-4 rounded-2xl border bg-card px-5 py-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-name">{strings.name}</Label>
          <Input id="contact-name" placeholder={strings.namePlaceholder} {...form.register("name")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-email">
            {strings.email} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact-email"
            type="email"
            dir="ltr"
            placeholder={strings.emailPlaceholder}
            aria-invalid={Boolean(errors.email)}
            className={cn(errors.email && "border-destructive")}
            {...form.register("email")}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-message">
          {strings.message} <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="contact-message"
          rows={6}
          placeholder={strings.messagePlaceholder}
          aria-invalid={Boolean(errors.message)}
          className={cn(errors.message && "border-destructive")}
          {...form.register("message")}
        />
        {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
      </div>

      <div ref={turnstileRef} className="empty:hidden" />

      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={isValid ? -1 : 0} className="w-fit">
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting && <LoaderIcon className="animate-spin" />}
              {isSubmitting ? strings.submitting : strings.submit}
            </Button>
          </span>
        </TooltipTrigger>
        {!isValid && <TooltipContent>{strings.disabledHint}</TooltipContent>}
      </Tooltip>
    </form>
  );
}

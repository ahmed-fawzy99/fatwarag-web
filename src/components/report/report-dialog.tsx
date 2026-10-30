"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FlagIcon, LoaderIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import { EVENTS } from "@/lib/analytics/events";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTurnstile } from "@/hooks/use-turnstile";
import { REPORT_REASONS } from "@/lib/config/constants";
import type { Locale } from "@/lib/config/i18n";
import { submitReport } from "@/lib/data-access/reports";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { createReportSchema, type ReportInput } from "@/lib/zod-schemas/report";
import { cn } from "@/lib/utils";
import type { ReportReason, ReportTarget } from "@/types/report";

type ReportDialogProps = {
  locale: Locale;
  target: ReportTarget;
  triggerLabel: string;
  strings: Dictionary["report"];
  defaultReason?: ReportReason;
};

export function ReportDialog({ locale, target, triggerLabel, strings, defaultReason }: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const schema = createReportSchema({ reasonRequired: strings.reasonRequired, commentTooLong: strings.commentTooLong });
  const form = useForm<ReportInput>({
    resolver: zodResolver(schema),
    defaultValues: { reason: defaultReason, comment: "" },
    mode: "onTouched",
  });
  const { isSubmitting, isValid, errors } = form.formState;
  const { containerRef: turnstileRef, getToken, reset: resetTurnstile } = useTurnstile({ locale, action: "report", autoStart: true, active: open });

  async function send(values: ReportInput) {
    const turnstileToken = await getToken();
    const result = await submitReport({
      target,
      reason: values.reason,
      comment: values.comment,
      locale,
      pageUrl: window.location.href,
      turnstileToken,
    }).catch(() => ({ ok: false as const }));
    if (result.ok) {
      track(EVENTS.reportSubmitted, { locale, target_kind: target.kind, reason: values.reason, comment_length: values.comment?.length ?? 0 });
      toast.success(strings.success);
      setOpen(false);
      form.reset({ reason: defaultReason, comment: "" });
    } else {
      toast.error(strings.error);
      resetTurnstile();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive">
          <FlagIcon className="size-3.5" />
          {triggerLabel}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(event) => event.preventDefault()}>
        <form onSubmit={form.handleSubmit(send)} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{strings.title}</DialogTitle>
            <DialogDescription>{strings.description}</DialogDescription>
          </DialogHeader>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">
              {strings.reasonLabel} <span className="text-destructive">*</span>
            </legend>
            <Controller
              control={form.control}
              name="reason"
              render={({ field }) => (
                <RadioGroup value={field.value ?? ""} onValueChange={field.onChange} onBlur={field.onBlur} className="gap-1.5">
                  {REPORT_REASONS.map((reason) => (
                    <Label
                      key={reason}
                      htmlFor={`reason-${reason}`}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg border bg-background px-3 py-2.5 font-normal transition-colors hover:bg-sunken has-data-checked:border-primary/50 has-data-checked:bg-accent"
                    >
                      <RadioGroupItem id={`reason-${reason}`} value={reason} />
                      {strings.reasons[reason]}
                    </Label>
                  ))}
                </RadioGroup>
              )}
            />
            {errors.reason && form.formState.isSubmitted && <p className="text-sm text-destructive">{errors.reason.message}</p>}
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label htmlFor="report-comment">{strings.commentLabel}</Label>
            <Textarea
              id="report-comment"
              rows={3}
              placeholder={strings.commentPlaceholder}
              aria-invalid={Boolean(errors.comment)}
              className={cn("bg-background", errors.comment && "border-destructive")}
              {...form.register("comment")}
            />
            {errors.comment && <p className="text-sm text-destructive">{errors.comment.message}</p>}
          </div>

          <div ref={turnstileRef} className="empty:hidden" />

          <DialogFooter className="gap-2 sm:justify-start">
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={isValid ? -1 : 0}>
                  <Button type="submit" disabled={!isValid || isSubmitting}>
                    {isSubmitting && <LoaderIcon className="animate-spin" />}
                    {isSubmitting ? strings.submitting : strings.submit}
                  </Button>
                </span>
              </TooltipTrigger>
              {!isValid && <TooltipContent>{strings.disabledHint}</TooltipContent>}
            </Tooltip>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {strings.cancel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { CheckIcon, CopyIcon, LoaderIcon, Share2Icon } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { track } from "@/lib/analytics/client";
import { EVENTS } from "@/lib/analytics/events";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTurnstile } from "@/hooks/use-turnstile";
import type { Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { createShare } from "@/lib/data-access/share-actions";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type ShareDialogProps = {
  answerId: string;
  locale: Locale;
  strings: Dictionary["share"];
};

/** How long «Copied» shows on the copy button. */
const COPIED_MS = 2000;

/**
 * «مشاركة»: explains that sharing saves the question and answer on a public page, and only on «موافق، أنشئ رابطًا»
 * (behind Turnstile) saves it and shows the link: as selectable text, with a copy button and the device's own share
 * sheet where there is one. Reopening shows the same link rather than saving the answer again.
 */
export function ShareDialog({ answerId, locale, strings }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const linkRef = useRef<HTMLInputElement>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { containerRef: turnstileRef, getToken, reset: resetTurnstile } = useTurnstile({ locale, action: "share", autoStart: true, active: open && !url });

  async function create() {
    setCreating(true);
    setError(null);
    const result = await createShare(answerId, locale, await getToken()).catch(() => ({ ok: false as const, code: "unavailable" as const }));
    setCreating(false);
    track(EVENTS.shareConsented, { locale, created: result.ok, ...(result.ok ? {} : { error: result.code }) });
    if (result.ok) {
      setUrl(result.url);
      return;
    }
    setError(result.code === "rate_limited" ? strings.rateLimited : result.code === "not_found" ? strings.expired : strings.error);
    resetTurnstile();
  }

  function selectLink() {
    linkRef.current?.focus();
    linkRef.current?.select();
  }

  async function copyLink() {
    if (!url) return;
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    try {
      await navigator.clipboard.writeText(url);
      setCopy("copied");
      track(EVENTS.shareLinkCopied, { locale, method: "copy" });
      copiedTimer.current = setTimeout(() => setCopy("idle"), COPIED_MS);
    } catch {
      setCopy("failed");
      selectLink();
    }
  }

  async function shareNatively() {
    if (!url) return;
    // Cancelling the share sheet rejects; nothing to do then.
    const shared = await navigator.share({ url }).then(() => true, () => false);
    if (shared) track(EVENTS.shareLinkCopied, { locale, method: "native" });
  }

  const canShareNatively = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next && !open) track(EVENTS.shareStarted, { locale });
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent-foreground">
          {strings.button}
          <Share2Icon className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{strings.title}</DialogTitle>
          <DialogDescription>
            {url ? strings.ready : strings.notice}
            {!url && (
              <>
                {" "}
                <Link href={routes.privacy(locale)} target="_blank" className="quote-link">
                  {strings.privacyLink}
                </Link>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {url ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="share-link">{strings.linkLabel}</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={linkRef}
                id="share-link"
                readOnly
                dir="ltr"
                value={url}
                onFocus={(event) => event.currentTarget.select()}
                className="h-9 bg-background font-mono text-sm select-all"
              />
              <Button type="button" variant="outline" onClick={copyLink} className="h-9 shrink-0" aria-live="polite">
                {copy === "copied" ? strings.copied : strings.copy}
                {copy === "copied" ? <CheckIcon /> : <CopyIcon />}
              </Button>
            </div>
            {copy === "failed" && <p className="text-sm text-muted-foreground">{strings.copyFailed}</p>}
          </div>
        ) : (
          <>
            <div ref={turnstileRef} className="empty:hidden" />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </>
        )}

        <DialogFooter className="gap-2 sm:justify-start">
          {url ? (
            <>
              {canShareNatively && (
                <Button type="button" onClick={shareNatively}>
                  {strings.nativeShare}
                  <Share2Icon />
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {strings.close}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" onClick={create} disabled={creating}>
                {creating ? strings.creating : strings.confirm}
                {creating && <LoaderIcon className="animate-spin" />}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {strings.cancel}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

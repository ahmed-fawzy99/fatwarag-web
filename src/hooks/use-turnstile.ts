"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/config/i18n";
import { loadTurnstile, type TurnstileApi } from "@/lib/helpers/turnstile";

type UseTurnstileOptions = {
  locale: Locale;
  /** Shown in Cloudflare analytics, e.g. "report", "contact". */
  action: string;
  /** Run the check as soon as the widget is ready (report dialog) instead of on first use. */
  autoStart?: boolean;
  /** False while the widget's container isn't mounted (e.g. a closed dialog). */
  active?: boolean;
};

type Waiter = (token: string | null) => void;

/**
 * Cloudflare Turnstile in managed mode. The widget stays invisible unless Cloudflare needs the visitor
 * to interact, and only runs its check once the form is used (or right away with `autoStart`).
 */
export function useTurnstile({ locale, action, autoStart = false, active = true }: UseTurnstileOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const api = useRef<TurnstileApi | null>(null);
  const widgetId = useRef<string | null>(null);
  const token = useRef<string | null>(null);
  const running = useRef(false);
  /** After an error the widget must be reset before it can run again. */
  const errored = useRef(false);
  const waiters = useRef<Waiter[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    let cancelled = false;
    if (!active) return;

    function settle(value: string | null) {
      running.current = false;
      token.current = value;
      const pending = waiters.current;
      waiters.current = [];
      pending.forEach((resolve) => resolve(value));
    }

    function fail() {
      settle(null);
      setFailed(true);
    }

    if (!siteKey) {
      queueMicrotask(fail);
      return;
    }

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        api.current = turnstile;
        widgetId.current =
          turnstile.render(containerRef.current, {
            sitekey: siteKey,
            action,
            language: locale,
            appearance: "interaction-only",
            execution: "execute",
            "refresh-expired": "auto",
            callback: (value) => {
              setFailed(false);
              settle(value);
            },
            "expired-callback": () => {
              token.current = null;
            },
            "error-callback": () => {
              errored.current = true;
              fail();
              return true;
            },
          }) ?? null;
        if (autoStart && widgetId.current) {
          running.current = true;
          turnstile.execute(widgetId.current);
        }
      })
      .catch(() => {
        if (!cancelled) fail();
      });

    return () => {
      cancelled = true;
      if (widgetId.current) api.current?.remove(widgetId.current);
      widgetId.current = null;
      token.current = null;
      running.current = false;
      errored.current = false;
    };
  }, [locale, action, autoStart, active]);

  /** Starts the check early (e.g. when the visitor focuses the form) so a token is ready on submit. */
  function prepare() {
    if (token.current || running.current || !api.current || !widgetId.current) return;
    if (errored.current) {
      errored.current = false;
      api.current.reset(widgetId.current);
    }
    running.current = true;
    api.current.execute(widgetId.current);
  }

  /** Resolves with a fresh token, or null if none arrives in time (the API then asks again). */
  function getToken(timeoutMs = 8000): Promise<string | null> {
    if (token.current) return Promise.resolve(token.current);
    prepare();
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        waiters.current = waiters.current.filter((waiter) => waiter !== done);
        resolve(null);
      }, timeoutMs);
      const done: Waiter = (value) => {
        clearTimeout(timer);
        resolve(value);
      };
      waiters.current.push(done);
    });
  }

  /** Tokens are single-use: call after each submission so the next one gets a new token. */
  function reset() {
    token.current = null;
    running.current = false;
    errored.current = false;
    if (api.current && widgetId.current) api.current.reset(widgetId.current);
  }

  return { containerRef, prepare, getToken, reset, failed };
}

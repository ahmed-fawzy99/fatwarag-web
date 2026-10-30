import type { PostHog } from "posthog-js";
import { EVENTS, type AnalyticsEvent, type EventName, type EventProps } from "./events";
import { maskEventProperties, scrubProps } from "./privacy";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

/** Same-origin path that next.config.ts rewrites to PostHog (ad blockers and privacy settings leave it alone). */
export const INGEST_PATH = "/ingest";

let posthog: Promise<PostHog> | null = null;

/** Analytics is on only when the key is set; with no key nothing is loaded and nothing is sent. */
export const analyticsEnabled = Boolean(KEY);

/**
 * Starts PostHog once, in the browser. Cookieless (memory-only persistence), no session recording, no autocapture,
 * no feature flags or surveys, no person profiles. Pageviews are sent on every client navigation, with the sealed
 * ask link masked. The library is imported only here, so with no key it is never even downloaded.
 */
export function initAnalytics(): void {
  if (typeof window === "undefined" || posthog) return;
  // No key: fully off (no warning, nothing loaded). The owner turns analytics on by setting it.
  if (!KEY) return;
  const key = KEY;
  posthog = import("posthog-js").then(({ default: client }) => {
    client.init(key, {
      api_host: INGEST_PATH,
      // The PostHog app host, from the ingest host (eu.i.posthog.com → eu.posthog.com).
      ui_host: (HOST || "https://eu.i.posthog.com").replace(".i.posthog.com", ".posthog.com"),
      persistence: "memory",
      person_profiles: "identified_only",
      capture_pageview: "history_change",
      capture_pageleave: false,
      autocapture: false,
      capture_dead_clicks: false,
      capture_heatmaps: false,
      // Set here so the project's remote settings can't switch them on.
      capture_performance: false,
      capture_exceptions: false,
      disable_session_recording: true,
      disable_surveys: true,
      advanced_disable_flags: true,
      respect_dnt: true,
      before_send: (event) => (event ? { ...event, properties: maskEventProperties(event.properties ?? {}) } : event),
    });
    return client;
  });
}

/** Sends one event. Does nothing without a key. Never throws and never blocks the page. */
export function track<K extends EventName>(name: K, props: EventProps[K]): void {
  if (!posthog) return;
  // Full page loads (the language switch) end the page right after the event, so those go out at once.
  const instant = name === EVENTS.languageSwitched;
  void posthog
    .then((client) => client.capture(name, scrubProps(props), instant ? { send_instantly: true, transport: "sendBeacon" } : undefined))
    .catch(() => undefined);
}

/** `track` for an event held as a value (see `TrackOnMount`, `TrackedAnchor`). */
export function trackEvent(event: AnalyticsEvent): void {
  // The union keeps name and props paired; TypeScript can't carry that pairing through a generic call.
  track(event.name, event.props as never);
}

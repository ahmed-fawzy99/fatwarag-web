import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import { parseAskLinkKeys } from "./src/lib/answer/ask-link-keys.ts";

/**
 * PostHog goes through our own origin (/ingest) so browsers and blockers see first-party requests. The region comes from
 * NEXT_PUBLIC_POSTHOG_HOST (https://eu.i.posthog.com: the project is on PostHog EU). No key, no proxy.
 */
const posthogEnabled = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
const posthogHost = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com").replace(/\/$/, "");
const posthogAssetsHost = posthogHost.replace("://eu.", "://eu-assets.").replace("://us.", "://us-assets.");

const nextConfig: NextConfig = {
  /* config options here */
  // PostHog's endpoints end in a slash (/ingest/e/); Next must not redirect them.
  skipTrailingSlashRedirect: posthogEnabled,
  async rewrites() {
    if (!posthogEnabled) return [];
    return {
      beforeFiles: [
        { source: "/ingest/static/:path*", destination: `${posthogAssetsHost}/static/:path*` },
        { source: "/ingest/:path*", destination: `${posthogHost}/:path*` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default function config(phase: string): NextConfig {
  // Ask links are sealed with ASK_LINK_KEY: without it the site would have to put questions in URLs, so start-up
  // (dev server or build) fails loudly instead. Env files are loaded before this runs.
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) parseAskLinkKeys(process.env.ASK_LINK_KEY);
  // The production site's canonical links, sitemaps, robots.txt and share links come from NEXT_PUBLIC_SITE_URL (inlined at
  // build time): without it they would point at localhost, so the production build fails instead.
  if (phase === PHASE_PRODUCTION_BUILD && process.env.VERCEL_ENV === "production" && !process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not set. Set it in the production environment (e.g. https://fatwarag.com).");
  }
  return nextConfig;
}

import { initAnalytics } from "@/lib/analytics/client";

// Runs once in the browser before the app hydrates. A no-op unless NEXT_PUBLIC_POSTHOG_KEY is set.
initAnalytics();
